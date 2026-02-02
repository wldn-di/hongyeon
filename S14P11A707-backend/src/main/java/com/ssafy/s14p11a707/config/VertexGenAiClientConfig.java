package com.ssafy.s14p11a707.config;

import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.genai.Client;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.google.genai.GoogleGenAiEmbeddingConnectionDetails;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.util.Assert;
import org.springframework.util.StringUtils;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(VertexAiProperties.class)
@Slf4j
public class VertexGenAiClientConfig {

    private static final String CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

    @Bean
    @Primary
    @ConditionalOnProperty(name = "app.vertex.enabled", havingValue = "true")
    Client vertexGenAiClient(VertexAiProperties properties) throws IOException {
        Assert.hasText(properties.projectId(), "app.vertex.project-id must be set when app.vertex.enabled=true");
        Assert.hasText(properties.location(), "app.vertex.location must be set when app.vertex.enabled=true");

        GoogleCredentials credentials = resolveCredentials(properties);

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
    GoogleGenAiEmbeddingConnectionDetails vertexEmbeddingConnectionDetails(VertexAiProperties properties, Client vertexGenAiClient) {
        return GoogleGenAiEmbeddingConnectionDetails.builder()
                .projectId(properties.projectId())
                .location(properties.location())
                .genAiClient(vertexGenAiClient)
                .build();
    }

    private GoogleCredentials resolveCredentials(VertexAiProperties properties) throws IOException {
        GoogleCredentials credentials;
        if (StringUtils.hasText(properties.credentialsUri())) {
            String location = properties.credentialsUri();
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
        } else if (StringUtils.hasText(properties.accessToken())) {
            Instant expiresAt = Instant.now().plus(Duration.ofMinutes(55));
            credentials = GoogleCredentials.create(new AccessToken(properties.accessToken(), Date.from(expiresAt)));
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
