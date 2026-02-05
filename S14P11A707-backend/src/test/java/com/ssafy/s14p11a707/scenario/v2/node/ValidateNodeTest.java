package com.ssafy.s14p11a707.scenario.v2.node;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateRequest;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ValidateNodeTest {

    @Test
    void execute_normalizesRoomsFloorNumbers_whenMissingOrDuplicated() {
        ObjectMapper objectMapper = new ObjectMapper();
        ScenarioV2EventPublisher eventPublisher = mock(ScenarioV2EventPublisher.class);
        ValidateNode node = new ValidateNode(objectMapper, eventPublisher);

        ScenarioV2State state = new ScenarioV2State(1L, 1L, new ScenarioV2CreateRequest("t", "g", 3, "syn", null));

        ObjectNode draft = objectMapper.createObjectNode();

        ObjectNode scenario = objectMapper.createObjectNode();
        scenario.put("title", "title");
        scenario.put("synopsisDetail", "detail");
        scenario.set("story_config_json", objectMapper.createObjectNode());
        ObjectNode truthConfigJson = objectMapper.createObjectNode();
        truthConfigJson.put("weapon_clue_name", "clue-1");
        scenario.set("truth_config_json", truthConfigJson);
        draft.set("scenario", scenario);

        draft.set("victim", objectMapper.createObjectNode().put("name", "victim"));

        ArrayNode clues = objectMapper.createArrayNode();
        for (int i = 1; i <= 8; i++) {
            clues.add(objectMapper.createObjectNode().put("name", "clue-" + i));
        }
        draft.set("clues", clues);

        ArrayNode suspects = objectMapper.createArrayNode();
        for (int i = 1; i <= 3; i++) {
            ObjectNode suspect = objectMapper.createObjectNode();
            suspect.put("name", "suspect-" + i);
            suspect.put("is_culprit", i == 1);

            ObjectNode weakness = objectMapper.createObjectNode().put("name", "clue-" + (i + 1));
            ObjectNode secret = objectMapper.createObjectNode().set("weakness_clue", weakness);
            ObjectNode aiConfigJson = objectMapper.createObjectNode().set("secret", secret);
            suspect.set("ai_config_json", aiConfigJson);

            suspects.add(suspect);
        }
        draft.set("suspects", suspects);

        ArrayNode rooms = objectMapper.createArrayNode();
        rooms.add(room(objectMapper, 1));
        rooms.add(room(objectMapper, 2));
        rooms.add(room(objectMapper, 3));
        rooms.add(room(objectMapper, 6));
        rooms.add(room(objectMapper, null));
        rooms.add(room(objectMapper, 2));
        draft.set("rooms", rooms);

        state.setDraftJson(draft);

        node.execute(state);

        assertThat(state.getValidationReport()).isEqualTo("OK");

        Set<Integer> floors = new HashSet<>();
        for (var roomNode : state.getDraftJson().path("rooms")) {
            floors.add(roomNode.path("floor_number").asInt(-1));
        }
        assertThat(floors).containsExactlyInAnyOrder(1, 2, 3, 4, 5, 6);
    }

    private static ObjectNode room(ObjectMapper objectMapper, Integer floorNumber) {
        ObjectNode room = objectMapper.createObjectNode();
        if (floorNumber != null) {
            room.put("floor_number", floorNumber);
        }
        room.put("room_type", "type");
        room.put("room_name", "name");
        room.put("description", "desc");
        room.put("assistant_comment", "탐정님, 조용히 살펴봐요.");
        return room;
    }
}

