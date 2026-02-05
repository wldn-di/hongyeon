package com.ssafy.s14p11a707.scenario.v2.node;

import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State;
import com.ssafy.s14p11a707.vertex.VertexAiAccountPool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 시나리오 기본 설정 생성 노드
 * <p>
 * {@link TimelineNode}의 결과(JSON)를 기반으로,
 * 시나리오 메타 정보(제목/시놉시스/상세 시놉시스)와 story_config_json(사건 발생 시각/반전/타임라인 등)을 JSON으로 생성한다.
 * 생성 결과는 {@link ScenarioV2State#setScenarioJson(String)}에 저장된다.
 * </p>
 *
 * @see TimelineNode
 * @see ScenarioV2State
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ScenarioBaseNode implements ScenarioV2Node {

    private final VertexAiAccountPool vertexAiPool;
    private final ScenarioV2EventPublisher eventPublisher;

    /**
     * 시나리오 기본 설정 JSON을 생성하고 상태에 반영
     * <p>
     * {@link ScenarioV2State#getTimelineJson()}를 컨텍스트로 {@link ChatClient}를 호출하고,
     * 결과 문자열을 {@link ScenarioV2JsonUtils#stripCodeFences(String)}로 정리해 상태에 저장한다.
     * </p>
     *
     * @param state 현재 상태
     * @return 시나리오 JSON이 반영된 상태
     * @throws RuntimeException LLM 호출 또는 내부 처리 중 문제가 발생했을 때
     */
    @Override
    public ScenarioV2State execute(ScenarioV2State state) {
        log.info("[v2] ScenarioBaseNode execute. scenarioId={}, timelineJsonLen={}", state.getScenarioId(), state.getTimelineJson() == null ? 0 : state.getTimelineJson().length());

        eventPublisher.publish(new ScenarioV2EventMessage(
                state.getUserId(),
                state.getScenarioId(),
                EventType.TIMELINE,
                20,
                "사건의 줄거리를 정리하는 중이에요.",
                null
        ));

        String scenarioSystemMessage = String.format("""
                                    Persona: 당신은 전문 추리 게임 시나리오 작가입니다. 당신은 논리적으로 사건의 트릭, 반전, 그리고 타임라인이 독자 및 게임의 사용자들이 납득할 수 있는 시나리오를 작성하는데 있어서 특화되어 있습니다.
                                    당신은 [1단계 데이터]를 바탕으로 하여 시나리오의 전체 설정을 JSON 형식으로 작성하십시오. 아래 명시된 형식과 내용을 기반으로 응답하고, 절대 사담을 섞지 마십시오. 반드시 순수한 JSON 형식으로만 출력하십시오.

                                    [작성 규칙]
                                    1. 유저가 입력한 제목과 시놉시스를 확장하여 200자 내외의 synopsisDetail을 작성하십시오.
                                    2. story_config_json 내의 timeline에는 1단계의 내용을 사용하여 필드를 추가하십시오.
                                    3. 인명 준수: 반드시 1단계에서 생성된 이름(cast 데이터)만 사용하십시오.

                                    [1단계 데이터]:
                                    %s

                                    [1단계 타임라인 데이터] 기반으로 scenario 객체(title, synopsis, synopsisDetail, story_config_json)를 생성하십시오.

                시나리오 작성 형식:

                {
                   "scenario": {
                     "title": "[시나리오 제목]",
                     "synopsis": "[한 줄 요약]",
                     "synopsisDetail": "[상세 줄거리]",
                     "thumbnailUrl": "[썸네일 이미지 URL]",
                     "story_config_json": {
                       "incident_time": "[YYYY-MM-DD HH:MM 형식의 발생 시각]",
                       "twist": "[반전 요소]",
                       "timeline": [
                         {
                           "time": "HH:MM",
                           "event": "내용"
                         }
                       ]
                     }
                   }
                 }

                Response strictly in JSON format without any markdown code blocks or prose.
                """, state.getTimelineJson());

        String content = vertexAiPool.call(scenarioSystemMessage, "Generate scenario based on the timeline above.");

        String cleaned = ScenarioV2JsonUtils.normalizeJsonText(content);
        state.setScenarioJson(cleaned);
        state.setDraftJson(null);
        log.info("[v2] ScenarioBaseNode completed. scenarioId={}, rawLen={}, jsonLen={}", state.getScenarioId(), content == null ? 0 : content.length(), cleaned.length());
        return state;
    }
}
