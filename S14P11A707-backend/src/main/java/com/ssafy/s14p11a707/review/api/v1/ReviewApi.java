package com.ssafy.s14p11a707.review.api.v1;

import com.ssafy.s14p11a707.review.dto.ReviewResponse;
import com.ssafy.s14p11a707.review.dto.ReviewUpdateRequest;
import com.ssafy.s14p11a707.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/reviews")
public class ReviewApi implements ReviewApiDoc {

    private final ReviewService reviewService;

    @PatchMapping("/{reviewId}")
    @Override
    public ResponseEntity<ReviewResponse> updateReview(
            @PathVariable long reviewId,
            @RequestBody ReviewUpdateRequest request
    ) {
        return ResponseEntity.ok(reviewService.updateReview(reviewId, request));
    }

    @DeleteMapping("/{reviewId}")
    @Override
    public ResponseEntity<ReviewResponse> deleteReview(@PathVariable long reviewId) {
        return ResponseEntity.ok(reviewService.deleteReview(reviewId));
    }
}
