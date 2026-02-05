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
 * 층별 방(rooms) 및 나레이션 생성 노드
 * <p>
 * 이전 단계에서 생성된 시나리오/인물/단서 정보를 컨텍스트로,
 * 1~6층까지의 방 정보(rooms)와 나레이션(opening/epilogue 등)을 JSON으로 생성한다.
 * 생성 결과는 {@link ScenarioV2State#setRoomsJson(String)}에 저장된다.
 * </p>
 * <p><b>핵심 제약</b></p>
 * <ul>
 *   <li>방 개수는 6개, floor_number는 1..6을 모두 포함(검증은 {@link ValidateNode}에서 수행)</li>
 *   <li>단서(clues)는 각 방 description에 자연스럽게 녹여 배치(서술 규칙은 프롬프트에 위임)</li>
 * </ul>
 *
 * @see ScenarioBaseNode
 * @see CharactersCluesTruthNode
 * @see ValidateNode
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class RoomsNode implements ScenarioV2Node {

    private final VertexAiAccountPool vertexAiPool;
    private final ScenarioV2EventPublisher eventPublisher;

    /**
     * 방/나레이션 JSON을 생성하고 상태에 반영
     * <p>
     * 이전 단계 JSON을 합쳐 컨텍스트를 구성한 뒤 {@link ChatClient}를 호출하고,
     * 결과 문자열을 {@link ScenarioV2JsonUtils#stripCodeFences(String)}로 정리해 상태에 저장한다.
     * </p>
     *
     * @param state 현재 상태
     * @return 방 JSON이 반영된 상태
     * @throws RuntimeException LLM 호출 또는 내부 처리 중 문제가 발생했을 때
     */
    @Override
    public ScenarioV2State execute(ScenarioV2State state) {
        log.info("[v2] RoomsNode execute. scenarioId={}, scenarioJsonLen={}, charactersJsonLen={}",
                state.getScenarioId(),
                state.getScenarioJson() == null ? 0 : state.getScenarioJson().length(),
                state.getCharactersJson() == null ? 0 : state.getCharactersJson().length()
        );

        eventPublisher.publish(new ScenarioV2EventMessage(
                state.getUserId(),
                state.getScenarioId(),
                EventType.ROOMS,
                45,
                "현장을 재구성하고 있어요…",
                null
        ));

        String combinedContext = String.format("""
                [기본 설정 및 타임라인]: %s
                [인물 및 상세 단서 목록]: %s
                """, state.getScenarioJson(), state.getCharactersJson());

        String scenarioSystemMessage = String.format("""

                Persona: 당신은 전문 추리 게임 시나리오 작가입니다. 당신은 논리적으로 사건의 트릭, 반전, 그리고 타임라인이 독자 및 게임의 사용자들이 납득할 수 있는 시나리오를 작성하는데 있어서 특화되어 있습니다.
                이전까지의 모든 AI호출 작업의 결과물(Timeline, title, synopsis, synopsisDetail, story_config_json, victim, suspects 배열, clues 배열, truth_config_json)를 포함한 이전 시나리오 설정)을 기반으로 6개의 층별 방(rooms) 정보를 생성하여 JSON 형식으로 작성하십시오. 아래 명시된 형식과 내용을 기반으로 응답하고, 절대 사담을 섞지 마십시오. 반드시 순수한 JSON 형식으로만 출력하십시오.

                [작성 규칙]
                1. 층수: 1층부터 6층까지 순차적으로 floor_number를 할당하고 층별 유형과 이름을 정하십시오.
                2. 단서 배치: [필수 참고 데이터]의 clues들을 각 방의 description에 자연스럽게 녹여내십시오. (예: 주방 묘사 시 '싱크대 위의 혈흔' 언급)
                3. 조수 코멘트: assistant_comment는 "탐정님,"으로 시작하는 공손한 구어체(~요/~니다) 1문장(60자 이내)으로, 관찰 가능한 사실만 말하고 정답/추론을 금지하십시오. (금지어: 범인, 용의자, 알리바이, 흉기, 살해, 살인, 범행, 결정적, 반박, 의미, 거짓, 거짓말, 모순)
                4. 현장 묘사: "여기가 범행 장소다"라는 확정적 서술을 피하고 객관적인 상태만 묘사하십시오.
                5. narration 섹션(오프닝, 에필로그 등)을 극적인 톤으로 작성하십시오.

                [필수 참고 데이터]:
                %s

                시나리오 작성 형식:
                      {
                   "rooms": [
                     {
                       "floor_number": 1,
                       "room_type": "[1층 유형]",
                       "room_name": "[1층 이름]",
                       "description": "[1층 설명]",
                       "assistant_comment": "[조수 코멘트]"
                     },
                     {
                       "floor_number": 2,
                       "room_type": "[2층 유형]",
                       "room_name": "[2층 이름]",
                       "description": "[2층 설명]",
                       "assistant_comment": "[조수 코멘트]"
                     },
                     {
                       "floor_number": 3,
                       "room_type": "[3층 유형]",
                       "room_name": "[3층 이름]",
                       "description": "[3층 설명]",
                       "assistant_comment": "[조수 코멘트]"
                     },
                     {
                       "floor_number": 4,
                       "room_type": "[4층 유형]",
                       "room_name": "[4층 이름]",
                       "description": "[4층 설명]",
                       "assistant_comment": "[조수 코멘트]"
                     },
                     {
                       "floor_number": 5,
                       "room_type": "[5층 유형]",
                       "room_name": "[5층 이름]",
                       "description": "[5층 설명]",
                       "assistant_comment": "[조수 코멘트]"
                     },
                     {
                       "floor_number": 6,
                       "room_type": "[6층 유형]",
                       "room_name": "[6층 이름]",
                       "description": "[6층 설명]",
                       "assistant_comment": "[조수 코멘트]"
                     }
                   ],
                   "scenario": {
                     "story_config_json": {
                       "narration": {
                         "opening": "[시작 나레이션]",
                         "epilogue": "[엔딩 나레이션]",
                         "culprit_monologue": "[범인 검거 시 독백]",
                         "unsolved_monologue": "[미해결 시 독백]"
                       }
                     }
                   }
                 }
                 Response strictly in JSON format without any markdown code blocks or prose.
        """, combinedContext);

        String content = vertexAiPool.call(scenarioSystemMessage, "Generate 6 rooms based on the scenario above.");

        String cleaned = ScenarioV2JsonUtils.normalizeJsonText(content);
        state.setRoomsJson(cleaned);
        state.setDraftJson(null);
        log.info("[v2] RoomsNode completed. scenarioId={}, rawLen={}, jsonLen={}", state.getScenarioId(), content == null ? 0 : content.length(), cleaned.length());
        return state;
    }
}
