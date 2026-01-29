package com.ssafy.s14p11a707.game.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.game.entity.BoardConnection;
import com.ssafy.s14p11a707.game.entity.BoardNode;
import com.ssafy.s14p11a707.game.entity.DiscoveredClue;
import com.ssafy.s14p11a707.game.entity.EventLog;
import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.scenario.entity.Room;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;

public record GameSessionResponse(
        long sessionId,
        long scenarioId,
        long userId,
        String status,
        SessionType sessionType,
        Instant startedAt,
        int currentFloor,
        List<Integer> visitedFloors,
        int health,
        int submitAttempts,
        long playTime,
        Instant lastSavedAt,
        Scenario scenario,
        Victim victim,
        CurrentRoom currentRoom,
        Inventory inventory,
        Board board,
        List<EventLogDto> eventLogs
) {

    public enum SessionType {
        NEW,       // 새 게임
        RESUME,    // 이어하기 (PLAYING 상태)
        RESTART    // 실패 후 재시작
    }

    /**
     * 새 게임 또는 재시작 시 사용
     */
    public static GameSessionResponse forNewGame(
            GameSession session,
            com.ssafy.s14p11a707.scenario.entity.Scenario scenarioEntity,
            com.ssafy.s14p11a707.scenario.entity.Victim victimEntity,
            Room roomEntity,
            EventLog startLog,
            SessionType sessionType
    ) {
        return new GameSessionResponse(
                session.getId(),
                scenarioEntity.getId(),
                session.getUser().getId(),
                session.getStatus().name(),
                sessionType,
                session.getStartedAt(),
                session.getCurrentFloor() != null ? session.getCurrentFloor() : 1,
                List.of(1),
                session.getHealth() != null ? session.getHealth() : 100,
                session.getSubmitAttempts() != null ? session.getSubmitAttempts() : 0,
                session.getPlayTime() != null ? session.getPlayTime() : 0,
                session.getLastSavedAt(),
                Scenario.from(scenarioEntity),
                victimEntity != null ? Victim.from(victimEntity) : null,
                roomEntity != null ? CurrentRoom.from(roomEntity) : null,
                new Inventory(List.of()),
                new Board(List.of(), List.of(), 0),
                startLog != null ? List.of(EventLogDto.from(startLog)) : List.of()
        );
    }

    /**
     * 이어하기 시 사용
     */
    public static GameSessionResponse forResume(
            GameSession session,
            com.ssafy.s14p11a707.scenario.entity.Scenario scenarioEntity,
            com.ssafy.s14p11a707.scenario.entity.Victim victimEntity,
            Room roomEntity,
            List<Integer> visitedFloors,
            List<DiscoveredClue> discoveredClues,
            List<BoardNode> nodeEntities,
            List<BoardConnection> connectionEntities,
            int redConnectionCount,
            List<EventLog> eventLogEntities
    ) {
        return new GameSessionResponse(
                session.getId(),
                scenarioEntity.getId(),
                session.getUser().getId(),
                session.getStatus().name(),
                SessionType.RESUME,
                session.getStartedAt(),
                session.getCurrentFloor() != null ? session.getCurrentFloor() : 1,
                visitedFloors,
                session.getHealth() != null ? session.getHealth() : 100,
                session.getSubmitAttempts() != null ? session.getSubmitAttempts() : 0,
                session.getPlayTime() != null ? session.getPlayTime() : 0,
                session.getLastSavedAt(),
                Scenario.from(scenarioEntity),
                victimEntity != null ? Victim.from(victimEntity) : null,
                roomEntity != null ? CurrentRoom.from(roomEntity) : null,
                new Inventory(discoveredClues.stream().map(InventoryClue::from).toList()),
                new Board(
                        nodeEntities.stream().map(BoardNodeDto::from).toList(),
                        connectionEntities.stream().map(BoardConnectionDto::from).toList(),
                        redConnectionCount
                ),
                eventLogEntities.stream().map(EventLogDto::from).toList()
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

    public record Inventory(
            List<InventoryClue> clues
    ) {
    }

    public record InventoryClue(
            long clueId,
            String name,
            String importance,
            Instant discoveredAt
    ) {
        public static InventoryClue from(DiscoveredClue dc) {
            return new InventoryClue(
                    dc.getClue().getId(),
                    dc.getClue().getName(),
                    dc.getClue().getImportance().name(),
                    dc.getDiscoveredAt()
            );
        }
    }

    public record Board(
            List<BoardNodeDto> nodes,
            List<BoardConnectionDto> connections,
            int redConnectionCount
    ) {
    }

    public record EventLogDto(
            String type,
            String message,
            Instant createdAt
    ) {
        public static EventLogDto from(EventLog entity) {
            return new EventLogDto(
                    entity.getEventType().name(),
                    entity.getDisplayMessage(),
                    entity.getCreatedAt()
            );
        }
    }
}
