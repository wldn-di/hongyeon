package com.ssafy.s14p11a707.scenario.v2.job.impl;

import com.ssafy.s14p11a707.scenario.helper.ScenarioTransactionHelper;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateRequest;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2GraphRunner;
import com.ssafy.s14p11a707.scenario.v2.job.ScenarioV2JobRunner;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 시나리오 생성 v2 백그라운드 작업 실행 구현체
 * <p>
 * {@link ScenarioV2JobRunner}의 구현으로,
 * {@link Async} 실행을 통해 그래프({@link ScenarioV2GraphRunner})를 백그라운드에서 수행한다.
 * </p>
 * <p><b>예외 처리</b></p>
 * <ul>
 *   <li>그래프 실행 중 예외가 발생하면 {@link ScenarioTransactionHelper}로 도메인 상태를 FAILED로 마킹한다.</li>
 *   <li>클라이언트에게는 {@link ScenarioV2EventPublisher}를 통해 {@link EventType#ERROR} 이벤트를 발행한다.</li>
 * </ul>
 * <p><b>설계 메모</b></p>
 * <ul>
 *   <li>비동기 실행 스레드 풀은 {@code scenarioJobExecutor} 빈을 사용한다.</li>
 * </ul>
 *
 * @see ScenarioV2JobRunner
 * @see ScenarioV2GraphRunner
 * @see ScenarioTransactionHelper
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ScenarioV2JobRunnerImpl implements ScenarioV2JobRunner {

    private final ScenarioTransactionHelper scenarioTransactionHelper;
    private final ScenarioV2GraphRunner graphRunner;
    private final ScenarioV2EventPublisher eventPublisher;

    /**
     * v2 시나리오 생성 그래프를 비동기로 실행
     * <p>
     * {@link ScenarioV2GraphRunner} 실행 중 예외가 발생하면 실패 상태를 마킹하고,
     * SSE 스트림으로 오류 이벤트를 발행한다.
     * </p>
     *
     * @param userId SSE 라우팅에 사용되는 사용자 식별자(id)
     * @param scenarioId 생성 대상 시나리오 식별자(id)
     * @param request 사용자 입력 DTO
     */
    @Async("scenarioJobExecutor")
    @Override
    public void runAsync(long userId, long scenarioId, ScenarioV2CreateRequest request) {
        log.info("[v2] scenario generation started. userId={}, scenarioId={}", userId, scenarioId);
        try {
            graphRunner.run(userId, scenarioId, request);
            log.info("[v2] scenario generation completed. userId={}, scenarioId={}", userId, scenarioId);
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
        }
    }
}
