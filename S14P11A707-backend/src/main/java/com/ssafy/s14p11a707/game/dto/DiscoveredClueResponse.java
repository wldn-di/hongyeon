package com.ssafy.s14p11a707.game.dto;

import java.time.Instant;

public record DiscoveredClueResponse(
        long sessionId,
        Clue clue,
        Instant discoveredAt
) {

    public static DiscoveredClueResponse from(long sessionId, com.ssafy.s14p11a707.scenario.entity.Clue entity, Instant discoveredAt) {
        return new DiscoveredClueResponse(sessionId, Clue.from(entity), discoveredAt);
    }

    public record Clue(
            long clueId,
            String name,
            String description,
            String importance,
            String detailImageUrl,
            String assistantComment
    ) {
        public static Clue from(com.ssafy.s14p11a707.scenario.entity.Clue entity) {
            return new Clue(
                    entity.getId(),
                    entity.getName(),
                    entity.getDescription(),
                    entity.getImportance().name(),
                    entity.getDetailImageUrl(),
                    entity.getAssistantComment()
            );
        }
    }
}
