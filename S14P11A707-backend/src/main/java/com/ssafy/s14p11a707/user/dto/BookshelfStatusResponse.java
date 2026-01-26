package com.ssafy.s14p11a707.user.dto;

import java.time.Instant;
import java.util.List;

public record BookshelfStatusResponse(
        List<Item> content,
        int totalPages,
        long totalElements,
        int currentPage
) {

    public record Item(
            long sessionId,
            String status,
            long playTime,
            Instant playedAt,
            long scenarioId,
            String title,
            String synopsis,
            String genre,
            String difficulty,
            String thumbnailUrl,
            Integer finalScore,
            String rankGrade
    ) {
    }
}

