package com.ssafy.s14p11a707.game.v2.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.TimeoutException;

@Component
public class SpringAiSuspectChatV2AiClient implements SuspectChatV2AiClient {

    private final ChatClient gmsChatClient;

    public SpringAiSuspectChatV2AiClient(
            @Qualifier("gmsChatClient") ChatClient gmsChatClient) {
        this.gmsChatClient = gmsChatClient;
    }

    @Override
    @Retryable(
        retryFor = {TimeoutException.class},
        maxAttempts = 2,
        backoff = @Backoff(delay = 300)
    )
    public String generate(String systemMessage, String userMessage, List<Message> recentHistory) {
        StringBuilder sb = new StringBuilder();
        gmsChatClient.prompt()
                .system(systemMessage)
                .messages(recentHistory)
                .user(userMessage)
                .stream()
                .content()
                .doOnNext(sb::append)
                .blockLast();

        return sb.toString();
    }
}
