package com.ssafy.s14p11a707.review.service;

import com.ssafy.s14p11a707.review.dto.ReviewCreateRequest;
import com.ssafy.s14p11a707.review.dto.ReviewListResponse;
import com.ssafy.s14p11a707.review.dto.ReviewResponse;
import com.ssafy.s14p11a707.review.dto.ReviewUpdateRequest;
import org.springframework.data.domain.Pageable;

public interface ReviewService {

    ReviewListResponse getReviews(long scenarioId, Pageable pageable);

    ReviewResponse createReview(long scenarioId, ReviewCreateRequest request, long userId);

    ReviewResponse updateReview(long reviewId, ReviewUpdateRequest request);

    ReviewResponse deleteReview(long reviewId);
}

