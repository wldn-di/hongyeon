package com.ssafy.s14p11a707.scenario.dto;

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

public record RoomListResponse(
        long scenarioId,
        String scenarioTitle,
        List<Room> rooms
) {

    public record Room(
            long roomId,
            int floorNumber,
            String roomType,
            String roomName,
            String description,
            String assistantComment,
            String backgroundImageUrl,
            @ArraySchema(schema = @Schema(implementation = Object.class))
            JsonNode objects
    ) {
    }
}

