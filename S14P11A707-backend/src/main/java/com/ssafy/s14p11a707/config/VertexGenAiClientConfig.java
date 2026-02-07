package com.ssafy.s14p11a707.config;

import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.genai.Client;
import com.ssafy.s14p11a707.vertex.VertexAiAccount;
import com.ssafy.s14p11a707.vertex.VertexAiAccountPool;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.Semaphore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.ai.google.genai.GoogleGenAiEmbeddingConnectionDetails;
import org.springframework.ai.google.genai.common.GoogleGenAiThinkingLevel;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.Ordered;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.util.Assert;
import org.springframework.util.StringUtils;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(VertexAiPoolProperties.class)
@Slf4j
public class VertexGenAiClientConfig {

    private static final String CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
    private static final String DEFAULT_MODEL = "gemini-2.5-flash";

    @Bean
    @Primary
    @ConditionalOnProperty(name = "app.vertex.enabled", havingValue = "true")
    Client vertexGenAiClient(VertexAiPoolProperties properties) throws IOException {
        Assert.hasText(properties.projectId(), "app.vertex.project-id must be set when app.vertex.enabled=true");
        Assert.hasText(properties.location(), "app.vertex.location must be set when app.vertex.enabled=true");

        GoogleCredentials credentials = resolveCredentials(properties.credentialsUri(), properties.accessToken());

        log.info(
                "[ai] Vertex GenAI client enabled. projectId={}, location={}",
                properties.projectId(),
                properties.location()
        );

        return Client.builder()
                .vertexAI(true)
                .project(properties.projectId())
                .location(properties.location())
                .credentials(credentials)
                .build();
    }

    @Bean
    @Primary
    @ConditionalOnProperty(name = "app.vertex.enabled", havingValue = "true")
    GoogleGenAiEmbeddingConnectionDetails vertexEmbeddingConnectionDetails(VertexAiPoolProperties properties, Client vertexGenAiClient) {
        return GoogleGenAiEmbeddingConnectionDetails.builder()
                .projectId(properties.projectId())
                .location(properties.location())
                .genAiClient(vertexGenAiClient)
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "app.vertex.enabled", havingValue = "true")
    VertexAiAccountPool vertexAiAccountPool(VertexAiPoolProperties properties) throws IOException {
        int semaphorePerAccount = properties.semaphorePerAccount() > 0 ? properties.semaphorePerAccount() : 4;
        List<VertexAiPoolProperties.AccountEntry> entries = properties.accounts();
        GoogleGenAiChatOptions defaultChatOptions = buildVertexChatOptions(properties);

        List<VertexAiAccount> accounts = new ArrayList<>();

        if (entries != null && !entries.isEmpty()) {
            for (VertexAiPoolProperties.AccountEntry entry : entries) {
                if (!StringUtils.hasText(entry.projectId()) || !StringUtils.hasText(entry.location())) {
                    log.warn("[VertexPool] skipping account '{}': missing projectId or location", entry.name());
                    continue;
                }
                try {
                    GoogleCredentials creds = resolveCredentials(entry.credentialsUri(), entry.accessToken());
                    Client client = Client.builder()
                            .vertexAI(true)
                            .project(entry.projectId())
                            .location(entry.location())
                            .credentials(creds)
                            .build();

                    GoogleGenAiChatModel chatModel = GoogleGenAiChatModel.builder()
                            .genAiClient(client)
                            .defaultOptions(defaultChatOptions)
                            .build();
                    var loggerAdvisor = SimpleLoggerAdvisor.builder()
                            .order(Ordered.LOWEST_PRECEDENCE - 1)
                            .build();
                    ChatClient chatClient = ChatClient.builder(chatModel)
                            .defaultAdvisors(loggerAdvisor)
                            .build();

                    accounts.add(new VertexAiAccount(
                            entry.name(),
                            chatClient,
                            new Semaphore(semaphorePerAccount, true)
                    ));
                    log.info("[VertexPool] account '{}' registered (project={}, location={}, semaphore={})",
                            entry.name(), entry.projectId(), entry.location(), semaphorePerAccount);
                } catch (Exception e) {
                    log.error("[VertexPool] failed to create account '{}': {}", entry.name(), e.getMessage(), e);
                }
            }
        }

        // fallback: use legacy single account if no accounts configured
        if (accounts.isEmpty()) {
            log.info("[VertexPool] no accounts configured, falling back to legacy single account");
            Assert.hasText(properties.projectId(), "app.vertex.project-id must be set");
            Assert.hasText(properties.location(), "app.vertex.location must be set");

            GoogleCredentials creds = resolveCredentials(properties.credentialsUri(), properties.accessToken());
            Client client = Client.builder()
                    .vertexAI(true)
                    .project(properties.projectId())
                    .location(properties.location())
                    .credentials(creds)
                    .build();

            GoogleGenAiChatModel chatModel = GoogleGenAiChatModel.builder()
                    .genAiClient(client)
                    .defaultOptions(defaultChatOptions)
                    .build();
            var loggerAdvisor = SimpleLoggerAdvisor.builder()
                    .order(Ordered.LOWEST_PRECEDENCE - 1)
                    .build();
            ChatClient chatClient = ChatClient.builder(chatModel)
                    .defaultAdvisors(loggerAdvisor)
                    .build();

            accounts.add(new VertexAiAccount(
                    "vertex-legacy",
                    chatClient,
                    new Semaphore(semaphorePerAccount, true)
            ));
        }

        return new VertexAiAccountPool(accounts, properties.rpm());
    }

    private GoogleGenAiChatOptions buildVertexChatOptions(VertexAiPoolProperties properties) {
        String model = StringUtils.hasText(properties.model()) ? properties.model() : DEFAULT_MODEL;
        GoogleGenAiChatOptions.Builder builder = GoogleGenAiChatOptions.builder()
                .model(model)
                .temperature(0.7)
                .maxOutputTokens(14000);

        if (StringUtils.hasText(properties.thinkingLevel())) {
            String rawThinkingLevel = properties.thinkingLevel().trim();
            try {
                GoogleGenAiThinkingLevel thinkingLevel =
                        GoogleGenAiThinkingLevel.valueOf(rawThinkingLevel.toUpperCase(Locale.ROOT));
                builder.thinkingLevel(thinkingLevel);
                log.info("[VertexPool] thinking-level enabled: {}", thinkingLevel);
            } catch (IllegalArgumentException e) {
                log.warn(
                        "[VertexPool] invalid app.vertex.thinking-level='{}'. allowed={}. Thinking disabled.",
                        rawThinkingLevel,
                        Arrays.toString(GoogleGenAiThinkingLevel.values())
                );
            }
        }

        if (properties.includeThoughts()) {
            builder.includeThoughts(true);
            log.info("[VertexPool] include-thoughts enabled");
        }

        log.info("[VertexPool] chat model={}", model);
        return builder.build();
    }

    private GoogleCredentials resolveCredentials(String credentialsUri, String accessToken) throws IOException {
        GoogleCredentials credentials;
        if (StringUtils.hasText(credentialsUri)) {
            String location = credentialsUri;
            if (location.startsWith("file:") || location.startsWith("classpath:")) {
                var resource = new DefaultResourceLoader().getResource(location);
                try (var in = resource.getInputStream()) {
                    credentials = GoogleCredentials.fromStream(in);
                }
            } else {
                Path path = Path.of(location);
                try (var in = Files.newInputStream(path)) {
                    credentials = GoogleCredentials.fromStream(in);
                }
            }
            log.info("[ai] Vertex credentials loaded from credentials-uri.");
        } else if (StringUtils.hasText(accessToken)) {
            Instant expiresAt = Instant.now().plus(Duration.ofMinutes(55));
            credentials = GoogleCredentials.create(new AccessToken(accessToken, Date.from(expiresAt)));
            log.info("[ai] Vertex credentials loaded from access-token.");
        } else {
            credentials = GoogleCredentials.getApplicationDefault();
            log.info("[ai] Vertex credentials loaded from application-default (ADC).");
        }

        if (credentials.createScopedRequired()) {
            credentials = credentials.createScoped(CLOUD_PLATFORM_SCOPE);
        }
        return credentials;
    }
}
