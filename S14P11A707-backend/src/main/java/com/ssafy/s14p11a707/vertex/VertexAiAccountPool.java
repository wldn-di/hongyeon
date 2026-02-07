package com.ssafy.s14p11a707.vertex;

import com.google.common.util.concurrent.RateLimiter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class VertexAiAccountPool {

    private final List<VertexAiAccount> accounts;
    private final AtomicInteger index = new AtomicInteger(0);
    private final RateLimiter rateLimiter;

    public VertexAiAccountPool(List<VertexAiAccount> accounts, int rpm) {
        if (accounts == null || accounts.isEmpty()) {
            throw new IllegalArgumentException("VertexAiAccountPool requires at least one account");
        }
        this.accounts = List.copyOf(accounts);

        if (rpm > 0) {
            double permitsPerSecond = rpm / 60.0;
            this.rateLimiter = RateLimiter.create(permitsPerSecond);
            log.info("[VertexPool] rate limiter configured. rpm={}, permitsPerSecond={}",
                    rpm, permitsPerSecond);
        } else {
            this.rateLimiter = null;
            log.info("[VertexPool] rate limiter disabled.");
        }

        log.info("[VertexPool] initialized with {} account(s): {}",
                accounts.size(),
                accounts.stream().map(VertexAiAccount::getName).toList());
    }

    public String call(String systemMessage, String userMessage) {
        if (rateLimiter != null) {
            double waited = rateLimiter.acquire();
            if (waited > 0.01) {
                log.info("[VertexPool] rate limiter waited {}s", String.format("%.2f", waited));
            }
        }

        VertexAiAccount account = nextActiveAccount();
        String reqId = "REQ-" + System.nanoTime();

        log.info("[SCENARIO][{}] {} Semaphore 대기중 (available={}, active={})",
                reqId, account.getName(),
                account.getSemaphore().availablePermits(),
                activeCount());

        try {
            account.getSemaphore().acquire();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Vertex AI semaphore acquire interrupted", e);
        }

        log.info("[SCENARIO][{}] {} Semaphore 획득", reqId, account.getName());

        long startMs = System.currentTimeMillis();
        try {
            log.info("[SCENARIO][{}] AI 호출 시작 (account={})", reqId, account.getName());

            String content = account.getChatClient().prompt()
                    .system(systemMessage)
                    .user(userMessage)
                    .call()
                    .content();

            long elapsedMs = System.currentTimeMillis() - startMs;
            log.info("[SCENARIO][{}] AI 호출 종료 (account={}, elapsed={}ms)", reqId, account.getName(), elapsedMs);

            return content;
        } catch (Exception e) {
            long elapsedMs = System.currentTimeMillis() - startMs;
            log.error("[SCENARIO][{}] AI 호출 실패 (account={}, elapsed={}ms, error={})",
                    reqId, account.getName(), elapsedMs, e.getMessage());

            if (isTokenExhaustedOrAuthError(e)) {
                account.disable(e.getMessage());
                log.warn("[SCENARIO][{}] 계정 비활성화: {} (reason: {}). 남은 활성 계정: {}",
                        reqId, account.getName(), e.getMessage(), activeCount());

                if (activeCount() == 0) {
                    throw new AllAccountsExhaustedException(
                            "모든 Vertex AI 계정의 토큰이 소진되었습니다.");
                }

                // failover: retry with another active account
                return retryWithFallback(reqId, systemMessage, userMessage);
            }
            throw e;
        } finally {
            account.getSemaphore().release();
            log.info("[SCENARIO][{}] {} Semaphore 반납 (available={})",
                    reqId, account.getName(), account.getSemaphore().availablePermits());
        }
    }

    private String retryWithFallback(String reqId, String systemMessage, String userMessage) {
        VertexAiAccount fallback = nextActiveAccount();
        log.info("[SCENARIO][{}] failover → {} (available={})",
                reqId, fallback.getName(), fallback.getSemaphore().availablePermits());

        try {
            fallback.getSemaphore().acquire();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Vertex AI semaphore acquire interrupted during failover", e);
        }

        long startMs = System.currentTimeMillis();
        try {
            String content = fallback.getChatClient().prompt()
                    .system(systemMessage)
                    .user(userMessage)
                    .call()
                    .content();

            long elapsedMs = System.currentTimeMillis() - startMs;
            log.info("[SCENARIO][{}] failover 성공 (account={}, elapsed={}ms)", reqId, fallback.getName(), elapsedMs);
            return content;
        } catch (Exception e) {
            long elapsedMs = System.currentTimeMillis() - startMs;
            log.error("[SCENARIO][{}] failover 실패 (account={}, elapsed={}ms, error={})",
                    reqId, fallback.getName(), elapsedMs, e.getMessage());

            if (isTokenExhaustedOrAuthError(e)) {
                fallback.disable(e.getMessage());
                log.warn("[SCENARIO][{}] failover 계정도 비활성화: {}. 남은 활성 계정: {}",
                        reqId, fallback.getName(), activeCount());

                if (activeCount() == 0) {
                    throw new AllAccountsExhaustedException(
                            "모든 Vertex AI 계정의 토큰이 소진되었습니다.");
                }
            }
            throw e;
        } finally {
            fallback.getSemaphore().release();
        }
    }

    public String testCall(long sleepMs) {
        VertexAiAccount account = nextActiveAccount();
        String reqId = "TEST-" + System.nanoTime();

        log.info("[TEST][{}] {} Semaphore 대기중 (available={})",
                reqId, account.getName(), account.getSemaphore().availablePermits());

        try {
            account.getSemaphore().acquire();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Vertex AI semaphore acquire interrupted", e);
        }

        log.info("[TEST][{}] {} Semaphore 획득", reqId, account.getName());

        long startMs = System.currentTimeMillis();
        try {
            Thread.sleep(sleepMs);
            long elapsedMs = System.currentTimeMillis() - startMs;
            log.info("[TEST][{}] sleep 종료 (elapsed={}ms)", reqId, elapsedMs);
            return "OK: " + account.getName() + " (active=" + activeCount() + ") elapsed=" + elapsedMs + "ms";
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Test sleep interrupted", e);
        } finally {
            account.getSemaphore().release();
            log.info("[TEST][{}] {} Semaphore 반납 (available={})",
                    reqId, account.getName(), account.getSemaphore().availablePermits());
        }
    }

    public int accountCount() {
        return accounts.size();
    }

    public int activeCount() {
        return (int) accounts.stream().filter(VertexAiAccount::isActive).count();
    }

    public boolean isDegraded() {
        int active = activeCount();
        return active > 0 && active < accounts.size();
    }

    public boolean isAllExhausted() {
        return activeCount() == 0;
    }

    public List<AccountStatus> status() {
        return accounts.stream()
                .map(a -> new AccountStatus(
                        a.getName(),
                        a.isActive(),
                        a.getDisableReason(),
                        a.getSemaphore().availablePermits(),
                        a.getSemaphore().availablePermits() + a.getSemaphore().getQueueLength()))
                .toList();
    }

    private VertexAiAccount nextActiveAccount() {
        int size = accounts.size();
        for (int i = 0; i < size; i++) {
            int idx = Math.abs(index.getAndIncrement() % size);
            VertexAiAccount account = accounts.get(idx);
            if (account.isActive()) {
                return account;
            }
        }
        throw new AllAccountsExhaustedException("모든 Vertex AI 계정의 토큰이 소진되었습니다.");
    }

    private boolean isTokenExhaustedOrAuthError(Exception e) {
        String msg = e.getMessage() == null ? "" : e.getMessage().toLowerCase();
        return msg.contains("quota") || msg.contains("429")
                || msg.contains("resource_exhausted") || msg.contains("exhausted")
                || msg.contains("permission_denied") || msg.contains("403")
                || msg.contains("unauthenticated") || msg.contains("401")
                || msg.contains("invalid_api_key") || msg.contains("billing");
    }

    public record AccountStatus(
            String name,
            boolean active,
            String disableReason,
            int availablePermits,
            int totalPermits
    ) {}
}
