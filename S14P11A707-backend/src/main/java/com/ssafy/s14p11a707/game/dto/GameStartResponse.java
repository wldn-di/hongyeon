package com.ssafy.s14p11a707.game.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.scenario.entity.Room;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

public record GameStartResponse(
        long sessionId,
        long scenarioId,
        long userId,
        String status,
        Instant startedAt,
        Scenario scenario,
        Victim victim,
        CurrentRoom currentRoom,
        EventLog eventLog
) {

    public static GameStartResponse from(
            GameSession session,
            com.ssafy.s14p11a707.scenario.entity.Scenario scenarioEntity,
            com.ssafy.s14p11a707.scenario.entity.Victim victimEntity,
            Room roomEntity,
            com.ssafy.s14p11a707.game.entity.EventLog startLog
    ) {
        return new GameStartResponse(
                session.getId(),
                scenarioEntity.getId(),
                session.getUser().getId(),
                session.getStatus().name(),
                session.getStartedAt(),
                Scenario.from(scenarioEntity),
                victimEntity != null ? Victim.from(victimEntity) : null,
                roomEntity != null ? CurrentRoom.from(roomEntity) : null,
                startLog != null ? EventLog.from(startLog) : null
        );
    }

    public record Scenario(
            String title,
            String opening
    ) {
        public static Scenario from(com.ssafy.s14p11a707.scenario.entity.Scenario entity) {
            return new Scenario(entity.getTitle(), entity.getSynopsis());
        }
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
        public static Victim from(com.ssafy.s14p11a707.scenario.entity.Victim entity) {
            return new Victim(
                    entity.getName(),
                    entity.getAge() != null ? entity.getAge() : 0,
                    entity.getGender(),
                    entity.getOccupation(),
                    entity.getDiscoveryLocation(),
                    entity.getEstimatedDeathTime(),
                    entity.getCauseOfDeath(),
                    entity.getPortraitUrl()
            );
        }
    }

    public record CurrentRoom(
            int floorNumber,
            String roomName,
            String roomType,
            @ArraySchema(schema = @Schema(implementation = Object.class))
            JsonNode objects
    ) {
        public static CurrentRoom from(Room entity) {
            return new CurrentRoom(
                    entity.getFloorNumber(),
                    entity.getRoomName(),
                    entity.getRoomType(),
                    entity.getObjectJson()
            );
        }
    }

    public record EventLog(
            String type,
            String message,
            Instant createdAt
    ) {
        public static EventLog from(com.ssafy.s14p11a707.game.entity.EventLog entity) {
            return new EventLog(
                    entity.getEventType().name(),
                    entity.getDisplayMessage(),
                    entity.getCreatedAt()
            );
        }
    }
}
