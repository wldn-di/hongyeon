package com.ssafy.s14p11a707.scenario.v2.node;

import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
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

    private final ChatClient chatClient;
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
                [출력 형식 - 절대 준수]
                - 반드시 JSON 오브젝트 1개만 출력한다. (설명/사담/마크다운/코드펜스 금지)
                - 첫 글자는 '{', 마지막 글자는 '}' 여야 한다.
                - JSON 키/문자열은 큰따옴표(")만 사용한다.
                - 문자열 값에 큰따옴표(")를 직접 넣지 말라. 필요하면 ‘ ’ 또는 ()를 사용한다.
                - 문자열 값에 줄바꿈/탭 같은 제어문자를 넣지 말라. 필요하면 \\n, \\t로 이스케이프한다.
                - "..." / "(중략)" 같은 생략 표기는 절대 사용하지 말라. 끝까지 완전한 JSON을 출력한다.

                첫번째 AI 호출 작업 = 사건과 사건이 일어난 하루의 Timeline 생성과 관련 인물 기본 배경 생성

                Persona: 당신은 전문 추리 게임 시나리오 작가입니다. 당신은 논리적으로 사건의 트릭, 반전, 그리고 타임라인이 독자 및 게임의 사용자들이 납득할 수 있는 시나리오를 작성하는데 있어서 특화되어 있습니다.
                당신은 사용자가 제공한 '장르', '인원수', '간단한 시놉시스'를 바탕으로 사건의 기본 인물 명단과 타임라인을 우선 작성해야 합니다.

                [요청 정보]
                - 요청된 용의자 수: %d명 (피해자 제외)

                [절대 규칙(HARD)]
                - suspects 배열의 원소 개수는 반드시 %d개여야 한다.
                - suspects[].id는 1..%d를 중복 없이 사용한다.
                - timeline은 30분 간격이며, time은 HH:MM 형식이고, 오름차순으로 작성한다.
                - 위 규칙을 어기면 실패로 간주한다. (추가 설명 금지, JSON만 출력)

                [작성 규칙]
                1. 사건 당일의 타임라인을 30분 간격으로 구성하십시오.
                2. 범인 은닉: 살해 행위를 특정 인물과 연결하지 말고 '비명 소리', '사건 발생' 등 객관적 현상으로 서술하십시오.
                3. 중립적 서술: 모든 인물의 행동은 알리바이 증명이나 의심스러운 정황 위주로 구성하십시오.
                4. 결말 포함 금지: 사인 확인이나 엔딩 내용은 배제하고 사건 발견 직후의 혼란 상황까지만 묘사하십시오.
                5. 인물 생성: 반드시 '피해자 1명'과 '용의자 %d명'을 생성하십시오. (총 인원 %d명)
                6. suspects 배열의 길이는 정확히 %d여야 합니다.
                7. 나이 제외: 인물의 '나이'는 이후 단계에서 결정하므로 여기서는 포함하지 마십시오.
                8. timeline[].event는 60자 이내의 한 문장으로 작성하십시오.

                출력 JSON 스키마:
                {
                  "cast": {
                    "victim": { "name": "이름", "gender": "남성/여성", "occupation": "직업" },
                    "suspects": [
                      { "id": 1, "name": "이름", "gender": "성별", "occupation": "직업" }
                    ]
                  },
                  "timeline": [
                    {"time": "22:00", "event": "피해자가 연구실에 도착"}
                  ]
                }

                Response strictly in JSON format.
                """, suspectCount, suspectCount, suspectCount, suspectCount, suspectCount + 1, suspectCount);

        String content = chatClient.prompt()
                .system(timelineSystemMessage)
                .user(userMessage)
                .call()
                .content();

        String cleaned = ScenarioV2JsonUtils.normalizeJsonText(content);
        state.setTimelineJson(cleaned);
        state.setDraftJson(null);
        log.info("[v2] TimelineNode completed. scenarioId={}, rawLen={}, jsonLen={}", state.getScenarioId(), content == null ? 0 : content.length(), cleaned.length());
        return state;
    }
}
