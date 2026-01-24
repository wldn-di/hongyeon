package com.ssafy.s14p11a707.review.service.impl;

import com.ssafy.s14p11a707.mock.MockFixtures;
import com.ssafy.s14p11a707.review.dto.ReviewCreateRequest;
import com.ssafy.s14p11a707.review.dto.ReviewListResponse;
import com.ssafy.s14p11a707.review.dto.ReviewResponse;
import com.ssafy.s14p11a707.review.service.ReviewService;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public class ReviewServiceMockImpl implements ReviewService {

    private static final AtomicLong REVIEW_ID_SEQUENCE = new AtomicLong(900_000L);
    private static final ConcurrentMap<Long, StoredReview> REVIEWS = new ConcurrentHashMap<>();

    @Override
    public ReviewListResponse getReviews(long scenarioId) {
        boolean isBaseScenario = MockFixtures.scenarios().stream().anyMatch(s -> s.id() == scenarioId);
        List<ReviewListResponse.Item> base = isBaseScenario
                ? MockFixtures.reviewListResponse(scenarioId).content()
                : List.of();

        List<ReviewListResponse.Item> created = REVIEWS.values().stream()
                .filter(r -> r.scenarioId() == scenarioId)
                .sorted((a, b) -> b.createdAt().compareTo(a.createdAt()))
                .map(r -> new ReviewListResponse.Item(
                        r.reviewId(),
                        r.userId(),
                        r.nickname(),
                        r.rating(),
                        r.difficulty(),
                        r.content(),
                        r.isSpoiler(),
                        r.createdAt()
                ))
                .toList();

        List<ReviewListResponse.Item> merged = new java.util.ArrayList<>(created.size() + base.size());
        merged.addAll(created);
        merged.addAll(base);

        return new ReviewListResponse(
                scenarioId,
                List.copyOf(merged),
                1,
                merged.size(),
                0
        );
    }

    @Override
    public ReviewResponse createReview(long scenarioId, ReviewCreateRequest request) {
        Instant now = Instant.now();
        long reviewId = REVIEW_ID_SEQUENCE.incrementAndGet();

        StoredReview review = StoredReview.fromCreate(reviewId, scenarioId, now, request);
        REVIEWS.put(reviewId, review);

        return review.toResponse();
    }

    @Override
    public ReviewResponse updateReview(long reviewId, ReviewCreateRequest request) {
        StoredReview existing = REVIEWS.get(reviewId);
        if (existing == null) {
            return StoredReview.fromCreate(reviewId, 1L, Instant.now(), request).toResponse();
        }

        StoredReview updated = existing.applyUpdate(request, Instant.now());
        REVIEWS.put(reviewId, updated);
        return updated.toResponse();
    }

    @Override
    public ReviewResponse deleteReview(long reviewId) {
        StoredReview existing = REVIEWS.remove(reviewId);
        if (existing == null) {
            return new ReviewResponse(
                    reviewId,
                    1L,
                    MockFixtures.meUserId(),
                    MockFixtures.nicknameOf(MockFixtures.meUserId()),
                    0,
                    0,
                    "삭제된 리뷰입니다.",
                    false,
                    Instant.now(),
                    Instant.now()
            );
        }

        return new ReviewResponse(
                existing.reviewId(),
                existing.scenarioId(),
                existing.userId(),
                existing.nickname(),
                existing.rating(),
                existing.difficulty(),
                "삭제된 리뷰입니다.",
                existing.isSpoiler(),
                existing.createdAt(),
                Instant.now()
        );
    }

    private record StoredReview(
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
        static StoredReview fromCreate(long reviewId, long scenarioId, Instant now, ReviewCreateRequest request) {
            int rating = request == null ? 5 : clamp(request.rating(), 1, 5, 5);
            int difficulty = request == null ? 3 : clamp(request.difficulty(), 1, 5, 3);
            String content = request == null || request.content() == null || request.content().isBlank()
                    ? "재미있게 플레이했어요. 단서 연결이 인상적이었습니다."
                    : request.content().trim();
            boolean spoiler = request != null && request.isSpoiler();

            long userId = MockFixtures.meUserId();
            String nickname = MockFixtures.nicknameOf(userId);

            return new StoredReview(
                    reviewId,
                    scenarioId,
                    userId,
                    nickname,
                    rating,
                    difficulty,
                    content,
                    spoiler,
                    now,
                    now
            );
        }

        StoredReview applyUpdate(ReviewCreateRequest request, Instant now) {
            int rating = request == null ? this.rating : clamp(request.rating(), 1, 5, this.rating);
            int difficulty = request == null ? this.difficulty : clamp(request.difficulty(), 1, 5, this.difficulty);
            String content = request == null || request.content() == null || request.content().isBlank()
                    ? this.content
                    : request.content().trim();
            boolean spoiler = request == null ? this.isSpoiler : request.isSpoiler();

            return new StoredReview(
                    reviewId,
                    scenarioId,
                    userId,
                    nickname,
                    rating,
                    difficulty,
                    content,
                    spoiler,
                    createdAt,
                    now
            );
        }

        ReviewResponse toResponse() {
            return new ReviewResponse(
                    reviewId,
                    scenarioId,
                    userId,
                    nickname,
                    rating,
                    difficulty,
                    content,
                    isSpoiler,
                    createdAt,
                    updatedAt
            );
        }

        private static int clamp(int value, int min, int max, int fallback) {
            if (value < min || value > max) return fallback;
            return value;
        }
    }
}
