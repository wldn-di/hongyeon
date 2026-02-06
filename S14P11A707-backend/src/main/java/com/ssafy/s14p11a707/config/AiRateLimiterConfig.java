package com.ssafy.s14p11a707.config;

import com.google.common.util.concurrent.RateLimiter;
import java.util.concurrent.Semaphore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * AI API 호출에 대한 Rate Limiting 및 동시성 제어 설정.
 * <p>
 * Gemini 무료 티어 RPM 제한에 맞춰 채팅/시나리오 호출을 분리 관리한다.
 */
@Slf4j
@Configuration
public class AiRateLimiterConfig {

    @Bean("chatRateLimiter")
    public RateLimiter chatRateLimiter(
            @Value("${app.ai.rate-limit.chat-rpm:7}") double chatRpm) {
        RateLimiter limiter = RateLimiter.create(chatRpm / 60.0);
        log.info("[ai] chat rate limiter initialized: {} RPM ({} permits/sec)",
                chatRpm, chatRpm / 60.0);
        return limiter;
    }

    @Bean("scenarioRateLimiter")
    public RateLimiter scenarioRateLimiter(
            @Value("${app.ai.rate-limit.scenario-rpm:3}") double scenarioRpm) {
        RateLimiter limiter = RateLimiter.create(scenarioRpm / 60.0);
        log.info("[ai] scenario rate limiter initialized: {} RPM ({} permits/sec)",
                scenarioRpm, scenarioRpm / 60.0);
        return limiter;
    }

    @Bean("chatConcurrencySemaphore")
    public Semaphore chatConcurrencySemaphore(
            @Value("${app.ai.rate-limit.chat-max-concurrent:5}") int maxConcurrent) {
        log.info("[ai] chat concurrency semaphore initialized: max {} concurrent", maxConcurrent);
        return new Semaphore(maxConcurrent);
    }
}
