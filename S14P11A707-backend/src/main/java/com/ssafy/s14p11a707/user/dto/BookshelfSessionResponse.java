package com.ssafy.s14p11a707.user.dto;

import java.time.Instant;
import java.util.List;

public record BookshelfSessionResponse(
        List<Item> content,
        int totalPages,
        long totalElements,
        int currentPage
) {

    public record Item(
            long sessionId,
            long scenarioId,
            String title,
            String synopsis,
            String thumbnailUrl,
            String status,          // COMPLETED, PLAYING, FAILED
            Long playTime,          // COMPLETED, FAILED
            String rankGrade,       // COMPLETED (S/A/B/C/F)
            Instant lastSavedAt,    // PLAYING
            Instant expiresAt,      // PLAYING
            boolean hasReport       // COMPLETED (수사보고서 존재 여부)
    ) {}
}
