package com.ssafy.s14p11a707.game.dto;

import com.ssafy.s14p11a707.game.entity.DiscoveredClue;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public record ClueListResponse(
        long sessionId,
        long scenarioId,
        List<Clue> clues
) {

    public static ClueListResponse from(
            long sessionId,
            long scenarioId,
            List<com.ssafy.s14p11a707.scenario.entity.Clue> allClues,
            Map<Long, DiscoveredClue> discoveredMap
    ) {
        List<Clue> clueDtos = allClues.stream()
                .map(clue -> Clue.from(clue, discoveredMap.get(clue.getId())))
                .toList();
        return new ClueListResponse(sessionId, scenarioId, clueDtos);
    }

    public record Clue(
            long clueId,
            long roomId,
            int floorNumber,
            String name,
            String importance,
            String thumbnailUrl,
            boolean discovered,
            Instant discoveredAt
    ) {
        public static Clue from(com.ssafy.s14p11a707.scenario.entity.Clue entity, DiscoveredClue dc) {
            return new Clue(
                    entity.getId(),
                    entity.getRoom() != null ? entity.getRoom().getId() : 0,
                    entity.getRoom() != null ? entity.getRoom().getFloorNumber() : 0,
                    entity.getName(),
                    entity.getImportance().name(),
                    entity.getDetailImageUrl(),
                    dc != null,
                    dc != null ? dc.getDiscoveredAt() : null
            );
        }
    }
}
