package com.ssafy.s14p11a707.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.Ordered;

@Configuration
@Slf4j
public class AiConfig {

    @Value("${GMS_MODEL:${gms.model:gpt-5-mini}}")
    private String gmsModel;

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
     * GMS_MODEL 값에 따라 OpenAI 호환 또는 Google GenAI ChatModel을 자동 선택
     */
    @Bean
    ChatClient gmsChatClient(
            @Qualifier("openAiChatModel") ObjectProvider<ChatModel> openAiChatModelProvider,
            @Qualifier("googleGenAiChatModel") ObjectProvider<ChatModel> googleGenAiChatModelProvider) {

        ChatModel selectedModel = selectGmsChatModel(openAiChatModelProvider, googleGenAiChatModelProvider);

        var loggerAdvisor = SimpleLoggerAdvisor.builder()
                .order(Ordered.LOWEST_PRECEDENCE - 1)
                .build();

        return ChatClient.builder(selectedModel)
                .defaultOptions(ChatOptions.builder()
                        .model(gmsModel)
                        .build())
                .defaultAdvisors(loggerAdvisor)
                .build();
    }

    private ChatModel selectGmsChatModel(
            ObjectProvider<ChatModel> openAiChatModelProvider,
            ObjectProvider<ChatModel> googleGenAiChatModelProvider
    ) {
        if (isGeminiModel(gmsModel)) {
            ChatModel googleModel = googleGenAiChatModelProvider.getIfAvailable();
            if (googleModel == null) {
                throw new IllegalStateException(
                        "GMS_MODEL is Gemini but googleGenAiChatModel is unavailable. Check spring.ai.google.genai settings."
                );
            }
            log.info("[GMS] gmsChatClient provider=google-genai, model={}", gmsModel);
            return googleModel;
        }

        ChatModel openAiModel = openAiChatModelProvider.getIfAvailable();
        if (openAiModel == null) {
            throw new IllegalStateException(
                    "openAiChatModel is unavailable. Check spring.ai.openai settings."
            );
        }
        log.info("[GMS] gmsChatClient provider=openai-compat, model={}", gmsModel);
        return openAiModel;
    }

    private boolean isGeminiModel(String model) {
        return model != null && model.trim().toLowerCase().startsWith("gemini");
    }

}
