package com.ssafy.s14p11a707.scenario.v2.job;

import com.ssafy.s14p11a707.config.ConcurrencyProperties;
import java.util.concurrent.Semaphore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@EnableConfigurationProperties(ConcurrencyProperties.class)
public class ScenarioGenerationGate {

    private final Semaphore semaphore;
    private final int maxPermits;

    public ScenarioGenerationGate(ConcurrencyProperties properties) {
        this.maxPermits = properties.effectiveMaxScenarioGeneration();
        this.semaphore = new Semaphore(maxPermits, true);
        log.info("[ScenarioGate] initialized with maxPermits={}", maxPermits);
    }

    public boolean tryAcquire() {
        boolean acquired = semaphore.tryAcquire();
        log.info("[ScenarioGate] tryAcquire={} (available={}/{})", acquired, semaphore.availablePermits(), maxPermits);
        return acquired;
    }

    public void acquire() {
        log.info("[ScenarioGate] acquire 블로킹 대기 (available={}/{})", semaphore.availablePermits(), maxPermits);
        try {
            semaphore.acquire();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("ScenarioGenerationGate acquire interrupted", e);
        }
        log.info("[ScenarioGate] acquire 획득 (available={}/{})", semaphore.availablePermits(), maxPermits);
    }

    public void release() {
        semaphore.release();
        log.info("[ScenarioGate] release (available={}/{})", semaphore.availablePermits(), maxPermits);
    }

    public int availablePermits() {
        return semaphore.availablePermits();
    }

    public int maxPermits() {
        return maxPermits;
    }
}
