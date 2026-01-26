package com.ssafy.s14p11a707.review.dto;

import com.ssafy.s14p11a707.review.entity.Review;

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
    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getScenario().getId(),
                review.getUser().getId(),
                review.getUser().getNickname(),
                review.getRating(),
                review.getDifficulty(),
                review.isDeleted() ? "삭제된 리뷰입니다." : review.getContent(),                                                                             review.isSpoiler(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}

