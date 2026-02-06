package com.ssafy.s14p11a707.common.api;

import com.ssafy.s14p11a707.game.dto.SuspectChatRequest;
import com.ssafy.s14p11a707.game.dto.SuspectChatResponse;
import com.ssafy.s14p11a707.game.entity.SessionSuspectState;
import com.ssafy.s14p11a707.game.entity.SessionSuspectStateId;
import com.ssafy.s14p11a707.game.repository.SessionSuspectStateRepository;
import com.ssafy.s14p11a707.game.v2.service.ChatConcurrencyGate;
import com.ssafy.s14p11a707.game.v2.service.SuspectChatV2Service;
import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.scenario.repository.ScenarioRepository;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateRequest;
import com.ssafy.s14p11a707.scenario.v2.job.ScenarioGenerationGate;
import com.ssafy.s14p11a707.scenario.v2.job.ScenarioV2JobRunner;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.repository.UserRepository;
import com.ssafy.s14p11a707.vertex.VertexAiAccountPool;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/concurrency-test")
@RequiredArgsConstructor
public class ConcurrencyTestApi {

    private final ScenarioGenerationGate scenarioGate;
    private final ChatConcurrencyGate chatGate;
    private final VertexAiAccountPool vertexAiPool;
    private final UserRepository userRepository;
    private final ScenarioRepository scenarioRepository;
    private final ScenarioV2JobRunner scenarioV2JobRunner;
    private final SuspectChatV2Service suspectChatV2Service;
    private final SessionSuspectStateRepository sessionSuspectStateRepository;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        Map<String, Object> result = new LinkedHashMap<>();

        result.put("scenarioGate", Map.of(
                "available", scenarioGate.availablePermits(),
                "max", scenarioGate.maxPermits()
        ));

        result.put("chatGate", Map.of(
                "available", chatGate.availablePermits(),
                "max", chatGate.maxPermits()
        ));

        result.put("vertexPool", Map.of(
                "accountCount", vertexAiPool.accountCount(),
                "activeCount", vertexAiPool.activeCount(),
                "degraded", vertexAiPool.isDegraded(),
                "allExhausted", vertexAiPool.isAllExhausted(),
                "accounts", vertexAiPool.status()
        ));

        return ResponseEntity.ok(result);
    }

    @PostMapping("/scenario-gate")
    public ResponseEntity<Map<String, Object>> testScenarioGate(
            @RequestParam(defaultValue = "3000") long sleepMs
    ) {
        long startMs = System.currentTimeMillis();
        String reqId = "SCENARIO-TEST-" + System.nanoTime();
        log.info("[TEST][{}] scenario-gate test start (sleepMs={})", reqId, sleepMs);

        if (!scenarioGate.tryAcquire()) {
            log.info("[TEST][{}] scenario-gate waiting...", reqId);
            scenarioGate.acquire();
        }

        try {
            Thread.sleep(sleepMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            scenarioGate.release();
        }

        long elapsedMs = System.currentTimeMillis() - startMs;
        log.info("[TEST][{}] scenario-gate test done (elapsed={}ms)", reqId, elapsedMs);
        return ResponseEntity.ok(Map.of("reqId", reqId, "elapsedMs", elapsedMs, "status", "ok"));
    }

    @PostMapping("/vertex-call")
    public ResponseEntity<Map<String, Object>> testVertexCall(
            @RequestParam(defaultValue = "2000") long sleepMs
    ) {
        long startMs = System.currentTimeMillis();
        String reqId = "VERTEX-TEST-" + System.nanoTime();
        log.info("[TEST][{}] vertex-call test start (sleepMs={})", reqId, sleepMs);

        String result = vertexAiPool.testCall(sleepMs);

        long elapsedMs = System.currentTimeMillis() - startMs;
        log.info("[TEST][{}] vertex-call test done (elapsed={}ms)", reqId, elapsedMs);
        return ResponseEntity.ok(Map.of("reqId", reqId, "elapsedMs", elapsedMs, "result", result));
    }

    @PostMapping("/chat-gate")
    public ResponseEntity<Map<String, Object>> testChatGate(
            @RequestParam(defaultValue = "1000") long sleepMs
    ) {
        long startMs = System.currentTimeMillis();
        String reqId = "CHAT-TEST-" + System.nanoTime();
        log.info("[TEST][{}] chat-gate test start (sleepMs={})", reqId, sleepMs);

        if (!chatGate.tryAcquire()) {
            long elapsedMs = System.currentTimeMillis() - startMs;
            log.warn("[TEST][{}] chat-gate timeout (elapsed={}ms)", reqId, elapsedMs);
            return ResponseEntity.ok(Map.of("reqId", reqId, "elapsedMs", elapsedMs, "status", "timeout"));
        }

        try {
            Thread.sleep(sleepMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            chatGate.release();
        }

        long elapsedMs = System.currentTimeMillis() - startMs;
        log.info("[TEST][{}] chat-gate test done (elapsed={}ms)", reqId, elapsedMs);
        return ResponseEntity.ok(Map.of("reqId", reqId, "elapsedMs", elapsedMs, "status", "ok"));
    }

    /**
     * 실제 시나리오 생성 테스트 (같은 사용자 동시 생성 허용)
     * <p>
     * ScenarioV2Service의 per-user 중복 체크를 우회하여,
     * 동일 사용자가 여러 시나리오를 동시에 생성할 수 있게 한다.
     */
    @PostMapping("/scenario-generate")
    public ResponseEntity<Map<String, Object>> testScenarioGenerate(
            @RequestParam long userId,
            @RequestParam(defaultValue = "테스트 시나리오") String title,
            @RequestParam(defaultValue = "테스트용 시나리오입니다") String synopsis,
            @RequestParam(defaultValue = "추리") String genre,
            @RequestParam(defaultValue = "3") int suspectCount
    ) {
        User creator = userRepository.findById(userId).orElse(null);
        if (creator == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found: " + userId));
        }

        Scenario scenario = Scenario.builder()
                .creator(creator)
                .title(title)
                .userSynopsis(synopsis)
                .synopsis(synopsis)
                .suspectCount(suspectCount)
                .genre(genre)
                .generationStatus(Scenario.GenerationStatus.GENERATING)
                .playCount(0)
                .build();

        scenarioRepository.saveScenario(scenario);

        ScenarioV2CreateRequest request = new ScenarioV2CreateRequest(title, genre, suspectCount, synopsis, null);
        scenarioV2JobRunner.runAsync(userId, scenario.getId(), request);

        log.info("[TEST] scenario-generate started. userId={}, scenarioId={}", userId, scenario.getId());
        return ResponseEntity.ok(Map.of(
                "scenarioId", scenario.getId(),
                "userId", userId,
                "status", "GENERATING"
        ));
    }

    /**
     * 한 유저가 한 용의자에게 N턴 순차 채팅 테스트
     * 응답 속도 추이 및 요약(summarization) 동작 확인용
     *
     * 예: GET /api/v1/concurrency-test/chat-sequential?sessionId=1&suspectId=2&turns=20
     */
    @GetMapping("/chat-sequential")
    public ResponseEntity<Map<String, Object>> testChatSequential(
            @RequestParam long sessionId,
            @RequestParam long suspectId,
            @RequestParam(defaultValue = "20") int turns
    ) {
        String reqId = "SEQ-TEST-" + System.nanoTime();
        log.info("[TEST][{}] chat-sequential start sessionId={} suspectId={} turns={}",
                reqId, sessionId, suspectId, turns);

        String[] messages = {
                "사건 당일 어디에 있었나요?",
                "그때 누구와 함께 있었나요?",
                "피해자와는 어떤 관계인가요?",
                "왜 그 시간에 그곳에 있었나요?",
                "혹시 피해자와 다툰 적 있나요?",
                "그날 밤 이상한 점을 본 적 있나요?",
                "당신의 알리바이를 증명할 수 있나요?",
                "피해자의 소지품에 대해 아는 게 있나요?",
                "사건 현장 근처에서 뭘 하고 있었나요?",
                "거짓말하는 거 아닌가요?",
                "그 사람의 행동이 수상하지 않았나요?",
                "피해자가 최근 누군가와 갈등이 있었나요?",
                "그때 정확히 몇 시였는지 기억나나요?",
                "다른 용의자에 대해 아는 게 있나요?",
                "당신이 범인 아니라는 증거가 있나요?",
                "피해자와 마지막으로 만난 게 언제인가요?",
                "그 이야기가 앞뒤가 안 맞는데요?",
                "솔직하게 말해주세요. 뭘 숨기고 있나요?",
                "그거 아까 말한 것과 다른데요?",
                "마지막으로 할 말 있나요?"
        };

        List<Map<String, Object>> turnResults = new ArrayList<>();
        long totalStartMs = System.currentTimeMillis();

        for (int i = 0; i < turns; i++) {
            String message = messages[i % messages.length];
            long turnStartMs = System.currentTimeMillis();

            try {
                SuspectChatRequest chatRequest = new SuspectChatRequest(message, null);
                SuspectChatResponse response = suspectChatV2Service.chatWithSuspect(sessionId, suspectId, chatRequest);

                long turnMs = System.currentTimeMillis() - turnStartMs;
                Map<String, Object> turnResult = new LinkedHashMap<>();
                turnResult.put("turn", i + 1);
                turnResult.put("userMessage", message);
                turnResult.put("aiResponse", response.response());
                turnResult.put("responseLevel", response.responseLevel());
                turnResult.put("health", response.health());
                turnResult.put("elapsedMs", turnMs);
                turnResults.add(turnResult);

                log.info("[TEST][{}] turn={} elapsedMs={} responseLength={}",
                        reqId, i + 1, turnMs, response.response().length());
            } catch (Exception e) {
                long turnMs = System.currentTimeMillis() - turnStartMs;
                Map<String, Object> turnResult = new LinkedHashMap<>();
                turnResult.put("turn", i + 1);
                turnResult.put("userMessage", message);
                turnResult.put("error", e.getMessage());
                turnResult.put("elapsedMs", turnMs);
                turnResults.add(turnResult);

                log.warn("[TEST][{}] turn={} failed: {}", reqId, i + 1, e.getMessage());
            }
        }

        // 비동기 요약이 완료될 시간 대기 (최대 10초)
        try { Thread.sleep(5000); } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }

        // 요약 상태 조회
        Map<String, Object> summaryStatus = new LinkedHashMap<>();
        SessionSuspectState state = sessionSuspectStateRepository
                .findById(new SessionSuspectStateId(sessionId, suspectId)).orElse(null);
        if (state != null) {
            summaryStatus.put("conversationSummary", state.getConversationSummary());
            summaryStatus.put("summarizedMessageCount", state.getSummarizedMessageCount());
        } else {
            summaryStatus.put("conversationSummary", null);
            summaryStatus.put("summarizedMessageCount", 0);
        }

        long totalMs = System.currentTimeMillis() - totalStartMs;

        // 응답 시간 통계
        List<Long> times = turnResults.stream()
                .map(r -> ((Number) r.get("elapsedMs")).longValue())
                .toList();
        long avgMs = times.stream().mapToLong(Long::longValue).sum() / Math.max(times.size(), 1);
        long maxMs = times.stream().mapToLong(Long::longValue).max().orElse(0);
        long minMs = times.stream().mapToLong(Long::longValue).min().orElse(0);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("reqId", reqId);
        result.put("totalMs", totalMs);
        result.put("turns", turns);
        result.put("stats", Map.of("avgMs", avgMs, "maxMs", maxMs, "minMs", minMs));
        result.put("summaryStatus", summaryStatus);
        result.put("turnResults", turnResults);

        log.info("[TEST][{}] chat-sequential done totalMs={} avgMs={} maxMs={} minMs={}",
                reqId, totalMs, avgMs, maxMs, minMs);
        return ResponseEntity.ok(result);
    }

    /**
     * 여러 유저가 동시에 채팅 요청 테스트
     * 동일한 sessionId/suspectId에 대해 concurrentUsers명이 동시에 요청
     *
     * 예: GET /api/v1/concurrency-test/chat-concurrent?sessionId=1&suspectId=2&concurrentUsers=5
     */
    @GetMapping("/chat-concurrent")
    public ResponseEntity<Map<String, Object>> testChatConcurrent(
            @RequestParam long sessionId,
            @RequestParam long suspectId,
            @RequestParam(defaultValue = "5") int concurrentUsers,
            @RequestParam(defaultValue = "사건 당일 어디에 있었나요?") String message
    ) {
        String reqId = "CONC-TEST-" + System.nanoTime();
        log.info("[TEST][{}] chat-concurrent start sessionId={} suspectId={} users={}",
                reqId, sessionId, suspectId, concurrentUsers);

        ExecutorService executor = Executors.newFixedThreadPool(concurrentUsers);
        long totalStartMs = System.currentTimeMillis();

        List<CompletableFuture<Map<String, Object>>> futures = new ArrayList<>();
        for (int i = 0; i < concurrentUsers; i++) {
            final int userId = i + 1;
            futures.add(CompletableFuture.supplyAsync(() -> {
                long startMs = System.currentTimeMillis();
                Map<String, Object> userResult = new LinkedHashMap<>();
                userResult.put("user", userId);

                try {
                    SuspectChatRequest chatRequest = new SuspectChatRequest(
                            "[유저" + userId + "] " + message, null);
                    SuspectChatResponse response = suspectChatV2Service.chatWithSuspect(
                            sessionId, suspectId, chatRequest);

                    long elapsedMs = System.currentTimeMillis() - startMs;
                    userResult.put("status", "success");
                    userResult.put("response", response.response());
                    userResult.put("health", response.health());
                    userResult.put("elapsedMs", elapsedMs);

                    log.info("[TEST][{}] user={} success elapsedMs={}", reqId, userId, elapsedMs);
                } catch (Exception e) {
                    long elapsedMs = System.currentTimeMillis() - startMs;
                    userResult.put("status", "failed");
                    userResult.put("error", e.getMessage());
                    userResult.put("elapsedMs", elapsedMs);

                    log.warn("[TEST][{}] user={} failed: {}", reqId, userId, e.getMessage());
                }
                return userResult;
            }, executor));
        }

        // 모든 요청 완료 대기
        List<Map<String, Object>> userResults = futures.stream()
                .map(CompletableFuture::join)
                .toList();

        executor.shutdown();

        long totalMs = System.currentTimeMillis() - totalStartMs;

        long successCount = userResults.stream().filter(r -> "success".equals(r.get("status"))).count();
        long failCount = userResults.stream().filter(r -> "failed".equals(r.get("status"))).count();

        List<Long> times = userResults.stream()
                .map(r -> ((Number) r.get("elapsedMs")).longValue())
                .toList();
        long avgMs = times.stream().mapToLong(Long::longValue).sum() / Math.max(times.size(), 1);
        long maxMs = times.stream().mapToLong(Long::longValue).max().orElse(0);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("reqId", reqId);
        result.put("totalMs", totalMs);
        result.put("concurrentUsers", concurrentUsers);
        result.put("successCount", successCount);
        result.put("failCount", failCount);
        result.put("stats", Map.of("avgMs", avgMs, "maxMs", maxMs));
        result.put("chatGate", Map.of(
                "available", chatGate.availablePermits(),
                "max", chatGate.maxPermits()
        ));
        result.put("userResults", userResults);

        log.info("[TEST][{}] chat-concurrent done totalMs={} success={} fail={} avgMs={} maxMs={}",
                reqId, totalMs, successCount, failCount, avgMs, maxMs);
        return ResponseEntity.ok(result);
    }
}
