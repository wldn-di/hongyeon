package com.ssafy.s14p11a707.game.v2.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.api.Advisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.ChatMemoryRepository;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeoutException;

@Component
public class SpringAiSuspectChatV2AiClient implements SuspectChatV2AiClient {

    private final ChatClient gmsChatClient;  // GMS용 ChatClient
    private final ChatMemory chatMemory;

    public SpringAiSuspectChatV2AiClient(
            @Qualifier("gmsChatClient") ChatClient gmsChatClient,
            ChatMemoryRepository chatMemoryRepository) {
        this.gmsChatClient = gmsChatClient;
        this.chatMemory = MessageWindowChatMemory.builder()
                .maxMessages(20)
                .chatMemoryRepository(chatMemoryRepository)
                .build();
    }

    @Override
    @Retryable(
        retryFor = {TimeoutException.class},
        maxAttempts = 2,
        backoff = @Backoff(delay = 300)
    )
    public String generate(String conversationId, String systemMessage, String userMessage) {
        Advisor memoryAdvisor = MessageChatMemoryAdvisor.builder(chatMemory)
                .conversationId(conversationId)
                .order(10)
                .build();

        StringBuilder sb = new StringBuilder();
        gmsChatClient.prompt()
                .system(systemMessage)
                .user(userMessage)
                .advisors(memoryAdvisor)
                .stream()
                .content()
                .doOnNext(sb::append)
                .blockLast();

        return sb.toString();
    }
}
