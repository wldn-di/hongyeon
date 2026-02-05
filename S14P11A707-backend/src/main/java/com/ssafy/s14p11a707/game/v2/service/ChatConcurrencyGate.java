package com.ssafy.s14p11a707.game.v2.service;

import com.ssafy.s14p11a707.config.ConcurrencyProperties;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@EnableConfigurationProperties(ConcurrencyProperties.class)
public class ChatConcurrencyGate {

    private final Semaphore semaphore;
    private final int maxPermits;
    private final int timeoutSeconds;

    public ChatConcurrencyGate(ConcurrencyProperties properties) {
        this.maxPermits = properties.effectiveMaxChatConcurrent();
        this.timeoutSeconds = properties.effectiveChatTimeoutSeconds();
        this.semaphore = new Semaphore(maxPermits, true);
        log.info("[ChatGate] initialized with maxPermits={}, timeoutSeconds={}", maxPermits, timeoutSeconds);
    }

    public boolean tryAcquire() {
        try {
            boolean acquired = semaphore.tryAcquire(timeoutSeconds, TimeUnit.SECONDS);
            log.info("[CHAT] Gate tryAcquire={} (available={}/{})", acquired, semaphore.availablePermits(), maxPermits);
            return acquired;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("[CHAT] Gate tryAcquire interrupted");
            return false;
        }
    }

    public void release() {
        semaphore.release();
        log.debug("[CHAT] Gate 반납 (available={}/{})", semaphore.availablePermits(), maxPermits);
    }

    public int availablePermits() {
        return semaphore.availablePermits();
    }

    public int maxPermits() {
        return maxPermits;
    }
}
