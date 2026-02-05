package com.ssafy.s14p11a707.scenario.v2.node;

import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State;
import com.ssafy.s14p11a707.vertex.VertexAiAccountPool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 타임라인 및 기본 캐스팅 생성 노드
 * <p>
 * 사용자 입력({@link com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateRequest})을 바탕으로,
 * 사건 당일의 타임라인(30분 단위)과 기본 인물 명단(피해자 1명 + 용의자 N명)을 JSON으로 생성한다.
 * 생성 결과는 {@link ScenarioV2State#setTimelineJson(String)}에 저장된다.
 * </p>
 * <p><b>진행 이벤트</b></p>
 * <ul>
 *   <li>{@link EventType#TIMELINE} 단계 이벤트 발행</li>
 * </ul>
 *
 * @see ScenarioV2State
 * @see com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class TimelineNode implements ScenarioV2Node {

    private final VertexAiAccountPool vertexAiPool;
    private final ScenarioV2EventPublisher eventPublisher;

    /**
     * 타임라인/캐스팅 JSON을 생성하고 상태에 반영
     * <p>
     * {@link ChatClient}를 호출해 타임라인과 인물 정보를 JSON으로 생성한 뒤,
     * {@link ScenarioV2JsonUtils#stripCodeFences(String)}로 전처리하여 상태에 저장한다.
     * </p>
     *
     * @param state 현재 상태
     * @return 타임라인 JSON이 반영된 상태
     * @throws RuntimeException LLM 호출 또는 내부 처리 중 문제가 발생했을 때
     */
    @Override
    public ScenarioV2State execute(ScenarioV2State state) {
        log.info("[v2] TimelineNode execute. scenarioId={}, suspectCount={}", state.getScenarioId(), state.getRequest().suspectCount());

        eventPublisher.publish(new ScenarioV2EventMessage(
                state.getUserId(),
                state.getScenarioId(),
                EventType.TIMELINE,
                10,
                "탐정이 사건 개요를 받아 적는 중이에요.",
                null
        ));

        int suspectCount = state.getRequest().suspectCount();

        String userMessage = String.format("""
                {
                  "title": "%s",
                  "genre": "%s",
                  "suspect_count": %d,
                  "synopsis": "%s"
                }
                """, state.getRequest().title(), state.getRequest().genre(), suspectCount, state.getRequest().userSynopsis());

        String timelineSystemMessage = String.format("""
                                     첫번째 AI 호출 작업 = 사건과 사건이 일어난 하루의 Timeline 생성과 관련 인물 기본 배경 생성

                                     Persona: 당신은 전문 추리 게임 시나리오 작가입니다. 당신은 논리적으로 사건의 트릭, 반전, 그리고 타임라인이 독자 및 게임의 사용자들이 납득할 수 있는 시나리오를 작성하는데 있어서 특화되어 있습니다.
                                     당신은 사용자가 제공한 '장르', '인원수', '간단한 시놉시스'를 바탕으로 사건의 기본 인물 명단과 타임라인을 우선 작성해야 합니다. 아래 명시된 형식과 내용을 기반으로 응답하고, 절대 사담을 섞지 마십시오. 반드시 순수한 JSON 형식으로만 출력하십시오, 작업의 순서는 다음과 같습니다:

                                     사건이 일어난 하루의 타임라인을 30분 간격으로 JSON 배열 형식으로 작성하십시오.

                                     당신은 전문 추리 게임 시나리오 작가입니다. 사용자의 입력을 바탕으로 사건의 트릭과 개연성이 확보된 타임라인을 작성하십시오. 사담 없이 JSON 형식으로만 응답하십시오.

                                     [요청 정보]
                                        - 요청된 용의자 수: %d명 (피해자 제외)

                                     [절대 규칙]
                                        - suspects 배열의 원소 개수는 반드시 %d개여야 한다.
                                        - 많거나 적으면 실패로 간주한다. (추가 설명 금지, JSON만 출력)

                                     [작성 규칙]
                                     1. 사건 당일의 타임라인을 30분 간격으로 구성하십시오.
                                     2. 범인 은닉: 살해 행위를 특정 인물과 연결하지 말고 "비명 소리", "사건 발생" 등 객관적 현상으로 서술하십시오.
                                     3. 중립적 서술: 모든 인물의 행동은 알리바이 증명이나 의심스러운 정황 위주로 구성하십시오.
                                     4. 결말 포함 금지: 사인 확인이나 엔딩 내용은 배제하고 사건 발견 직후의 혼란 상황까지만 묘사하십시오.
                                     5. 인물 생성: 반드시 "피해자 1명"과 "용의자 %d명"을 생성하십시오. (총 인원 %d명)
                                     6. suspects 배열의 길이는 정확히 %d여야 합니다.
                                     7. 나이 제외: 인물의 '나이'는 서사적 개연성을 위해 이후 단계에서 결정할 예정이므로 여기서는 포함하지 마십시오.

                                     출력 예시:
                                    {
                                       "cast": {
                                                 "victim": { "name": "이름", "gender": "남성/여성", "occupation": "직업" },
                                                 "suspects": [
                                                   { "id": 1, "name": "이름", "gender": "성별", "occupation": "직업" },
                                                   { "id": 2, "name": "이름", "gender": "성별", "occupation": "직업" }
                                                  ]
                                                 },
                                                 "timeline": [
                                                   {"time": "22:00", "event": "피해자가 연구실에 도착"}
                                                 ]
                                              }
                                      Response strictly in JSON format.
                """, suspectCount, suspectCount, suspectCount, suspectCount + 1, suspectCount);

        String content = vertexAiPool.call(timelineSystemMessage, userMessage);

        String cleaned = ScenarioV2JsonUtils.normalizeJsonText(content);
        state.setTimelineJson(cleaned);
        state.setDraftJson(null);
        log.info("[v2] TimelineNode completed. scenarioId={}, rawLen={}, jsonLen={}", state.getScenarioId(), content == null ? 0 : content.length(), cleaned.length());
        return state;
    }
}
