package com.ssafy.s14p11a707.scenario.v2.node;

import com.fasterxml.jackson.core.json.JsonReadFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import com.ssafy.s14p11a707.vertex.VertexAiAccountPool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private final VertexAiAccountPool vertexAiPool;
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
        JsonNode baseDraft = state.getDraftJson();

        eventPublisher.publish(new ScenarioV2EventMessage(
                state.getUserId(),
                state.getScenarioId(),
                EventType.REFINE,
                55,
                "허점을 보강하고 있어요… (재검토 %d/2)".formatted(nextRetry),
                Map.of("retry", nextRetry, "maxRetry", 2)
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
                - Do NOT change the structure of rooms (keep rooms array exactly as provided)
                - Do NOT change clue names or suspect weakness_clue names (keep them to match existing clues)
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

        String content = vertexAiPool.call(system, user);

        String cleaned = ScenarioV2JsonUtils.normalizeJsonText(content);

        try {
            JsonNode refined = objectMapper.reader()
                    .with(JsonReadFeature.ALLOW_JAVA_COMMENTS.mappedFeature())
                    .with(JsonReadFeature.ALLOW_SINGLE_QUOTES.mappedFeature())
                    .with(JsonReadFeature.ALLOW_TRAILING_COMMA.mappedFeature())
                    .with(JsonReadFeature.ALLOW_UNESCAPED_CONTROL_CHARS.mappedFeature())
                    .readTree(cleaned);
            state.setDraftJson(stabilizeRefinedDraft(baseDraft, refined));
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
                    state.setDraftJson(stabilizeRefinedDraft(baseDraft, repaired));
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
        JsonNode baseDraft = state.getDraftJson();
        String preview = cleaned.length() <= 600 ? cleaned : cleaned.substring(0, 600) + "...";
        log.warn("[v2] failed to parse refined json. scenarioId={}, retry={}, preview={}", state.getScenarioId(), nextRetry, preview, original);

        String retrySystem = system + """

                IMPORTANT:
                - Your previous output was not valid JSON (likely truncated).
                - Output must be a complete JSON object and end with the proper closing braces.
                - Keep text fields concise to avoid truncation.
                """;

        String retryContent = vertexAiPool.call(retrySystem, user);

        String retryCleaned = ScenarioV2JsonUtils.normalizeJsonText(retryContent);
        String retryAutoClosed = ScenarioV2JsonUtils.autoCloseJson(retryCleaned);

        try {
            JsonNode refined = objectMapper.reader()
                    .with(JsonReadFeature.ALLOW_JAVA_COMMENTS.mappedFeature())
                    .with(JsonReadFeature.ALLOW_SINGLE_QUOTES.mappedFeature())
                    .with(JsonReadFeature.ALLOW_TRAILING_COMMA.mappedFeature())
                    .with(JsonReadFeature.ALLOW_UNESCAPED_CONTROL_CHARS.mappedFeature())
                    .readTree(retryAutoClosed);
            state.setDraftJson(stabilizeRefinedDraft(baseDraft, refined));
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

    private JsonNode stabilizeRefinedDraft(JsonNode baseDraft, JsonNode refinedDraft) {
        if (baseDraft == null || !baseDraft.isObject() || refinedDraft == null || !refinedDraft.isObject()) {
            return refinedDraft;
        }

        ObjectNode base = (ObjectNode) baseDraft;
        ObjectNode refined = (ObjectNode) refinedDraft;

        ObjectNode out = objectMapper.createObjectNode();

        JsonNode baseRooms = base.path("rooms");
        JsonNode baseSuspects = base.path("suspects");
        JsonNode baseClues = base.path("clues");
        JsonNode baseScenario = base.path("scenario");
        JsonNode baseVictim = base.path("victim");

        ArrayNode clues = selectClues(refined.path("clues"), baseClues);
        Set<String> clueNames = clueNameSet(clues);

        ObjectNode scenario = selectObject(refined.path("scenario"), baseScenario);
        out.set("scenario", stabilizeScenarioTruthConfig(scenario, baseScenario, clueNames));
        out.set("victim", selectObject(refined.path("victim"), baseVictim));

        ArrayNode suspects = selectSuspects(refined.path("suspects"), baseSuspects);
        out.set("suspects", stabilizeSuspectWeaknessNames(suspects, baseSuspects, clueNames));

        out.set("clues", clues);

        if (baseRooms.isArray()) {
            out.set("rooms", baseRooms.deepCopy());
        } else {
            out.set("rooms", refined.path("rooms"));
        }

        return out;
    }

    private ObjectNode stabilizeScenarioTruthConfig(ObjectNode scenario, JsonNode baseScenario, Set<String> clueNames) {
        ObjectNode result = scenario.deepCopy();
        JsonNode baseTruth = baseScenario.path("truth_config_json");
        ObjectNode truth = result.path("truth_config_json").isObject()
                ? (ObjectNode) result.path("truth_config_json").deepCopy()
                : (baseTruth.isObject() ? (ObjectNode) baseTruth.deepCopy() : objectMapper.createObjectNode());

        String weaponName = truth.path("weapon_clue_name").asText("").trim();
        if (weaponName.isEmpty() || (!clueNames.isEmpty() && !clueNames.contains(weaponName))) {
            String baseWeaponName = baseTruth.path("weapon_clue_name").asText("").trim();
            if (!baseWeaponName.isEmpty()) {
                truth.put("weapon_clue_name", baseWeaponName);
            }
        }

        // IDs are resolved after persistence; keep them as-is or default to 0 when missing.
        if (!truth.has("culprit_id")) {
            truth.put("culprit_id", 0);
        }
        if (!truth.has("weapon_clue_id")) {
            truth.put("weapon_clue_id", 0);
        }

        result.set("truth_config_json", truth);
        return result;
    }

    private ArrayNode stabilizeSuspectWeaknessNames(ArrayNode suspects, JsonNode baseSuspects, Set<String> clueNames) {
        if (suspects == null || !suspects.isArray()) {
            return suspects;
        }

        Map<String, String> baseWeaknessNameBySuspectName = new HashMap<>();
        if (baseSuspects != null && baseSuspects.isArray()) {
            for (JsonNode baseSuspect : baseSuspects) {
                String name = baseSuspect.path("name").asText("").trim();
                String weaknessName = baseSuspect.path("ai_config_json").path("secret").path("weakness_clue").path("name").asText("").trim();
                if (!name.isEmpty() && !weaknessName.isEmpty()) {
                    baseWeaknessNameBySuspectName.put(name, weaknessName);
                }
            }
        }

        ArrayNode stabilized = objectMapper.createArrayNode();
        for (JsonNode suspectNode : suspects) {
            if (!suspectNode.isObject()) {
                continue;
            }
            ObjectNode suspect = (ObjectNode) suspectNode.deepCopy();
            String suspectName = suspect.path("name").asText("").trim();

            ObjectNode ai = suspect.path("ai_config_json").isObject()
                    ? (ObjectNode) suspect.path("ai_config_json").deepCopy()
                    : objectMapper.createObjectNode();
            ObjectNode secret = ai.path("secret").isObject()
                    ? (ObjectNode) ai.path("secret").deepCopy()
                    : objectMapper.createObjectNode();
            ObjectNode weakness = secret.path("weakness_clue").isObject()
                    ? (ObjectNode) secret.path("weakness_clue").deepCopy()
                    : objectMapper.createObjectNode();

            String weaknessName = weakness.path("name").asText("").trim();
            String baseWeakness = baseWeaknessNameBySuspectName.get(suspectName);
            if (baseWeakness != null && !baseWeakness.isBlank()) {
                weaknessName = baseWeakness;
            }
            if (!weaknessName.isEmpty()) {
                weakness.put("name", weaknessName);
            }
            if (!clueNames.isEmpty() && (weaknessName.isEmpty() || !clueNames.contains(weaknessName))) {
                // As a last resort, leave base value if present; otherwise keep as-is (validation will catch).
                if (baseWeakness != null && clueNames.contains(baseWeakness)) {
                    weakness.put("name", baseWeakness);
                }
            }

            if (!weakness.has("id")) {
                weakness.put("id", 0);
            }

            secret.set("weakness_clue", weakness);
            ai.set("secret", secret);
            suspect.set("ai_config_json", ai);
            stabilized.add(suspect);
        }
        return stabilized;
    }

    private ArrayNode selectClues(JsonNode refinedClues, JsonNode baseClues) {
        if (refinedClues != null && refinedClues.isArray() && refinedClues.size() >= 8 && refinedClues.size() <= 12 && clueNamesCompatible(refinedClues, baseClues)) {
            return (ArrayNode) refinedClues.deepCopy();
        }
        if (baseClues != null && baseClues.isArray()) {
            return (ArrayNode) baseClues.deepCopy();
        }
        return refinedClues != null && refinedClues.isArray() ? (ArrayNode) refinedClues.deepCopy() : objectMapper.createArrayNode();
    }

    private ArrayNode selectSuspects(JsonNode refinedSuspects, JsonNode baseSuspects) {
        int required = 0;
        if (baseSuspects != null && baseSuspects.isArray()) {
            required = baseSuspects.size();
        }

        if (refinedSuspects != null && refinedSuspects.isArray() && (required == 0 || refinedSuspects.size() == required)) {
            return (ArrayNode) refinedSuspects.deepCopy();
        }
        if (baseSuspects != null && baseSuspects.isArray()) {
            return (ArrayNode) baseSuspects.deepCopy();
        }
        return refinedSuspects != null && refinedSuspects.isArray() ? (ArrayNode) refinedSuspects.deepCopy() : objectMapper.createArrayNode();
    }

    private ObjectNode selectObject(JsonNode refinedNode, JsonNode baseNode) {
        if (refinedNode != null && refinedNode.isObject()) {
            return (ObjectNode) refinedNode.deepCopy();
        }
        if (baseNode != null && baseNode.isObject()) {
            return (ObjectNode) baseNode.deepCopy();
        }
        return objectMapper.createObjectNode();
    }

    private boolean clueNamesCompatible(JsonNode refinedClues, JsonNode baseClues) {
        if (baseClues == null || !baseClues.isArray()) {
            return true;
        }
        Set<String> baseNames = clueNameSet(baseClues);
        if (baseNames.isEmpty()) {
            return true;
        }
        Set<String> refinedNames = clueNameSet(refinedClues);
        return refinedNames.containsAll(baseNames) && baseNames.containsAll(refinedNames);
    }

    private Set<String> clueNameSet(JsonNode clues) {
        java.util.Set<String> names = new java.util.HashSet<>();
        if (clues == null || !clues.isArray()) {
            return names;
        }
        for (JsonNode clue : clues) {
            String name = clue.path("name").asText("").trim();
            if (!name.isEmpty()) {
                names.add(name);
            }
        }
        return names;
    }

    private String toJson(JsonNode node) {
        try {
            return objectMapper.writeValueAsString(node);
        } catch (Exception e) {
            return "{}";
        }
    }
}
