package com.ssafy.s14p11a707.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.Ordered;
import org.springframework.web.client.RestClient;

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
     * GMS는 OpenAI 호환 API를 제공합니다
     */
    @Bean
    ChatClient gmsChatClient(
            @Value("${gms.url}") String gmsUrl,
            @Value("${gms.key}") String gmsKey,
            @Value("${gms.model}") String gmsModel) {

        // OpenAI API용 RestClient 생성
        RestClient restClient = RestClient.builder()
                .baseUrl(gmsUrl)
                .defaultHeader("Authorization", "Bearer " + gmsKey)
                .build();

        // OpenAI API 인스턴스 생성
        OpenAiApi openAiApi = new OpenAiApi(gmsUrl, restClient);

        // OpenAI ChatModel 생성
        OpenAiChatModel chatModel = new OpenAiChatModel(openAiApi,
                OpenAiChatOptions.builder()
                        .withModel(gmsModel)
                        .withTemperature(0.8)
                        .withMaxTokens(2000)
                        .build());

        // ChatClient 빌드
        var loggerAdvisor = SimpleLoggerAdvisor.builder()
                .order(Ordered.LOWEST_PRECEDENCE - 1)
                .build();

        return ChatClient.builder(chatModel)
                .defaultAdvisors(loggerAdvisor)
                .build();
    }

}
