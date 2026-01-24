package com.ssafy.s14p11a707.review.service;

import com.ssafy.s14p11a707.review.dto.ReviewCreateRequest;
import com.ssafy.s14p11a707.review.dto.ReviewListResponse;
import com.ssafy.s14p11a707.review.dto.ReviewResponse;

public interface ReviewService {

    ReviewListResponse getReviews(long scenarioId);

    ReviewResponse createReview(long scenarioId, ReviewCreateRequest request);

    ReviewResponse updateReview(long reviewId, ReviewCreateRequest request);

    ReviewResponse deleteReview(long reviewId);
}

