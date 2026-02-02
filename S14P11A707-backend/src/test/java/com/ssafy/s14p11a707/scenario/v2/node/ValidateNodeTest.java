package com.ssafy.s14p11a707.scenario.v2.node;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateRequest;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State;
import org.junit.jupiter.api.Test;

class ValidateNodeTest {

    @Test
    void execute_validDraft_setsValidationReportOk() {
        ObjectMapper objectMapper = new ObjectMapper();
        ScenarioV2EventPublisher eventPublisher = mock(ScenarioV2EventPublisher.class);
        ValidateNode node = new ValidateNode(objectMapper, eventPublisher);

        ScenarioV2CreateRequest request = new ScenarioV2CreateRequest("t", "g", 2, "syn", null);
        ScenarioV2State state = new ScenarioV2State(1L, 100L, request);

        state.setScenarioJson(buildScenarioJson(objectMapper));
        state.setCharactersJson(buildCharactersJson(objectMapper, 2, 8));
        state.setRoomsJson(buildRoomsJson(objectMapper, new int[]{1, 2, 3, 4, 5, 6}));

        ScenarioV2State result = node.execute(state);

        assertThat(result.getValidationReport()).isEqualTo("OK");
        assertThat(result.getDraftJson()).isNotNull();
        assertThat(result.getDraftJson().has("scenario")).isTrue();
        assertThat(result.getDraftJson().has("victim")).isTrue();
        assertThat(result.getDraftJson().path("suspects").isArray()).isTrue();
        assertThat(result.getDraftJson().path("clues").isArray()).isTrue();
        assertThat(result.getDraftJson().path("rooms").isArray()).isTrue();
    }

    @Test
    void execute_tooManySuspectsAndClues_trimsAndValidatesOk() {
        ObjectMapper objectMapper = new ObjectMapper();
        ScenarioV2EventPublisher eventPublisher = mock(ScenarioV2EventPublisher.class);
        ValidateNode node = new ValidateNode(objectMapper, eventPublisher);

        ScenarioV2CreateRequest request = new ScenarioV2CreateRequest("t", "g", 3, "syn", null);
        ScenarioV2State state = new ScenarioV2State(1L, 200L, request);

        state.setScenarioJson(buildScenarioJson(objectMapper));
        state.setCharactersJson(buildCharactersJson(objectMapper, 5, 13));
        state.setRoomsJson(buildRoomsJson(objectMapper, new int[]{1, 2, 3, 4, 5, 6}));

        ScenarioV2State result = node.execute(state);

        assertThat(result.getValidationReport()).isEqualTo("OK");
        assertThat(result.getDraftJson().path("suspects").size()).isEqualTo(3);
        assertThat(result.getDraftJson().path("clues").size()).isEqualTo(12);
    }

    @Test
    void execute_missingFloor_reportsIssue() {
        ObjectMapper objectMapper = new ObjectMapper();
        ScenarioV2EventPublisher eventPublisher = mock(ScenarioV2EventPublisher.class);
        ValidateNode node = new ValidateNode(objectMapper, eventPublisher);

        ScenarioV2CreateRequest request = new ScenarioV2CreateRequest("t", "g", 2, "syn", null);
        ScenarioV2State state = new ScenarioV2State(1L, 300L, request);

        state.setScenarioJson(buildScenarioJson(objectMapper));
        state.setCharactersJson(buildCharactersJson(objectMapper, 2, 8));
        state.setRoomsJson(buildRoomsJson(objectMapper, new int[]{1, 2, 2, 4, 5, 6}));

        ScenarioV2State result = node.execute(state);

        assertThat(result.getValidationReport()).contains("rooms must include floor_number=3");
    }

    private static String buildScenarioJson(ObjectMapper objectMapper) {
        ObjectNode root = objectMapper.createObjectNode();
        ObjectNode scenario = objectMapper.createObjectNode();
        scenario.put("title", "t");
        scenario.put("synopsis", "s");
        scenario.put("synopsisDetail", "detail");

        ObjectNode storyConfig = objectMapper.createObjectNode();
        storyConfig.put("incident_time", "2020-01-01 00:00");
        storyConfig.put("twist", "x");
        storyConfig.set("timeline", objectMapper.createArrayNode());

        scenario.set("story_config_json", storyConfig);
        root.set("scenario", scenario);
        return root.toString();
    }

    private static String buildCharactersJson(ObjectMapper objectMapper, int suspectCount, int clueCount) {
        ObjectNode root = objectMapper.createObjectNode();

        ObjectNode victim = objectMapper.createObjectNode();
        victim.put("name", "Victim");
        root.set("victim", victim);

        ArrayNode suspects = objectMapper.createArrayNode();
        for (int i = 1; i <= suspectCount; i++) {
            ObjectNode suspect = objectMapper.createObjectNode();
            suspect.put("id", i);
            suspect.put("name", "S" + i);
            suspect.put("is_culprit", i == 1);
            suspects.add(suspect);
        }
        root.set("suspects", suspects);

        ArrayNode clues = objectMapper.createArrayNode();
        for (int i = 1; i <= clueCount; i++) {
            ObjectNode clue = objectMapper.createObjectNode();
            clue.put("id", i);
            clue.put("name", "C" + i);
            clues.add(clue);
        }
        root.set("clues", clues);

        ObjectNode truth = objectMapper.createObjectNode();
        truth.put("culprit_id", 1);
        root.set("truth_config_json", truth);

        return root.toString();
    }

    private static String buildRoomsJson(ObjectMapper objectMapper, int[] floors) {
        ObjectNode root = objectMapper.createObjectNode();
        ArrayNode rooms = objectMapper.createArrayNode();
        for (int floor : floors) {
            ObjectNode room = objectMapper.createObjectNode();
            room.put("floor_number", floor);
            rooms.add(room);
        }
        root.set("rooms", rooms);

        ObjectNode scenarioRoot = objectMapper.createObjectNode();
        ObjectNode storyConfig = objectMapper.createObjectNode();
        storyConfig.set("narration", objectMapper.createObjectNode().put("opening", "hi"));
        scenarioRoot.set("story_config_json", storyConfig);
        root.set("scenario", scenarioRoot);

        return root.toString();
    }
}

