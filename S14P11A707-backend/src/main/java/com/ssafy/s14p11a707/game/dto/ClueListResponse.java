package com.ssafy.s14p11a707.game.dto;

import java.time.Instant;
import java.util.List;

public record ClueListResponse(
        long sessionId,
        long scenarioId,
        List<Clue> clues
) {

    public record Clue(
            long clueId,
            long roomId,
            int floorNumber,
            String name,
            String importance,
            boolean discovered,
            Instant discoveredAt
    ) {
    }
}

