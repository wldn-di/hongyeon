package com.ssafy.s14p11a707.game.dto;

import com.ssafy.s14p11a707.game.entity.DiscoveredClue;
import com.ssafy.s14p11a707.scenario.entity.Clue;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record ClueListResponse(
        long sessionId,
        long scenarioId,
        List<ClueItem> clues
) {

    public static ClueListResponse from(
            long sessionId,
            long scenarioId,
            List<DiscoveredClue> discoveredClues) {
        List<ClueItem> clueDtos = discoveredClues.stream()
                .map(ClueItem::from)
                .toList();

        return new ClueListResponse(sessionId, scenarioId, clueDtos);
    }

    public record ClueItem(
            long clueId,
            long roomId,
            int floorNumber,
            String name,
            String importance,
            String detailImageUrl,
            Instant discoveredAt
    ) {
        public static ClueItem from(DiscoveredClue dc) {
            var entity = dc.getClue();
            return new ClueItem(
                    entity.getId(),
                    entity.getRoom() != null ? entity.getRoom().getId() : 0,
                    entity.getRoom() != null ? entity.getRoom().getFloorNumber() : 0,
                    entity.getName(),
                    entity.getImportance().name(),
                    entity.getDetailImageUrl(),
                    dc.getDiscoveredAt()
            );
        }
    }
}
