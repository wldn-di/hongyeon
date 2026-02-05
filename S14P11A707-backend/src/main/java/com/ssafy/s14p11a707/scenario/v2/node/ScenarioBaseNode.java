package com.ssafy.s14p11a707.scenario.v2.node;

import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
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

    private final ChatClient chatClient;
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
                [출력 형식 - 절대 준수]
                - 반드시 JSON 오브젝트 1개만 출력한다. (설명/사담/마크다운/코드펜스 금지)
                - 첫 글자는 '{', 마지막 글자는 '}' 여야 한다.
                - JSON 키/문자열은 큰따옴표(")만 사용한다.
                - 문자열 값에 큰따옴표(")를 직접 넣지 말라. 필요하면 ‘ ’ 또는 ()를 사용한다.
                - 문자열 값에 줄바꿈/탭 같은 제어문자를 넣지 말라. 필요하면 \\n, \\t로 이스케이프한다.
                - "..." / "(중략)" 같은 생략 표기는 절대 사용하지 말라. 완전한 JSON을 끝까지 출력한다.

                Persona: 당신은 전문 추리 게임 시나리오 작가입니다. 당신은 논리적으로 사건의 트릭, 반전, 그리고 타임라인이 독자 및 게임의 사용자들이 납득할 수 있는 시나리오를 작성하는데 있어서 특화되어 있습니다.
                당신은 [1단계 데이터]를 바탕으로 시나리오의 전체 설정을 JSON 형식으로 작성하십시오.

                [작성 규칙(HARD)]
                1. synopsis: 60자 이내 1문장
                2. synopsisDetail: 240자 이내 (2~4문장)
                3. story_config_json.twist: 180자 이내 (2문장 이내) — 결론을 확정적으로 말하지 말고 ‘가능한 반전’으로 서술
                4. story_config_json.timeline: 반드시 [1단계 데이터]의 timeline을 그대로 사용하고, time/event를 임의로 추가/삭제하지 말 것
                5. story_config_json.timeline[].event: 80자 이내
                6. incident_time: "YYYY-MM-DD HH:MM" 형식
                7. thumbnailUrl: 빈 문자열("")로 둔다. (이미지는 이후 단계에서 생성)
                8. 인명 준수: 반드시 1단계 cast 데이터의 이름만 사용한다.

                [1단계 데이터]:
                %s

                출력 JSON 스키마:
                {
                  "scenario": {
                    "title": "string",
                    "synopsis": "string",
                    "synopsisDetail": "string",
                    "thumbnailUrl": "",
                    "story_config_json": {
                      "incident_time": "YYYY-MM-DD HH:MM",
                      "twist": "string",
                      "timeline": [
                        { "time": "HH:MM", "event": "string" }
                      ]
                    }
                  }
                }

                Response strictly in JSON format without any markdown code blocks or prose.
                """, state.getTimelineJson());

        String content = chatClient.prompt()
                .system(scenarioSystemMessage)
                .user("Generate scenario based on the timeline above.")
                .call()
                .content();

        String cleaned = ScenarioV2JsonUtils.normalizeJsonText(content);
        state.setScenarioJson(cleaned);
        state.setDraftJson(null);
        log.info("[v2] ScenarioBaseNode completed. scenarioId={}, rawLen={}, jsonLen={}", state.getScenarioId(), content == null ? 0 : content.length(), cleaned.length());
        return state;
    }
}
