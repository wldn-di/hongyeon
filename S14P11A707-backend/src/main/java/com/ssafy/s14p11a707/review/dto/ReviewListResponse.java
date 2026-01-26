package com.ssafy.s14p11a707.review.dto;

import com.ssafy.s14p11a707.review.entity.Review;

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
            Instant createdAt,
            boolean isDeleted
    ) {
        public static Item from(Review review) {
            return new Item(
                    review.getId(),
                    review.getUser().getId(),
                    review.getUser().getNickname(),
                    review.getRating(),
                    review.getDifficulty(),
                    review.isDeleted() ? "삭제된 리뷰입니다." : review.getContent(),                                                                                 review.isSpoiler(),
                    review.getCreatedAt(),
                    review.isDeleted()
            );
        }
    }
}

