package com.ssafy.s14p11a707.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.Ordered;

@Configuration
public class AiConfig {

    /**
     * Google Gemini용 ChatClient (기존)
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
     * GMS용 ChatClient (채팅 전용)
     * Spring Boot Auto Configuration으로 생성된 OpenAI ChatModel 사용
     */
    @Bean
    ChatClient gmsChatClient(
            @Qualifier("openAiChatModel") ChatModel openAiChatModel) {

        var loggerAdvisor = SimpleLoggerAdvisor.builder()
                .order(Ordered.LOWEST_PRECEDENCE - 1)
                .build();

        return ChatClient.builder(openAiChatModel)
                .defaultAdvisors(loggerAdvisor)
                .build();
    }

}
