package com.ssafy.s14p11a707.config;

import com.google.genai.Client;
import com.google.genai.types.HttpOptions;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.ai.google.genai.GoogleGenAiEmbeddingConnectionDetails;
import org.springframework.ai.google.genai.text.GoogleGenAiTextEmbeddingModel;
import org.springframework.ai.google.genai.text.GoogleGenAiTextEmbeddingOptions;
import org.springframework.ai.google.genai.text.GoogleGenAiTextEmbeddingOptions.TaskType;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class AiConfig {

    @Value("${spring.ai.google.genai.api-key}")
    private String genAiApiKey;

    @Value("${spring.ai.google.genai.base-url}")
    private String genAiBaseUrl;

    @Value("${spring.ai.google.genai.project-id:unused}")
    private String genAiProjectId;

    @Bean
    Client googleGenAiClient() {
        return Client.builder()
                .apiKey(genAiApiKey)
                .httpOptions(HttpOptions.builder().baseUrl(genAiBaseUrl).build())
                .build();
    }

    @Bean
    ChatModel googleGenAiChatModel(Client googleGenAiClient) {
        GoogleGenAiChatOptions options = GoogleGenAiChatOptions.builder()
                .model("gemini-2.0-flash")
                .temperature(0.7)
                .maxOutputTokens(10000)
                .build();

        return GoogleGenAiChatModel.builder()
                .genAiClient(googleGenAiClient)
                .defaultOptions(options)
                .build();
    }


    @Bean
    public GoogleGenAiEmbeddingConnectionDetails googleGenAiEmbeddingConnectionDetails() {
        return GoogleGenAiEmbeddingConnectionDetails.builder()
                .apiKey(genAiApiKey)
                .projectId(genAiProjectId)
                .build();
    }

    @Bean
    EmbeddingModel embeddingModel(GoogleGenAiEmbeddingConnectionDetails connectionDetails) {
        GoogleGenAiTextEmbeddingOptions options = GoogleGenAiTextEmbeddingOptions.builder()
                .model("gemini-embedding-001")
                .taskType(TaskType.RETRIEVAL_DOCUMENT)
                .build();

        return new GoogleGenAiTextEmbeddingModel(connectionDetails, options);
    }


    @Bean
    ChatClient genAiChatClient(
            @Qualifier("googleGenAiChatModel") ChatModel chatModel) {
        var loggerAdvisor = SimpleLoggerAdvisor.builder()
                .order(Ordered.LOWEST_PRECEDENCE - 1)
                .build();

        return ChatClient.builder(chatModel)
                .defaultOptions(ChatOptions.builder()
                        .temperature(0.7)
                        .maxTokens(10000)
                        .build())
                .defaultAdvisors(loggerAdvisor)
                .build();
    }

}
