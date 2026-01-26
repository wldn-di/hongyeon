package com.ssafy.s14p11a707.review.service.v1;

import com.ssafy.s14p11a707.review.dto.ReviewCreateRequest;
import com.ssafy.s14p11a707.review.dto.ReviewListResponse;
import com.ssafy.s14p11a707.review.dto.ReviewResponse;
import com.ssafy.s14p11a707.review.dto.ReviewUpdateRequest;

public interface ReviewService {

    ReviewListResponse getReviews(long scenarioId);

    ReviewResponse createReview(long scenarioId, ReviewCreateRequest request);

    ReviewResponse updateReview(long reviewId, ReviewUpdateRequest request);

    ReviewResponse deleteReview(long reviewId);
}

