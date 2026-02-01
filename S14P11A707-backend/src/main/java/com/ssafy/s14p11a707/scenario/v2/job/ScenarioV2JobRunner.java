package com.ssafy.s14p11a707.scenario.v2.job;

import com.ssafy.s14p11a707.scenario.helper.ScenarioTransactionHelper;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateRequest;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2GraphRunner;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 시나리오 생성 v2 비동기 작업 실행기
 * <p>
 * 생성 요청을 백그라운드로 실행하는 책임을 가지며,
 * 프레젠테이션/서비스 계층은 본 컴포넌트에 의존해 생성 작업을 시작한다.
 * </p>
 *
 * @see com.ssafy.s14p11a707.scenario.v2.service.ScenarioV2Service
 * @see com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2GraphRunner
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ScenarioV2JobRunner {

    private final ScenarioTransactionHelper scenarioTransactionHelper;
    private final ScenarioV2GraphRunner graphRunner;
    private final ScenarioV2EventPublisher eventPublisher;

    /**
     * 시나리오 생성 작업을 비동기로 실행
     * <p>
     * 호출자는 작업 완료를 기다리지 않으며,
     * 진행 상황/완료 이벤트는 SSE 스트림({@link com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent})을 통해 전달된다.
     * </p>
     *
     * @param userId SSE 라우팅에 사용되는 사용자 식별자(id)
     * @param scenarioId 생성 대상 시나리오 식별자(id)
     * @param request 사용자 입력 DTO
     */
    @Async("scenarioJobExecutor")
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
