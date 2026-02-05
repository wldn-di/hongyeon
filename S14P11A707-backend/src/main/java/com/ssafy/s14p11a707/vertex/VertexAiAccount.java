package com.ssafy.s14p11a707.vertex;

import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicBoolean;
import lombok.Getter;
import org.springframework.ai.chat.client.ChatClient;

@Getter
public class VertexAiAccount {

    private final String name;
    private final ChatClient chatClient;
    private final Semaphore semaphore;
    private final AtomicBoolean active = new AtomicBoolean(true);
    private volatile String disableReason;

    public VertexAiAccount(String name, ChatClient chatClient, Semaphore semaphore) {
        this.name = name;
        this.chatClient = chatClient;
        this.semaphore = semaphore;
    }

    public boolean isActive() {
        return active.get();
    }

    public void disable(String reason) {
        if (active.compareAndSet(true, false)) {
            this.disableReason = reason;
        }
    }
}
