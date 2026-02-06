package com.ssafy.s14p11a707.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.Ordered;

@Configuration
public class AiConfig {

    /**
     * 시나리오 생성용 ChatClient (기존 - maxTokens 10000, temperature 0.7)
     */
    @Bean
    @Primary
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

    /**
     * 채팅용 ChatClient (낮은 maxTokens, 모델 오버라이드 가능)
     */
    @Bean("chatChatClient")
    ChatClient chatChatClient(
            @Qualifier("googleGenAiChatModel") ChatModel chatModel,
            @Value("${app.ai.chat.model:gemini-2.5-flash}") String model,
            @Value("${app.ai.chat.max-tokens:500}") int maxTokens) {
        return ChatClient.builder(chatModel)
                .defaultOptions(ChatOptions.builder()
                        .model(model)
                        .temperature(0.7)
                        .maxTokens(maxTokens)
                        .build())
                .build();
    }

    /**
     * API 키 Round-Robin 로테이터 (다중 무료 키로 RPM/RPD 확장)
     */
    @Bean
    ApiKeyRotator apiKeyRotator(
            @Value("${app.ai.api-keys:}") String apiKeysStr) {
        List<String> keys = Arrays.stream(apiKeysStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        if (keys.isEmpty()) {
            keys = List.of("unset");
        }
        return new ApiKeyRotator(keys);
    }
}
