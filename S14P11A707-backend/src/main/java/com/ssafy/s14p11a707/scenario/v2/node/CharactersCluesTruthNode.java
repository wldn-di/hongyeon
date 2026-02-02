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
 * 인물/단서/진실 설정 생성 노드
 * <p>
 * {@link ScenarioBaseNode}에서 생성된 시나리오 설정을 바탕으로,
 * 피해자/용의자(요청된 수) 및 단서(8~12개), 진실 설정(truth_config_json)을 JSON으로 생성한다.
 * 생성 결과는 {@link ScenarioV2State#setCharactersJson(String)}에 저장된다.
 * </p>
 * <p><b>핵심 제약</b></p>
 * <ul>
 *   <li>용의자 수는 {@link com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateRequest#suspectCount()}와 정확히 일치</li>
 *   <li>단서 수는 8~12개 범위 유지(검증은 {@link ValidateNode}에서 수행)</li>
 * </ul>
 *
 * @see ScenarioBaseNode
 * @see ValidateNode
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class CharactersCluesTruthNode implements ScenarioV2Node {

    private final ChatClient chatClient;
    private final ScenarioV2EventPublisher eventPublisher;

    /**
     * 인물/단서/진실 JSON을 생성하고 상태에 반영
     * <p>
     * {@link ChatClient}를 호출해 victim/suspects/clues/truth_config_json을 포함한 JSON을 생성하고,
     * {@link ScenarioV2JsonUtils#stripCodeFences(String)}로 전처리하여 상태에 저장한다.
     * </p>
     *
     * @param state 현재 상태
     * @return 인물/단서 JSON이 반영된 상태
     * @throws RuntimeException LLM 호출 또는 내부 처리 중 문제가 발생했을 때
     */
    @Override
    public ScenarioV2State execute(ScenarioV2State state) {
        log.info("[v2] CharactersCluesTruthNode execute. scenarioId={}, suspectCount={}, scenarioJsonLen={}",
                state.getScenarioId(),
                state.getRequest().suspectCount(),
                state.getScenarioJson() == null ? 0 : state.getScenarioJson().length()
        );

        eventPublisher.publish(new ScenarioV2EventMessage(
                state.getUserId(),
                state.getScenarioId(),
                EventType.CHARACTERS_CLUES_TRUTH,
                30,
                "탐정이 증거물들을 검토하고 있어요…",
                null
        ));

        int suspectCount = state.getRequest().suspectCount();

        String scenarioSystemMessage = String.format("""

                                               Persona: 당신은 전문 추리 게임 시나리오 작가입니다. 당신은 논리적으로 사건의 트릭, 반전, 그리고 타임라인이 독자 및 게임의 사용자들이 납득할 수 있는 시나리오를 작성하는데 있어서 특화되어 있습니다.
                                               당신은 이전 호출에서 생성한 [scenario 객체(Timeline, title, synopsis, synopsisDetail, story_config_json) 를 포함한 이전 시나리오 설정]을 바탕으로 피해자, 용의자(요청된 수만큼), 증거(8~12개)를 JSON 형식으로 작성하십시오. 아래 명시된 형식과 내용을 기반으로 응답하고, 절대 사담을 섞지 마십시오. 반드시 순수한 JSON 형식으로만 출력하십시오.

                                                [핵심 요청 사항]
                                                        - 유저가 요청한 용의자 수: %d명

                                                   [작성 규칙]
                                                   1. 데이터 연동: 1단계의 이름과 성별 그리고 직업은 절대 변경하지 마십시오.
                                                   2. 정합성: 모든 용의자의 weakness_clue는 반드시 하단의 clues 배열에 동일한 정보로 존재해야 합니다.
                                                   3. 레드 헤링: 단서 중 최소 2개는 사건과 무관한 용의자의 개인적 비밀(도박, 불륜 등)을 담으십시오.
                                                   4. 익명화: revealed_truth에서 "A의 지문" 대신 "누군가의 지문"과 같이 서술하여 유저의 대조 추리를 유도하십시오.
                                                   5. 실명 금지: 메모나 일기 단서에서 용의자 이름을 직접 쓰지 말고 이니셜이나 지칭어를 사용하십시오.
                                                   6. 증거 개수: clues 배열은 반드시 8개 이상 12개 이하로 구성하십시오.
                                                   7. 나이 설정: 각 인물의 직업, 피해자와의 관계, 범행 동기의 깊이를 고려하여 가장 개연성 있는 '나이(age)'를 숫자로 부여하십시오. (예: 피해자와 20년 전 원한 관계라면 나이는 최소 30대 후반 이상이어야 함)
                                                   8. 증거 정합성: 생성된 '나이'나 '성격'이 증거(clues)의 설명과 모순되지 않아야 합니다. (예: 근력이 필요한 증거인데 나이가 너무 많지 않은지 확인)
                                                   9. 알리바이: 타임라인에 맞춰 각 용의자가 숨기고 있는 비밀과 거짓말을 설계하십시오.

                                                   위 설정을 바탕으로 victim, suspects 배열, clues 배열, truth_config_json을 생성하십시오. 용의자 수는 반드시 유저가 요청한 수와 일치해야 합니다.

                                                   [이전 단계 시나리오 정보]:
                                                   %s

                                                   시나리오 작성 형식:
                                                   {
                                                     "truth_config_json": {
                                                       "culprit_id": 0,
                                                       "motive": "[상세 동기(유저가 설정한 동기가 있다면 핵심 내용을 포함하여 확장하고, 없다면 개연성 있는 동기를 창작)]",
                                                       "weapon_clue_id": 0,
                                                       "method": "[상세 수법(유저가 설계한 트릭과 수법을 무조건 반영하되, 묘사가 부족한 부분만 논리적으로 보완)]",
                                                       "location_floor": 0,
                                                       "cause_of_death": "[사인 상세(유저가 설정한 사인(예: 독살, 자상 등)이 있다면 그 사인을 포함하여 확장하고, 없다면 개연성 있는 사인을 창작)]"
                                                     },
                                                     "victim": {
                                                       "name": "[이름]",
                                                       "age": 0,
                                                       "gender": "[남성/여성]",
                                                       "occupation": "[직업]",
                                                       "background": "[배경 설명]",
                                                       "discovery_location": "[장소]",
                                                       "estimated_death_time": "[시각]",
                                                       "cause_of_death": "[사인]",
                                                       "victim_detail_json": {
                                                         "secret": "[비밀]",
                                                         "hidden_info": "[정보]"
                                                       }
                                                     },
                                                     "suspects": [
                                                       { "name": "[이름]",
                                                         "age": 0,
                                                         "gender": "[성별]",
                                                         "occupation": "[직업]",
                                                         "one_liner": "[성격 요약]",
                                                         "is_culprit": false,
                                                         "motive": "[동기]",
                                                         "ai_config_json": {
                                                           "personality": "[성격]",
                                                           "relationship": "[관계]",
                                                           "knowledge_scope": {
                                                             "knows_about": "[아는 정보 목록 문자열]",
                                                             "doesnt_know": "[모르는 정보 목록 문자열]"
                                                           },
                                                           "secret": {
                                                             "title": "[비밀 제목]",
                                                             "content": "[비밀 내용]",
                                                             "weakness_clue": {
                                                               "id": 0,
                                                               "name": "[단서명]",
                                                               "description": "[설명]"
                                                             },
                                                             "alibi_progression": {
                                                               "level1_lie": "[거짓말 확고 태도 (범행이 일어날 당시 하고 있었다고 주장할 장소 기반 주장)]",
                                                               "level2_weak": "[거짓말 붕괴 태도(범행이 일어날 당시 실제로 있었던 장소 기반 주장)]"
                                                             }
                                                           },
                                                           "deflection_strategy": {
                                                             "target_name": "[타겟 이름]",
                                                             "suspicion_point": "[의심 포인트]",
                                                             "dialogue_hint": "[대화 힌트]"
                                                           },
                                                           "timeline_alibi": [
                                                             {
                                                               "time": "HH:MM",
                                                               "location": "장소",
                                                               "activity": "활동",
                                                               "is_verified": false
                                                             }
                                                           ]
                                                         }
                                                       }
                                                     ],
                                                     "clues": [
                                                       {
                                                         "name": "[단서명]",
                                                         "description": "[설명]",
                                                         "importance": "[CRITICAL/RED_HERRING/SUPPORTING]",
                                                         "assistant_comment": "[조수 코멘트]",
                                                         "clue_detail_json": {
                                                           "revealed_truth": "[밝혀지는 사실]",
                                                           "related_suspect_ids": [0, 1],
                                                           "discovery_script": "[발견 대사]",
                                                           "is_weakness_clue_for": 0
                                                         }
                                                       }
                                                     ]
                                                   }
                               Response strictly in JSON format.
                """, suspectCount, state.getScenarioJson());

        String content = chatClient.prompt()
                .system(scenarioSystemMessage)
                .user("Generate victim, suspects, and clues based on the scenario above.")
                .call()
                .content();

        String cleaned = ScenarioV2JsonUtils.normalizeJsonText(content);
        state.setCharactersJson(cleaned);
        log.info("[v2] CharactersCluesTruthNode completed. scenarioId={}, rawLen={}, jsonLen={}", state.getScenarioId(), content == null ? 0 : content.length(), cleaned.length());
        return state;
    }
}
