package com.ssafy.s14p11a707.game.dto;

import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.game.entity.DiscoveredClue;
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
        Instant startedAt,
        Instant lastSavedAt,
        List<InventoryClue> inventory
) {

    public static GameResumeResponse from(
            GameSession session,
            List<Integer> visitedFloors,
            List<DiscoveredClue> discoveredClues
    ) {
        List<InventoryClue> inventory = discoveredClues.stream()
                .map(InventoryClue::from)
                .toList();

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
                session.getStartedAt(),
                session.getLastSavedAt(),
                inventory
        );
    }

    public record InventoryClue(
            long clueId,
            String name,
            String importance,
            String detailImageUrl,
            Instant discoveredAt
    ) {
        public static InventoryClue from(DiscoveredClue discoveredClue) {
            var clue = discoveredClue.getClue();
            return new InventoryClue(
                    clue.getId(),
                    clue.getName(),
                    clue.getImportance().name(),
                    clue.getDetailImageUrl(),
                    discoveredClue.getDiscoveredAt()
            );
        }
    }
}
