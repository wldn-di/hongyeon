package com.ssafy.s14p11a707.game.dto;

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
        Board board
) {

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
    }

    public record Board(
            List<BoardNode> nodes,
            List<BoardConnection> connections,
            int redConnectionCount
    ) {
    }
}

