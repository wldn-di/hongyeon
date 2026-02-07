package com.ssafy.s14p11a707.scenario.v2.node;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import com.ssafy.s14p11a707.vertex.VertexAiAccountPool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private final VertexAiAccountPool vertexAiPool;
    private final ObjectMapper objectMapper;
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

        String context = """
                [Timeline JSON (cast + timeline)]
                %s

                [Scenario JSON]
                %s
                """.formatted(state.getTimelineJson(), state.getScenarioJson());

        String system = """
                Persona: 당신은 전문 추리 게임 시나리오 작가입니다.

                출력 규칙(STRICT):
                - 응답은 반드시 단 하나의 JSON 오브젝트만 출력한다(사담/설명/마크다운/코드펜스 금지).
                - 첫 글자는 '{', 마지막 글자는 '}' 여야 한다.
                - 최상위 키는 정확히 다음 4개만 허용: truth_config_json, victim, suspects, clues

                핵심 제약(HARD):
                - suspects는 반드시 배열이며 길이는 정확히 %d
                - suspects에서 is_culprit=true 인 용의자는 정확히 1명
                - clues는 반드시 배열이며 길이는 8~12

                단서 텍스트 규칙(HARD):
                - clues[].assistant_comment, clues[].clue_detail_json.revealed_truth, clues[].clue_detail_json.discovery_script 는 "플레이어 UI에 노출"될 수 있다.
                - 따라서 추리 정답/결론을 직접 말하지 말고, 관찰 가능한 사실만 짧게 쓴다.
                - 아래 단어/표현은 사용 금지: 범인, 용의자, 알리바이, 흉기, 살해, 살인, 범행, 결정적, 반박, 의미, 거짓, 거짓말, 모순

                조력자 멘트(assistant_comment) 규칙(HARD):
                - "탐정님," 으로 시작하는 1문장(60자 이내).
                - 공손한 구어체(~요/~니다)로 끝낸다. 서술체(~다) 금지.
                - 감정/심리(분노/억울함 등)를 단정하지 말고, 보이는 흔적(구김/찢김/필압 등)으로만 표현한다.
                - 감정 단어 사용 금지: 분노, 억울
                - assistant_comment에서는 필요하면 피해자/용의자 실명을 직접 언급해도 된다.

                clue_detail_json 규칙(HARD):
                - revealed_truth: 단서에서 "확인 가능한 사실"만 1문장으로 요약(120자 이내). 추론/판정 금지.
                - discovery_script: 단서 발견 순간의 짧은 대사(120자 이내). 발견 묘사만, 추론/판정 금지.
                - revealed_truth, discovery_script에서도 필요하면 피해자/용의자 실명을 직접 언급해도 된다.

                외모 정보(appearance 필드):
                - hair_style, hair_color, eye_color, facial_features, body_type, clothing_style, expression, distinctive_trait
                - 모든 값은 구체적이고 생생하게 작성 (빈 문자열 금지)

                피해자 추가 정보:
                - personality(성격), last_known_action(마지막 행동), physical_condition(신체 상태)

                중요: DB ID를 절대 추측하지 마라.
                - truth_config_json.culprit_id / weapon_clue_id, ai_config_json.secret.weakness_clue.id 는 0으로 둔다(서버가 DB 저장 후 실제 ID로 치환).
                - 대신 weapon_clue_name / weakness_clue.name 으로 단서를 지정한다.
                - weapon_clue_name, weakness_clue.name 은 반드시 clues[].name 중 하나를 그대로 복사해 사용한다(오타/추가 생성 금지).

                필수 필드 스키마(요약):
                truth_config_json: {
                  "culprit_id": 0,
                  "motive": string,
                  "weapon_clue_id": 0,
                  "weapon_clue_name": string,
                  "method": string,
                  "location_floor": 1..6,
                  "cause_of_death": string
                }

                victim: {
                  "name": string,
                  "age": number,
                  "gender": string,
                  "occupation": string,
                  "background": string,
                  "discovery_location": string,
                  "estimated_death_time": string,
                  "cause_of_death": string,
                  "victim_detail_json": {
                    "personality": string,
                    "last_known_action": string,
                    "physical_condition": string,
                    "appearance": {
                      "hair_style": string,
                      "hair_color": string,
                      "eye_color": string,
                      "facial_features": string,
                      "body_type": string,
                      "clothing_style": string,
                      "expression": string,
                      "distinctive_trait": string
                    }
                  }
                }

                suspects[] item: {
                  "name": string,
                  "age": number,
                  "gender": string,
                  "occupation": string,
                  "one_liner": string,
                  "is_culprit": boolean,
                  "motive": string,
                  "ai_config_json": {
                    "personality": string,
                    "relationship": string,
                    "knowledge_scope": { "knows_about": string, "doesnt_know": string },
                    "secret": {
                      "title": string,
                      "content": string,
                      "weakness_clue": { "id": 0, "name": string, "description": string },
                      "alibi_progression": { "level1_lie": string, "level2_weak": string }
                    },
                    "deflection_strategy": { "target_name": string, "suspicion_point": string, "dialogue_hint": string },
                    "timeline_alibi": [ { "time": "HH:MM", "location": string, "activity": string, "is_verified": false } ],
                    "appearance": {
                      "hair_style": string,
                      "hair_color": string,
                      "eye_color": string,
                      "facial_features": string,
                      "body_type": string,
                      "clothing_style": string,
                      "expression": string,
                      "distinctive_trait": string
                    }
                  }
                }

                clues[] item: {
                  "name": string,
                  "description": string,
                  "importance": "CRITICAL"|"RED_HERRING"|"SUPPORTING",
                  "assistant_comment": string,
                  "clue_detail_json": {
                    "revealed_truth": string,
                    "related_suspect_ids": array,
                    "discovery_script": string,
                    "is_weakness_clue_for": number
                  }
                }
                """.formatted(suspectCount);

        String user = """
                Use the input JSON below. Keep cast names/gender/occupation from Timeline. Output ONLY the JSON object.

                %s
                """.formatted(context);

        String lastCleaned = null;
        List<String> lastIssues = List.of();
        for (int attempt = 1; attempt <= 2; attempt++) {
            String attemptSystem = system;
            if (attempt > 1) {
                attemptSystem = system + """

                        IMPORTANT:
                        - Your previous output failed structural validation.
                        - Fix the issues listed and output a single JSON object again.
                        - Do not output multiple JSON blocks.

                        Issues:
                        %s

                        Previous output (to repair):
                        %s
                        """.formatted(String.join("\n", lastIssues), safe(lastCleaned));
            }

            String content = vertexAiPool.call(attemptSystem, user);

            String cleaned = ScenarioV2JsonUtils.normalizeJsonText(content);
            List<String> issues = validateCharactersJson(cleaned, suspectCount);
            if (issues.isEmpty()) {
                state.setCharactersJson(cleaned);
                state.setDraftJson(null);
                log.info(
                        "[v2] CharactersCluesTruthNode completed. scenarioId={}, attempt={}, rawLen={}, jsonLen={}, suspects={}, clues={}",
                        state.getScenarioId(),
                        attempt,
                        content == null ? 0 : content.length(),
                        cleaned.length(),
                        countArray(cleaned, "suspects"),
                        countArray(cleaned, "clues")
                );
                return state;
            }

            lastCleaned = cleaned;
            lastIssues = issues;
            log.warn(
                    "[v2] CharactersCluesTruthNode output invalid. scenarioId={}, attempt={}, issues={}, preview={}",
                    state.getScenarioId(),
                    attempt,
                    String.join("; ", issues),
                    preview(cleaned, 400)
            );
        }

        throw new IllegalStateException("failed to generate valid characters/clues json: " + String.join("; ", lastIssues));
    }

    private List<String> validateCharactersJson(String json, int suspectCount) {
        List<String> issues = new ArrayList<>();
        JsonNode root;
        try {
            root = objectMapper.readTree(json);
        } catch (Exception e) {
            issues.add("output is not valid JSON");
            return issues;
        }

        if (!root.isObject()) {
            issues.add("root must be a JSON object");
            return issues;
        }

        Set<String> personNames = collectPersonNames(root);

        JsonNode victim = root.path("victim");
        if (!victim.isObject()) {
            issues.add("victim must be an object");
        }

        JsonNode clues = root.path("clues");
        List<String> clueNames = new ArrayList<>();
        if (!clues.isArray()) {
            issues.add("clues must be an array");
        } else if (clues.size() < 8 || clues.size() > 12) {
            issues.add("clues size must be between 8 and 12");
        } else {
            for (JsonNode clue : clues) {
                String name = clue.path("name").asText("").trim();
                if (name.isEmpty()) {
                    issues.add("clue.name is missing");
                    continue;
                }
                clueNames.add(name);

                String assistantComment = clue.path("assistant_comment").asText("").trim();
                if (assistantComment.isEmpty()) {
                    issues.add("clue.assistant_comment is missing (" + name + ")");
                } else {
                    validateUiText(
                            issues,
                            personNames,
                            "clue.assistant_comment",
                            assistantComment,
                            name,
                            true,
                            true,
                            60
                    );
                }

                JsonNode clueDetail = clue.path("clue_detail_json");
                if (!clueDetail.isObject()) {
                    issues.add("clue.clue_detail_json must be an object (" + name + ")");
                } else {
                    String revealedTruth = clueDetail.path("revealed_truth").asText("").trim();
                    if (revealedTruth.isEmpty()) {
                        issues.add("clue.clue_detail_json.revealed_truth is missing (" + name + ")");
                    } else {
                        validateUiText(
                                issues,
                                personNames,
                                "clue.clue_detail_json.revealed_truth",
                                revealedTruth,
                                name,
                                false,
                                true,
                                120
                        );
                    }

                    String discoveryScript = clueDetail.path("discovery_script").asText("").trim();
                    if (discoveryScript.isEmpty()) {
                        issues.add("clue.clue_detail_json.discovery_script is missing (" + name + ")");
                    } else {
                        validateUiText(
                                issues,
                                personNames,
                                "clue.clue_detail_json.discovery_script",
                                discoveryScript,
                                name,
                                false,
                                true,
                                120
                        );
                    }
                }
            }
            if (clueNames.stream().distinct().count() != clueNames.size()) {
                issues.add("clue names must be unique");
            }
        }

        JsonNode suspects = root.path("suspects");
        if (!suspects.isArray()) {
            issues.add("suspects must be an array");
        } else if (suspects.size() != suspectCount) {
            issues.add("suspects size must be " + suspectCount);
        } else {
            int culprits = 0;
            for (JsonNode suspect : suspects) {
                if (suspect.path("is_culprit").asBoolean(false)) {
                    culprits++;
                }

                JsonNode weakness = suspect.path("ai_config_json").path("secret").path("weakness_clue");
                if (!weakness.isObject()) {
                    issues.add("suspect.ai_config_json.secret.weakness_clue must be an object");
                    continue;
                }
                String weaknessName = weakness.path("name").asText("").trim();
                if (weaknessName.isEmpty()) {
                    issues.add("weakness_clue.name is missing");
                    continue;
                }
                if (!clueNames.isEmpty() && !clueNames.contains(weaknessName)) {
                    issues.add("weakness_clue.name must match one of clues[].name (" + weaknessName + ")");
                }
            }
            if (culprits != 1) {
                issues.add("exactly 1 suspect must have is_culprit=true");
            }
        }

        JsonNode truthConfig = root.path("truth_config_json");
        if (!truthConfig.isObject()) {
            issues.add("truth_config_json must be an object");
        } else {
            String weaponName = truthConfig.path("weapon_clue_name").asText("").trim();
            if (weaponName.isEmpty()) {
                issues.add("truth_config_json.weapon_clue_name is missing");
            } else if (!clueNames.isEmpty() && !clueNames.contains(weaponName)) {
                issues.add("truth_config_json.weapon_clue_name must match one of clues[].name (" + weaponName + ")");
            }
        }

        return issues;
    }

    private static void validateUiText(
            List<String> issues,
            Set<String> personNames,
            String field,
            String text,
            String clueName,
            boolean requireAssistantTone,
            boolean allowPersonNameMention,
            int maxLen
    ) {
        if (text.length() > maxLen) {
            issues.add(field + " must be <= " + maxLen + " chars (" + clueName + ")");
        }
        if (containsAnyToken(text, BANNED_UI_TOKENS) || containsAnyToken(text, BANNED_EMOTION_TOKENS)) {
            issues.add(field + " must avoid banned tokens (" + clueName + ")");
        }
        if (!allowPersonNameMention && containsAnyPersonName(text, personNames)) {
            issues.add(field + " must not mention person names (" + clueName + ")");
        }
        if (requireAssistantTone) {
            if (!startsWithDetectiveAddress(text)) {
                issues.add(field + " must start with '탐정님' (" + clueName + ")");
            }
            if (!hasPoliteEnding(text)) {
                issues.add(field + " must end politely (~요/~니다) (" + clueName + ")");
            }
        }
    }

    private static final String[] BANNED_UI_TOKENS = {
            "범인", "용의자", "알리바이", "흉기", "살해", "살인", "범행", "결정적", "반박", "의미", "거짓", "거짓말", "모순"
    };

    private static final String[] BANNED_EMOTION_TOKENS = {
            "분노", "억울"
    };

    private static Set<String> collectPersonNames(JsonNode root) {
        Set<String> names = new HashSet<>();
        if (root == null) {
            return names;
        }

        JsonNode victim = root.path("victim");
        String victimName = victim.path("name").asText("").trim();
        if (!victimName.isEmpty()) {
            names.add(victimName);
        }

        JsonNode suspects = root.path("suspects");
        if (suspects != null && suspects.isArray()) {
            for (JsonNode suspect : suspects) {
                String suspectName = suspect.path("name").asText("").trim();
                if (!suspectName.isEmpty()) {
                    names.add(suspectName);
                }
            }
        }

        return names;
    }

    private static boolean containsAnyPersonName(String text, Set<String> personNames) {
        if (text == null || text.isBlank() || personNames == null || personNames.isEmpty()) {
            return false;
        }
        String compact = text.replace(" ", "");
        for (String name : personNames) {
            if (name == null) {
                continue;
            }
            String token = name.trim();
            if (token.isEmpty()) {
                continue;
            }
            if (compact.contains(token.replace(" ", ""))) {
                return true;
            }
        }
        return false;
    }

    private static boolean containsAnyToken(String text, String[] tokens) {
        if (text == null) {
            return false;
        }
        String compact = text.replace(" ", "");
        for (String token : tokens) {
            if (compact.contains(token)) {
                return true;
            }
        }
        return false;
    }

    private static boolean hasPoliteEnding(String text) {
        String t = stripTrailingPunctuation(text);
        if (t.isEmpty()) {
            return false;
        }
        return t.endsWith("요") || t.endsWith("니다");
    }

    private static boolean startsWithDetectiveAddress(String text) {
        if (text == null) {
            return false;
        }
        return text.trim().startsWith("탐정님");
    }

    private static String stripTrailingPunctuation(String text) {
        if (text == null) {
            return "";
        }
        String t = text.trim();
        while (!t.isEmpty()) {
            char last = t.charAt(t.length() - 1);
            if (last == '.' || last == '!' || last == '?' || last == '…' || last == '"' || last == '\'' || last == '”' || last == '’') {
                t = t.substring(0, t.length() - 1).trim();
                continue;
            }
            break;
        }
        return t;
    }

    private int countArray(String json, String field) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode node = root.path(field);
            return node.isArray() ? node.size() : -1;
        } catch (Exception e) {
            return -1;
        }
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String preview(String value, int maxLen) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        return trimmed.length() <= maxLen ? trimmed : trimmed.substring(0, maxLen) + "...";
    }
}
