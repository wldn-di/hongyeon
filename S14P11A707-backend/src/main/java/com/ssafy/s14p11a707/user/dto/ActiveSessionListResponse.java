package com.ssafy.s14p11a707.user.dto;

import java.time.Instant;
import java.util.List;

public record ActiveSessionListResponse(
        List<Item> content,
        int totalPages,
        long totalElements,
        int currentPage
) {

    public record Item(
            long sessionId,
            long scenarioId,
            String title,
            String thumbnailUrl,
            String status,
            int currentFloor,
            int health,
            int submitAttempts,
            Instant lastSavedAt,
            Instant expiresAt
    ) {
    }
}

