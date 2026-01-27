package com.ssafy.s14p11a707.game.dto;

import com.ssafy.s14p11a707.game.entity.BoardConnection;
import com.ssafy.s14p11a707.game.entity.BoardNode;
import com.ssafy.s14p11a707.game.entity.DiscoveredClue;
import com.ssafy.s14p11a707.game.entity.EventLog;
import com.ssafy.s14p11a707.game.entity.GameSession;
import java.time.Instant;
import java.util.List;

public record GameResumeResponse(
        long sessionId,
        long scenarioId,
        long userId,
        String status,
        int currentFloor,
        List<Integer> visitedFloors,
        int health,
        int submitAttempts,
        long playTime,
        Instant lastSavedAt,
        Instant expiresAt,
        Inventory inventory,
        Board board,
        List<EventLogDto> eventLogs
) {

    public static GameResumeResponse from(
            GameSession session,
            List<Integer> visitedFloors,
            List<DiscoveredClue> discoveredClues,
            List<BoardNode> nodeEntities,
            List<BoardConnection> connectionEntities,
            int redConnectionCount,
            List<EventLog> eventLogEntities
    ) {
        return new GameResumeResponse(
                session.getId(),
                session.getScenario().getId(),
                session.getUser().getId(),
                session.getStatus().name(),
                session.getCurrentFloor() != null ? session.getCurrentFloor() : 1,
                visitedFloors,
                session.getHealth() != null ? session.getHealth() : 100,
                session.getSubmitAttempts() != null ? session.getSubmitAttempts() : 0,
                session.getPlayTime() != null ? session.getPlayTime() : 0,
                session.getLastSavedAt(),
                session.getExpiresAt(),
                new Inventory(discoveredClues.stream().map(InventoryClue::from).toList()),
                new Board(
                        nodeEntities.stream().map(BoardNodeDto::from).toList(),
                        connectionEntities.stream().map(BoardConnectionDto::from).toList(),
                        redConnectionCount
                ),
                eventLogEntities.stream().map(EventLogDto::from).toList()
        );
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
