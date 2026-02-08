package com.ssafy.s14p11a707.scenario.v2.node;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 시나리오 v2 초안 조립 및 정합성 검증 노드
 * <p>
 * 각 생성 단계에서 나온 JSON 문자열({@link ScenarioV2State#getScenarioJson()}, {@link ScenarioV2State#getCharactersJson()},
 * {@link ScenarioV2State#getRoomsJson()})을 하나의 draft JSON 트리로 합치고,
 * 필수 필드/배열 길이 등의 정적 규칙을 검증하여 리포트로 남긴다.
 * </p>
 * <p><b>검증 항목(예시)</b></p>
 * <ul>
 *   <li>용의자 수가 요청 값과 일치하는지</li>
 *   <li>방(rooms)이 6개이며 1..6층이 모두 존재하는지</li>
 *   <li>단서(clues)가 8~12개 범위인지</li>
 * </ul>
 * <p><b>설계 메모</b></p>
 * <ul>
 *   <li>검증 결과는 {@link ScenarioV2State#setValidationReport(String)}에 저장되어 {@link CritiqueNode}/{@link RefineNode} 입력에 포함된다.</li>
 * </ul>
 *
 * @see CritiqueNode
 * @see RefineNode
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ValidateNode implements ScenarioV2Node {

    private final ObjectMapper objectMapper;
    private final ScenarioV2EventPublisher eventPublisher;

    /**
     * draft JSON을 구성하고 정합성 리포트 생성
     * <p>
     * {@link ScenarioV2State#getDraftJson()}이 비어 있으면 내부 조립 로직으로 draft를 생성하고,
     * 정적 검증 결과를 문자열 리포트로 만들어 상태에 저장한다.
     * </p>
     *
     * @param state 현재 상태
     * @return draft JSON 및 검증 리포트가 반영된 상태
     * @throws IllegalStateException JSON 파싱/조립 과정에서 오류가 발생했을 때
     */
    @Override
    public ScenarioV2State execute(ScenarioV2State state) {
        log.info(
                "[v2] ValidateNode execute. scenarioId={}, timelineJsonLen={}, scenarioJsonLen={}, charactersJsonLen={}, roomsJsonLen={}",
                state.getScenarioId(),
                len(state.getTimelineJson()),
                len(state.getScenarioJson()),
                len(state.getCharactersJson()),
                len(state.getRoomsJson())
        );

        eventPublisher.publish(new ScenarioV2EventMessage(
                state.getUserId(),
                state.getScenarioId(),
                EventType.VALIDATE,
                50,
                "정합성을 확인하는 중…",
                null
        ));

        if (state.getDraftJson() == null) {
            state.setDraftJson(assembleDraft(state));
        }

        normalizeDraftStructure(state);

        List<String> issues = validateDraft(state);
        if (issues.isEmpty()) {
            state.setValidationReport("OK");
        } else {
            String report = issues.stream().map(i -> "- " + i).reduce("", (a, b) -> a.isEmpty() ? b : a + "\n" + b);
            state.setValidationReport(report);
        }

        JsonNode draft = state.getDraftJson();
        log.info(
                "[v2] ValidateNode completed. scenarioId={}, issues={}, suspects={}, rooms={}, clues={}, report={}",
                state.getScenarioId(),
                issues.size(),
                arraySize(draft.path("suspects")),
                arraySize(draft.path("rooms")),
                arraySize(draft.path("clues")),
                summarize(state.getValidationReport(), 160)
        );

        return state;
    }

    private void normalizeDraftStructure(ScenarioV2State state) {
        JsonNode draft = state.getDraftJson();
        if (!(draft instanceof ObjectNode root)) {
            return;
        }

        int suspectCount = state.getRequest().suspectCount();
        JsonNode suspects = root.get("suspects");
        if (suspects != null && suspects.isArray() && suspects.size() > suspectCount && suspectCount >= 0) {
            ArrayNode trimmed = objectMapper.createArrayNode();
            for (int i = 0; i < suspectCount; i++) {
                trimmed.add(suspects.get(i));
            }
            root.set("suspects", trimmed);
            log.info("[v2] ValidateNode normalized suspects. scenarioId={}, from={}, to={}", state.getScenarioId(), suspects.size(), suspectCount);
        }

        JsonNode clues = root.get("clues");
        if (clues != null && clues.isArray() && clues.size() > 12) {
            ArrayNode trimmed = objectMapper.createArrayNode();
            for (int i = 0; i < 12; i++) {
                trimmed.add(clues.get(i));
            }
            root.set("clues", trimmed);
            log.info("[v2] ValidateNode normalized clues. scenarioId={}, from={}, to=12", state.getScenarioId(), clues.size());
        }
    }

    private JsonNode assembleDraft(ScenarioV2State state) {
        try {
            JsonNode scenarioRoot = unwrapSingleObjectArray(objectMapper.readTree(ScenarioV2JsonUtils.normalizeJsonText(state.getScenarioJson())));
            JsonNode scenarioNode = scenarioRoot.path("scenario");
            if (!scenarioNode.isObject() && scenarioRoot.isObject() && scenarioRoot.has("title") && scenarioRoot.has("story_config_json")) {
                scenarioNode = scenarioRoot;
            }

            JsonNode charsRoot = unwrapSingleObjectArray(objectMapper.readTree(ScenarioV2JsonUtils.normalizeJsonText(state.getCharactersJson())));
            JsonNode victimNode = charsRoot.path("victim");
            JsonNode suspectsNode = charsRoot.path("suspects");
            JsonNode cluesNode = charsRoot.path("clues");
            JsonNode truthConfig = charsRoot.path("truth_config_json");

            JsonNode roomsRoot = unwrapSingleObjectArray(objectMapper.readTree(ScenarioV2JsonUtils.normalizeJsonText(state.getRoomsJson())));
            JsonNode roomsNode = roomsRoot.path("rooms");
            if (!roomsNode.isArray() && roomsRoot.isArray()) {
                roomsNode = roomsRoot;
            }

            JsonNode narrationNode = roomsRoot.path("scenario").path("story_config_json").path("narration");
            if (!narrationNode.isObject()) {
                narrationNode = roomsRoot.path("story_config_json").path("narration");
            }

            ObjectNode scenarioMerged = scenarioNode != null && scenarioNode.isObject()
                    ? (ObjectNode) scenarioNode.deepCopy()
                    : objectMapper.createObjectNode();

            ObjectNode storyConfig = scenarioMerged.path("story_config_json").isObject()
                    ? (ObjectNode) scenarioMerged.path("story_config_json").deepCopy()
                    : objectMapper.createObjectNode();

            if (narrationNode != null && narrationNode.isObject()) {
                storyConfig.set("narration", narrationNode);
            }

            scenarioMerged.set("story_config_json", storyConfig);
            if (truthConfig != null && !truthConfig.isMissingNode()) {
                scenarioMerged.set("truth_config_json", truthConfig);
            }

            ObjectNode draft = objectMapper.createObjectNode();
            draft.set("scenario", scenarioMerged);
            draft.set("victim", victimNode);
            draft.set("suspects", suspectsNode);
            draft.set("clues", cluesNode);
            draft.set("rooms", roomsNode);

            return draft;
        } catch (Exception e) {
            throw new IllegalStateException("failed to assemble draft json", e);
        }
    }

    private List<String> validateDraft(ScenarioV2State state) {
        JsonNode draft = state.getDraftJson();

        List<String> issues = new ArrayList<>();

        JsonNode scenario = draft.path("scenario");
        if (scenario.path("title").asText().isBlank()) {
            issues.add("scenario.title is missing");
        }
        if (scenario.path("synopsisDetail").asText().isBlank()) {
            issues.add("scenario.synopsisDetail is missing");
        }

        JsonNode suspects = draft.path("suspects");
        if (!suspects.isArray()) {
            issues.add("suspects must be an array");
        } else if (suspects.size() != state.getRequest().suspectCount()) {
            issues.add("suspects size must be " + state.getRequest().suspectCount());
        } else {
            int culprits = 0;
            for (JsonNode suspect : suspects) {
                if (suspect.path("is_culprit").asBoolean(false)) {
                    culprits++;
                }
            }
            if (culprits != 1) {
                issues.add("exactly 1 suspect must have is_culprit=true");
            }
        }

        JsonNode rooms = draft.path("rooms");
        if (!rooms.isArray()) {
            issues.add("rooms must be an array");
        } else if (rooms.size() != 6) {
            issues.add("rooms size must be 6");
        } else {
            Set<Integer> floors = new HashSet<>();
            for (JsonNode room : rooms) {
                floors.add(room.path("floor_number").asInt(-1));
            }
            for (int floor = 1; floor <= 6; floor++) {
                if (!floors.contains(floor)) {
                    issues.add("rooms must include floor_number=" + floor);
                }
            }
        }

        JsonNode clues = draft.path("clues");
        Set<String> clueNames = new HashSet<>();
        if (!clues.isArray()) {
            issues.add("clues must be an array");
        } else if (clues.size() < 8 || clues.size() > 12) {
            issues.add("clues size must be between 8 and 12");
        } else {
            for (JsonNode clue : clues) {
                String name = clue.path("name").asText("").trim();
                if (!name.isEmpty()) {
                    clueNames.add(name);
                }
            }
        }

        JsonNode truthConfigJson = scenario.path("truth_config_json");
        if (!truthConfigJson.isObject()) {
            issues.add("scenario.truth_config_json is missing");
        } else {
            String weaponClueName = truthConfigJson.path("weapon_clue_name").asText("").trim();
            if (weaponClueName.isEmpty()) {
                issues.add("scenario.truth_config_json.weapon_clue_name is missing");
            } else if (!clueNames.isEmpty() && !clueNames.contains(weaponClueName)) {
                issues.add("scenario.truth_config_json.weapon_clue_name must match one of clues[].name");
            }
        }

        if (suspects.isArray()) {
            Set<String> weaknessClueNames = new HashSet<>();
            for (JsonNode suspect : suspects) {
                JsonNode weakness = suspect.path("ai_config_json").path("secret").path("weakness_clue");
                if (!weakness.isObject()) {
                    issues.add("suspect.ai_config_json.secret.weakness_clue is missing");
                    continue;
                }
                String weaknessName = weakness.path("name").asText("").trim();
                if (weaknessName.isEmpty()) {
                    issues.add("suspect.ai_config_json.secret.weakness_clue.name is missing");
                } else if (!clueNames.isEmpty() && !clueNames.contains(weaknessName)) {
                    issues.add("suspect.ai_config_json.secret.weakness_clue.name must match one of clues[].name");
                } else if (!weaknessClueNames.add(weaknessName)) {
                    issues.add("duplicate suspect.ai_config_json.secret.weakness_clue.name is not allowed: " + weaknessName);
                }
            }
        }

        return issues;
    }

    private static JsonNode unwrapSingleObjectArray(JsonNode root) {
        if (root != null && root.isArray() && root.size() == 1) {
            JsonNode first = root.get(0);
            if (first != null && first.isObject()) {
                return first;
            }
        }
        return root;
    }

    private static int len(String value) {
        return value == null ? 0 : value.length();
    }

    private static int arraySize(JsonNode node) {
        return node != null && node.isArray() ? node.size() : -1;
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
