package com.ssafy.s14p11a707.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.ai.google.genai.common.GoogleGenAiThinkingLevel;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.Ordered;

@Configuration
public class AiConfig {
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

    @Bean
    ChatClient scenarioGenChatClient(
            @Qualifier("googleGenAiChatModel") ChatModel chatModel
    ) {
        var loggerAdvisor = SimpleLoggerAdvisor.builder()
                .order(Ordered.LOWEST_PRECEDENCE - 1)
                .build();

        return ChatClient.builder(chatModel)
                .defaultOptions(GoogleGenAiChatOptions.builder()
                        .model("gemini-3-pro-preview")
                        .temperature(0.7)
                        .maxOutputTokens(10000)
                        .thinkingLevel(GoogleGenAiThinkingLevel.HIGH)
                        .responseMimeType("application/json")
                        .build())
                .defaultAdvisors(loggerAdvisor)
                .build();
    }
}
