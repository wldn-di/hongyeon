package com.ssafy.s14p11a707.game.dto;

import java.time.Instant;

public record DiscoveredClueResponse(
        long sessionId,
        Clue clue,
        Instant discoveredAt
) {

    public record Clue(
            long clueId,
            String name,
            String description,
            String importance,
            String detailImageUrl,
            String assistantComment
    ) {
    }
}

