package com.ssafy.s14p11a707.scenario.v2.node;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State;
import java.util.List;
import com.ssafy.s14p11a707.vertex.VertexAiAccountPool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 시나리오 v2 개연성 평가 노드
 * <p>
 * 조립된 draft JSON({@link ScenarioV2State#getDraftJson()})과 정적 검증 결과({@link ScenarioV2State#getValidationReport()})를 입력으로,
 * LLM에게 <b>편집자/탐정 역할</b>로 평가를 맡겨 점수/피드백을 산출한다.
 * </p>
 * <p><b>산출물</b></p>
 * <ul>
 *   <li>점수({@link ScenarioV2CritiqueResult#score()}): 0~100</li>
 *   <li>피드백({@link ScenarioV2CritiqueResult#feedback()}): 논리적 모순/현실성/해결 가능성 관점</li>
 * </ul>
 *
 * @see ValidateNode
 * @see RefineNode
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class CritiqueNode implements ScenarioV2Node {

    private final VertexAiAccountPool vertexAiPool;
    private final ObjectMapper objectMapper;
    private final ScenarioV2EventPublisher eventPublisher;

    /**
     * draft에 대한 개연성 점수와 피드백을 평가하여 상태에 반영
     * <p>
     * LLM 출력(JSON)을 {@link ScenarioV2CritiqueResult}로 파싱한 뒤
     * {@link ScenarioV2State#setCritiqueScore(int)}와 {@link ScenarioV2State#setCritiqueFeedback(String)}에 저장한다.
     * </p>
     *
     * @param state 현재 상태
     * @return 점수/피드백이 반영된 상태
     * @throws RuntimeException LLM 호출 또는 내부 처리 중 문제가 발생했을 때
     */
    @Override
    public ScenarioV2State execute(ScenarioV2State state) {
        log.info(
                "[v2] CritiqueNode execute. scenarioId={}, validationReportLen={}, draftJsonPresent={}",
                state.getScenarioId(),
                state.getValidationReport() == null ? 0 : state.getValidationReport().length(),
                state.getDraftJson() != null
        );

        eventPublisher.publish(new ScenarioV2EventMessage(
                state.getUserId(),
                state.getScenarioId(),
                EventType.CRITIQUE,
                55,
                "알리바이의 모순을 찾는 중…",
                null
        ));

        String system = """
                Role: You are a strict detective-editor.
                Task: Evaluate the scenario draft JSON for logical consistency, realism, and solvability.
                Output: JSON only (no prose).

                Required JSON schema:
                {
                  "score": 0,
                  "feedback": "string",
                  "mustFix": ["string"]
                }

                Scoring:
                - 85+ means acceptable for persistence
                - deduct points for contradictions, impossible tricks, unclear alibis, missing links between clues and truth
                """;

        String user = """
                [Validation issues]
                %s

                [Draft JSON]
                %s
                """.formatted(state.getValidationReport(), toJson(state.getDraftJson()));

        String content = vertexAiPool.call(system, user);

        String cleaned = ScenarioV2JsonUtils.normalizeJsonText(content);
        ScenarioV2CritiqueResult result = parseCritique(cleaned);

        state.setCritiqueScore(result.score());
        state.setCritiqueFeedback(result.feedback());
        log.info(
                "[v2] CritiqueNode completed. scenarioId={}, rawLen={}, score={}, mustFixCount={}, feedback={}",
                state.getScenarioId(),
                content == null ? 0 : content.length(),
                result.score(),
                result.mustFix() == null ? 0 : result.mustFix().size(),
                summarize(result.feedback(), 160)
        );
        return state;
    }

    private String toJson(JsonNode node) {
        try {
            return objectMapper.writeValueAsString(node);
        } catch (Exception e) {
            return "{}";
        }
    }

    private ScenarioV2CritiqueResult parseCritique(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            int score = root.path("score").asInt(0);
            String feedback = root.path("feedback").asText("");

            List<String> mustFix = root.path("mustFix").isArray()
                    ? objectMapper.convertValue(root.path("mustFix"), objectMapper.getTypeFactory().constructCollectionType(List.class, String.class))
                    : List.of();

            return new ScenarioV2CritiqueResult(score, feedback, mustFix);
        } catch (Exception e) {
            return new ScenarioV2CritiqueResult(0, "failed to parse critique", List.of("output format invalid"));
        }
    }

    private static String summarize(String value, int maxLen) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.length() <= maxLen) {
            return trimmed;
        }
        return trimmed.substring(0, maxLen) + "...";
    }
}
