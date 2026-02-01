package com.ssafy.s14p11a707.scenario.v2.node;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.scenario.repository.ScenarioRepository;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 시나리오 v2 생성 완료 처리 노드
 * <p>
 * 최종 draft를 기반으로 {@link Scenario}의 생성 완료 처리를 수행하고,
 * 클라이언트에 {@link EventType#COMPLETE} 이벤트를 발행한다.
 * </p>
 * <p><b>트랜잭션</b></p>
 * <p>
 * 본 노드는 {@link Transactional} 범위에서
 * {@link Scenario#completeGeneration(String, String, String, com.fasterxml.jackson.databind.JsonNode, com.fasterxml.jackson.databind.JsonNode, String)}을 호출해
 * 생성 상태를 COMPLETED로 전환한다.
 * </p>
 *
 * @see com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher
 * @see com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class FinalizeNode implements ScenarioV2Node {

    private final ScenarioRepository scenarioRepository;
    private final ScenarioV2EventPublisher eventPublisher;

    /**
     * 시나리오 엔티티의 완료 처리를 수행하고 완료 이벤트 발행
     * <p>
     * 생성된 텍스트/설정은 {@link Scenario}에 이미 반영되어 있으며,
     * 본 단계에서는 완료 상태 전환 및 완료 이벤트 발행을 수행한다.
     * </p>
     *
     * @param state 현재 상태
     * @return 완료 처리된 상태
     * @throws BaseException 시나리오 조회에 실패했을 때
     */
    @Override
    @Transactional
    public ScenarioV2State execute(ScenarioV2State state) {
        log.info("[v2] FinalizeNode execute. scenarioId={}", state.getScenarioId());

        Scenario scenario = scenarioRepository.findById(state.getScenarioId())
                .orElseThrow(() -> new BaseException(ErrorCode.SCENARIO_NOT_FOUND));

        JsonNode scenarioNode = state.getDraftJson().path("scenario");
        scenario.completeGeneration(
                scenarioNode.path("title").asText(scenario.getTitle()),
                scenarioNode.path("synopsis").asText(scenario.getSynopsis()),
                scenarioNode.path("synopsisDetail").asText(scenario.getSynopsisDetail()),
                scenario.getStoryConfigJson(),
                scenario.getTruthConfigJson(),
                scenario.getCorrectMotiveEmbedding()
        );

        eventPublisher.publish(new ScenarioV2EventMessage(
                state.getUserId(),
                state.getScenarioId(),
                EventType.COMPLETE,
                100,
                "수사 보고서가 완성됐어요.",
                null
        ));

        log.info("[v2] FinalizeNode completed. scenarioId={}", state.getScenarioId());
        return state;
    }
}
