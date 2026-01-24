package com.ssafy.s14p11a707.review.dto;

import java.time.Instant;
import java.util.List;

public record ReviewListResponse(
        long scenarioId,
        List<Item> content,
        int totalPages,
        long totalElements,
        int currentPage
) {

    public record Item(
            long reviewId,
            long userId,
            String nickname,
            int rating,
            int difficulty,
            String content,
            boolean isSpoiler,
            Instant createdAt
    ) {
    }
}

