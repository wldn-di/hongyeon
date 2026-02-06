package com.ssafy.s14p11a707.common.api;

import com.ssafy.s14p11a707.game.v2.service.ChatConcurrencyGate;
import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.scenario.repository.ScenarioRepository;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateRequest;
import com.ssafy.s14p11a707.scenario.v2.job.ScenarioGenerationGate;
import com.ssafy.s14p11a707.scenario.v2.job.ScenarioV2JobRunner;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.repository.UserRepository;
import com.ssafy.s14p11a707.vertex.VertexAiAccountPool;
import java.util.LinkedHashMap;
import java.util.Map;
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
}
