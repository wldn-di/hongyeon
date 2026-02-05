package com.ssafy.s14p11a707.scenario.v2.job;

import com.ssafy.s14p11a707.scenario.helper.ScenarioTransactionHelper;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateRequest;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2GraphRunner;
import com.ssafy.s14p11a707.vertex.AllAccountsExhaustedException;
import com.ssafy.s14p11a707.vertex.VertexAiAccountPool;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScenarioV2JobRunner {

    private final ScenarioTransactionHelper scenarioTransactionHelper;
    private final ScenarioV2GraphRunner graphRunner;
    private final ScenarioV2EventPublisher eventPublisher;
    private final ScenarioGenerationGate gate;
    private final VertexAiAccountPool vertexAiPool;

    @Async("scenarioJobExecutor")
    public void runAsync(long userId, long scenarioId, ScenarioV2CreateRequest request) {
        log.info("[v2][SCENARIO] 요청 도착. userId={}, scenarioId={}", userId, scenarioId);

        // 모든 계정 소진 시 즉시 에러 반환
        if (vertexAiPool.isAllExhausted()) {
            log.error("[v2][SCENARIO] 모든 AI 계정 소진. userId={}, scenarioId={}", userId, scenarioId);
            scenarioTransactionHelper.markFailed(scenarioId, "AI 토큰 소진");
            eventPublisher.publish(new ScenarioV2EventMessage(
                    userId,
                    scenarioId,
                    EventType.ERROR,
                    0,
                    "뜨거운 성원에 준비한 토큰이 모두 소진되었습니다. 플레이해주셔서 감사합니다.",
                    Map.of("error", "ALL_ACCOUNTS_EXHAUSTED")
            ));
            return;
        }

        if (!gate.tryAcquire()) {
            log.info("[v2][SCENARIO] 대기중 (available=0/{}). userId={}, scenarioId={}",
                    gate.maxPermits(), userId, scenarioId);

            String waitMsg = vertexAiPool.isDegraded()
                    ? "탐정님들이 많이 대기 중입니다. 시간이 오래 소요될 예정이니 양해 부탁드립니다."
                    : "생성 대기 중이에요. 잠시만 기다려 주세요.";

            eventPublisher.publish(new ScenarioV2EventMessage(
                    userId,
                    scenarioId,
                    EventType.WAITING,
                    0,
                    waitMsg,
                    null
            ));
            gate.acquire();
        }

        // Gate 획득 후에도 다시 체크 (대기 중에 소진될 수 있음)
        if (vertexAiPool.isAllExhausted()) {
            gate.release();
            log.error("[v2][SCENARIO] Gate 획득 후 모든 AI 계정 소진 확인. userId={}, scenarioId={}", userId, scenarioId);
            scenarioTransactionHelper.markFailed(scenarioId, "AI 토큰 소진");
            eventPublisher.publish(new ScenarioV2EventMessage(
                    userId,
                    scenarioId,
                    EventType.ERROR,
                    0,
                    "뜨거운 성원에 준비한 토큰이 모두 소진되었습니다. 플레이해주셔서 감사합니다.",
                    Map.of("error", "ALL_ACCOUNTS_EXHAUSTED")
            ));
            return;
        }

        log.info("[v2][SCENARIO] Gate 획득. userId={}, scenarioId={}, activeAccounts={}",
                userId, scenarioId, vertexAiPool.activeCount());
        try {
            graphRunner.run(userId, scenarioId, request);
            log.info("[v2] scenario generation completed. userId={}, scenarioId={}", userId, scenarioId);
        } catch (AllAccountsExhaustedException e) {
            log.error("[v2] 토큰 소진으로 시나리오 생성 실패. userId={}, scenarioId={}", userId, scenarioId, e);
            scenarioTransactionHelper.markFailed(scenarioId, e.getMessage());
            eventPublisher.publish(new ScenarioV2EventMessage(
                    userId,
                    scenarioId,
                    EventType.ERROR,
                    0,
                    "뜨거운 성원에 준비한 토큰이 모두 소진되었습니다. 플레이해주셔서 감사합니다.",
                    Map.of("error", "ALL_ACCOUNTS_EXHAUSTED")
            ));
        } catch (Exception e) {
            log.error("[v2] scenario generation failed. userId={}, scenarioId={}", userId, scenarioId, e);
            scenarioTransactionHelper.markFailed(scenarioId, e.getMessage());
            eventPublisher.publish(new ScenarioV2EventMessage(
                    userId,
                    scenarioId,
                    EventType.ERROR,
                    0,
                    "생성 중 문제가 발생했어요: " + e.getMessage(),
                    Map.of("error", e.getMessage())
            ));
        } finally {
            gate.release();
            log.info("[v2][SCENARIO] Gate 반납. userId={}, scenarioId={}", userId, scenarioId);
        }
    }
}
