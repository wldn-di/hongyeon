package com.ssafy.s14p11a707.scenario.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

public record RoomListResponse(
        long scenarioId,
        List<Room> rooms
) {

    public record Room(
            long roomId,
            int floorNumber,
            String roomType,
            String roomName,
            String description,
            String assistantComment,
            JsonNode objects
    ) {
    }
}

