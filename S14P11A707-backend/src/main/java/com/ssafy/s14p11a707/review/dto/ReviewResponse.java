package com.ssafy.s14p11a707.review.dto;

import java.time.Instant;

public record ReviewResponse(
        long reviewId,
        long scenarioId,
        long userId,
        String nickname,
        int rating,
        int difficulty,
        String content,
        boolean isSpoiler,
        Instant createdAt,
        Instant updatedAt
) {
}

