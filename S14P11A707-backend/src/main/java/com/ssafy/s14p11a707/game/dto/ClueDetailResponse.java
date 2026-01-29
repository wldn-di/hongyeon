package com.ssafy.s14p11a707.game.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.game.entity.DiscoveredClue;
import com.ssafy.s14p11a707.scenario.entity.Clue;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

public record ClueDetailResponse(
        long clueId,
        long roomId,
        int floorNumber,
        String name,
        String importance,
        String description,
        String detailImageUrl,
        String assistantComment,
        @ArraySchema(schema = @Schema(implementation = Object.class))
        JsonNode clueDetail,
        @ArraySchema(schema = @Schema(implementation = Object.class))
        JsonNode transform,
        Instant discoveredAt
) {
    public static ClueDetailResponse from(DiscoveredClue dc) {
        Clue entity = dc.getClue();
        return new ClueDetailResponse(
                entity.getId(),
                entity.getRoom() != null ? entity.getRoom().getId() : 0,
                entity.getRoom() != null ? entity.getRoom().getFloorNumber() : 0,
                entity.getName(),
                entity.getImportance().name(),
                entity.getDescription(),
                entity.getDetailImageUrl(),
                entity.getAssistantComment(),
                entity.getClueDetailJson(),
                entity.getTransformJson(),
                dc.getDiscoveredAt()
        );
    }
}