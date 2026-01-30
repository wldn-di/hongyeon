package com.ssafy.s14p11a707.review.api;

import com.ssafy.s14p11a707.review.dto.ReviewCreateRequest;
import com.ssafy.s14p11a707.review.dto.ReviewListResponse;
import com.ssafy.s14p11a707.review.dto.ReviewResponse;
import com.ssafy.s14p11a707.review.dto.ReviewUpdateRequest;
import com.ssafy.s14p11a707.review.service.ReviewService;
import com.ssafy.s14p11a707.security.CurrentUserIdResolver;
import com.ssafy.s14p11a707.security.authorization.ReviewAccessPolicy;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reviews")
public class ReviewApi implements ReviewApiDoc {

    private final ReviewService reviewService;
    private final ReviewAccessPolicy reviewAccessPolicy;
    private final CurrentUserIdResolver currentUserIdResolver;

    @GetMapping("/{scenarioId}/reviews")
    @Override
    public ResponseEntity<ReviewListResponse> getReviews(
            @PathVariable long scenarioId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(reviewService.getReviews(scenarioId, pageable));
    }

    @PostMapping("/{scenarioId}/reviews")
    @Override
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable long scenarioId,
            @Valid @RequestBody ReviewCreateRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        return ResponseEntity.ok(reviewService.createReview(scenarioId, request, userId));
    }

    @PatchMapping("/{reviewId}")
    @Override
    public ResponseEntity<ReviewResponse> updateReview(
            @PathVariable long reviewId,
            @RequestBody ReviewUpdateRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        reviewAccessPolicy.assertReviewOwner(userId, reviewId);
        return ResponseEntity.ok(reviewService.updateReview(reviewId, request));
    }

    @DeleteMapping("/{reviewId}")
    @Override
    public ResponseEntity<ReviewResponse> deleteReview(
            @PathVariable long reviewId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        reviewAccessPolicy.assertReviewOwner(userId, reviewId);
        return ResponseEntity.ok(reviewService.deleteReview(reviewId));
    }
}
