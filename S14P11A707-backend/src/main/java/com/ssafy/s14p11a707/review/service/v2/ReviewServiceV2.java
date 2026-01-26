package com.ssafy.s14p11a707.review.service.v2;

import com.ssafy.s14p11a707.review.dto.ReviewCreateRequest;
import com.ssafy.s14p11a707.review.dto.ReviewListResponse;
import com.ssafy.s14p11a707.review.dto.ReviewResponse;
import com.ssafy.s14p11a707.review.dto.ReviewUpdateRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

public interface ReviewServiceV2 {

    ReviewListResponse getReviews(long scenarioId, Pageable pageable);

    ReviewResponse createReview(long scenarioId, ReviewCreateRequest request, OidcUser oidcUser);

    ReviewResponse updateReview(long reviewId, ReviewUpdateRequest request, OidcUser oidcUser);

    ReviewResponse deleteReview(long reviewId, OidcUser oidcUser);
}
