package com.ssafy.s14p11a707.game.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.scenario.entity.Room;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

public record FloorMoveResponse(
        long sessionId,
        int currentFloor,
        boolean isFirstVisit,
        FloorMoveResponse.RoomDto room,
        FloorMoveResponse.EventLog eventLog
) {

    public static FloorMoveResponse from(
            long sessionId,
            int currentFloor,
            boolean isFirstVisit,
            Room roomEntity,
            com.ssafy.s14p11a707.game.entity.EventLog newEventLog
    ) {
        return new FloorMoveResponse(
                sessionId,
                currentFloor,
                isFirstVisit,
                RoomDto.from(roomEntity, isFirstVisit),
                newEventLog != null ? EventLog.from(newEventLog) : null
        );
    }

    public record RoomDto(
            long roomId,
            int floorNumber,
            String roomName,
            String roomType,
            String description,
            String assistantComment,
            @ArraySchema(schema = @Schema(implementation = Object.class))
            JsonNode objects
    ) {
        public static RoomDto from(Room entity, boolean isFirstVisit) {
            return new RoomDto(
                    entity.getId(),
                    entity.getFloorNumber(),
                    entity.getRoomName(),
                    entity.getRoomType(),
                    entity.getDescription(),
                    isFirstVisit ? entity.getAssistantComment() : null,
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
