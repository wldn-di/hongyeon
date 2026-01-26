package com.ssafy.s14p11a707.game.dto;

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;

public record FloorMoveResponse(
        long sessionId,
        int currentFloor,
        boolean isFirstVisit,
        Room room,
        List<EventLog> eventLogs
) {

    public record Room(
            long roomId,
            int floorNumber,
            String roomName,
            String roomType,
            String description,
            String assistantComment,
            @ArraySchema(schema = @Schema(implementation = Object.class))
            JsonNode objects
    ) {
    }

    public record EventLog(
            String type,
            String message,
            Instant createdAt
    ) {
    }
}

