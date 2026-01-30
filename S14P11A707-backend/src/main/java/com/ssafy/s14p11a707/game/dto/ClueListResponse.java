package com.ssafy.s14p11a707.game.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.game.entity.DiscoveredClue;
import com.ssafy.s14p11a707.scenario.entity.Clue;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record ClueListResponse(
        long sessionId,
        long scenarioId,
        List<ClueItem> clues
) {

    public static ClueListResponse from(
            long sessionId,
            long scenarioId,
            List<Clue> allClues,
            Map<Long, DiscoveredClue> discoveredByClueId
    ) {
        List<ClueItem> clueDtos = allClues.stream()
                .map(clue -> ClueItem.from(clue, discoveredByClueId.get(clue.getId())))
                .toList();

        return new ClueListResponse(sessionId, scenarioId, clueDtos);
    }

    public record ClueItem(
            long clueId,
            long roomId,
            int floorNumber,
            String name,
            String importance,
            String description,
            String detailImageUrl,
            String assistantComment,
            @ArraySchema(schema = @Schema(implementation = Object.class))
            JsonNode transform,
            boolean discovered,
            Instant discoveredAt
    ) {
        public static ClueItem from(Clue entity, DiscoveredClue discoveredClue) {
            boolean isDiscovered = discoveredClue != null;
            return new ClueItem(
                    entity.getId(),
                    entity.getRoom() != null ? entity.getRoom().getId() : 0,
                    entity.getRoom() != null ? entity.getRoom().getFloorNumber() : 0,
                    entity.getName(),
                    entity.getImportance().name(),
                    entity.getDescription(),
                    entity.getDetailImageUrl(),
                    entity.getAssistantComment(),
                    entity.getTransformJson(),
                    isDiscovered,
                    isDiscovered ? discoveredClue.getDiscoveredAt() : null
            );
        }
    }
}
