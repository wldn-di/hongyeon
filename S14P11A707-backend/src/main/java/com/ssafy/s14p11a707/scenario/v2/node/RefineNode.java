package com.ssafy.s14p11a707.scenario.v2.node;

import com.fasterxml.jackson.core.json.JsonReadFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;

/**
 * 시나리오 v2 초안 보강(리파인) 노드
 * <p>
 * {@link CritiqueNode}의 피드백과 {@link ValidateNode}의 정적 검증 리포트를 반영하여
 * draft JSON을 최소 변경으로 수정하도록 LLM에 요청한다.
 * </p>
 * <p><b>재시도 카운트</b></p>
 * <p>
 * 본 노드는 {@link ScenarioV2State#getRetryCount()}를 증가시키며,
 * 재시도 횟수는 {@link com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2GraphRunner}의 루프 종료 조건에 사용된다.
 * </p>
 *
 * @see CritiqueNode
 * @see ValidateNode
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class RefineNode implements ScenarioV2Node {

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;
    private final ScenarioV2EventPublisher eventPublisher;

    /**
     * 피드백을 반영해 draft JSON을 보강하고 상태에 반영
     * <p>
     * LLM이 반환한 JSON을 파싱하여 {@link ScenarioV2State#setDraftJson(JsonNode)}에 저장하고,
     * 재시도 횟수를 증가시킨다.
     * </p>
     *
     * @param state 현재 상태
     * @return 보강된 draft가 반영된 상태
     * @throws IllegalStateException 보강 결과 JSON 파싱에 실패했을 때
     * @throws RuntimeException LLM 호출 또는 내부 처리 중 문제가 발생했을 때
     */
    @Override
    public ScenarioV2State execute(ScenarioV2State state) {
        int nextRetry = state.getRetryCount() + 1;

        eventPublisher.publish(new ScenarioV2EventMessage(
                state.getUserId(),
                state.getScenarioId(),
                EventType.REFINE,
                55,
                "허점을 보강하고 있어요… (재검토 %d/3)".formatted(nextRetry),
                Map.of("retry", nextRetry, "maxRetry", 3)
        ));

        String system = """
                Role: You are a detective-writer revising a JSON draft.
                Task: Fix issues with minimal changes, keeping all constraints.

                Hard constraints:
                - Output JSON only, no prose, no markdown.
                - Top-level keys must be exactly: scenario, victim, suspects, clues, rooms
                - suspects length must be exactly %d
                - clues length must be between 8 and 12
                - rooms length must be exactly 6 with floor_number 1..6
                - Keep the story coherent with the timeline and truth_config_json
                """.formatted(state.getRequest().suspectCount());

        String user = """
                [Validation issues]
                %s

                [Critique feedback]
                %s

                [Current Draft JSON]
                %s
                """.formatted(state.getValidationReport(), state.getCritiqueFeedback(), toJson(state.getDraftJson()));

        String content = chatClient.prompt()
                .system(system)
                .user(user)
                .call()
                .content();

        String cleaned = ScenarioV2JsonUtils.normalizeJsonText(content);

        try {
            JsonNode refined = objectMapper.reader()
                    .with(JsonReadFeature.ALLOW_JAVA_COMMENTS.mappedFeature())
                    .with(JsonReadFeature.ALLOW_SINGLE_QUOTES.mappedFeature())
                    .with(JsonReadFeature.ALLOW_TRAILING_COMMA.mappedFeature())
                    .with(JsonReadFeature.ALLOW_UNESCAPED_CONTROL_CHARS.mappedFeature())
                    .readTree(cleaned);
            state.setDraftJson(refined);
            log.info(
                    "[v2] RefineNode parsed refined json. scenarioId={}, retry={}, rawLen={}, cleanedLen={}",
                    state.getScenarioId(),
                    nextRetry,
                    content == null ? 0 : content.length(),
                    cleaned.length()
            );
        } catch (Exception e) {
            String autoClosed = ScenarioV2JsonUtils.autoCloseJson(cleaned);
            if (!autoClosed.equals(cleaned)) {
                try {
                    JsonNode repaired = objectMapper.reader()
                            .with(JsonReadFeature.ALLOW_JAVA_COMMENTS.mappedFeature())
                            .with(JsonReadFeature.ALLOW_SINGLE_QUOTES.mappedFeature())
                            .with(JsonReadFeature.ALLOW_TRAILING_COMMA.mappedFeature())
                            .with(JsonReadFeature.ALLOW_UNESCAPED_CONTROL_CHARS.mappedFeature())
                            .readTree(autoClosed);
                    state.setDraftJson(repaired);
                    log.warn(
                            "[v2] RefineNode auto-closed json and recovered. scenarioId={}, retry={}, cleanedLen={}, autoClosedLen={}",
                            state.getScenarioId(),
                            nextRetry,
                            cleaned.length(),
                            autoClosed.length()
                    );
                } catch (Exception repairedFail) {
                    throwParseErrorWithRetry(state, nextRetry, system, user, cleaned, e);
                }
            } else {
                throwParseErrorWithRetry(state, nextRetry, system, user, cleaned, e);
            }
        }

        state.setRetryCount(nextRetry);
        return state;
    }

    private void throwParseErrorWithRetry(
            ScenarioV2State state,
            int nextRetry,
            String system,
            String user,
            String cleaned,
            Exception original
    ) {
        String preview = cleaned.length() <= 600 ? cleaned : cleaned.substring(0, 600) + "...";
        log.warn("[v2] failed to parse refined json. scenarioId={}, retry={}, preview={}", state.getScenarioId(), nextRetry, preview, original);

        String retrySystem = system + """

                IMPORTANT:
                - Your previous output was not valid JSON (likely truncated).
                - Output must be a complete JSON object and end with the proper closing braces.
                - Keep text fields concise to avoid truncation.
                """;

        String retryContent = chatClient.prompt()
                .system(retrySystem)
                .user(user)
                .call()
                .content();

        String retryCleaned = ScenarioV2JsonUtils.normalizeJsonText(retryContent);
        String retryAutoClosed = ScenarioV2JsonUtils.autoCloseJson(retryCleaned);

        try {
            JsonNode refined = objectMapper.reader()
                    .with(JsonReadFeature.ALLOW_JAVA_COMMENTS.mappedFeature())
                    .with(JsonReadFeature.ALLOW_SINGLE_QUOTES.mappedFeature())
                    .with(JsonReadFeature.ALLOW_TRAILING_COMMA.mappedFeature())
                    .with(JsonReadFeature.ALLOW_UNESCAPED_CONTROL_CHARS.mappedFeature())
                    .readTree(retryAutoClosed);
            state.setDraftJson(refined);
            log.warn(
                    "[v2] RefineNode retry succeeded. scenarioId={}, retry={}, rawLen={}, cleanedLen={}, autoClosedLen={}",
                    state.getScenarioId(),
                    nextRetry,
                    retryContent == null ? 0 : retryContent.length(),
                    retryCleaned.length(),
                    retryAutoClosed.length()
            );
        } catch (Exception retryFail) {
            String retryPreview = retryAutoClosed.length() <= 600 ? retryAutoClosed : retryAutoClosed.substring(0, 600) + "...";
            log.error(
                    "[v2] RefineNode retry failed. scenarioId={}, retry={}, preview={}",
                    state.getScenarioId(),
                    nextRetry,
                    retryPreview,
                    retryFail
            );
            throw new IllegalStateException("failed to parse refined json", original);
        }
    }

    private String toJson(JsonNode node) {
        try {
            return objectMapper.writeValueAsString(node);
        } catch (Exception e) {
            return "{}";
        }
    }
}
