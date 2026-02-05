package com.ssafy.s14p11a707.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.ai.google.genai.common.GoogleGenAiThinkingLevel;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.context.annotation.Primary;

@Configuration
public class AiConfig {

    // Model IDs
    // - flash: fast/cheap for interactive chat
    // - pro: higher quality for scenario generation
    // NOTE: These names match Spring AI 1.1.x Google GenAI known model IDs.
    private static final String FLASH_MODEL = "gemini-2.5-flash";
    private static final String PRO_MODEL = "gemini-3-pro-preview";

    // Temperatures
    private static final double FLASH_TEMPERATURE = 0.5;
    private static final double PRO_TEMPERATURE = 0.2;

    // Max output tokens (avoid truncation). Keep within model limits.
    private static final int FLASH_MAX_OUTPUT_TOKENS = 2048;
    private static final int PRO_MAX_OUTPUT_TOKENS = 8192;

    // Thinking controls (Gemini). Keep thoughts out of the content; we need JSON-only in many nodes.
    private static final int FLASH_THINKING_BUDGET = 128;
    private static final int PRO_THINKING_BUDGET = 512;
    private static final boolean INCLUDE_THOUGHTS = false;

    @Bean
    @Primary
    ChatClient genAiProChatClient(
            @Qualifier("googleGenAiChatModel") ChatModel chatModel
    ) {
        var loggerAdvisor = SimpleLoggerAdvisor.builder()
                .order(Ordered.LOWEST_PRECEDENCE - 1)
                .build();

        return ChatClient.builder(chatModel)
                .defaultOptions(GoogleGenAiChatOptions.builder()
                        .model(PRO_MODEL)
                        .temperature(PRO_TEMPERATURE)
                        .maxOutputTokens(PRO_MAX_OUTPUT_TOKENS)
                        .thinkingBudget(PRO_THINKING_BUDGET)
                        .thinkingLevel(GoogleGenAiThinkingLevel.HIGH)
                        .includeThoughts(INCLUDE_THOUGHTS)
                        .build())
                .defaultAdvisors(loggerAdvisor)
                .build();
    }

    @Bean
    ChatClient genAiFlashChatClient(
            @Qualifier("googleGenAiChatModel") ChatModel chatModel
    ) {
        var loggerAdvisor = SimpleLoggerAdvisor.builder()
                .order(Ordered.LOWEST_PRECEDENCE - 1)
                .build();

        return ChatClient.builder(chatModel)
                .defaultOptions(GoogleGenAiChatOptions.builder()
                        .model(FLASH_MODEL)
                        .temperature(FLASH_TEMPERATURE)
                        .maxOutputTokens(FLASH_MAX_OUTPUT_TOKENS)
                        .thinkingBudget(FLASH_THINKING_BUDGET)
                        .thinkingLevel(GoogleGenAiThinkingLevel.LOW)
                        .includeThoughts(INCLUDE_THOUGHTS)
                        .build())
                .defaultAdvisors(loggerAdvisor)
                .build();
    }

}
