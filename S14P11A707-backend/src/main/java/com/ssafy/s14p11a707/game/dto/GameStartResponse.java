package com.ssafy.s14p11a707.game.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.List;

public record GameStartResponse(
        long sessionId,
        long scenarioId,
        long userId,
        String status,
        Instant startedAt,
        Scenario scenario,
        Victim victim,
        CurrentRoom currentRoom,
        List<EventLog> eventLogs
) {

    public record Scenario(
            String title,
            String opening
    ) {
    }

    public record Victim(
            String name,
            int age,
            String gender,
            String occupation,
            String discoveryLocation,
            String estimatedDeathTime,
            String causeOfDeath,
            String portraitUrl
    ) {
    }

    public record CurrentRoom(
            int floorNumber,
            String roomName,
            String roomType,
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

