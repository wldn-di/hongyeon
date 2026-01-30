package com.ssafy.s14p11a707.security.authorization;

import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReviewAccessPolicy {

    private final ReviewRepository reviewRepository;

    public void assertReviewOwner(long userId, long reviewId) {
        var review = reviewRepository.findByIdWithUser(reviewId)
                .orElseThrow(() -> new BaseException(ErrorCode.REVIEW_NOT_FOUND));
        if (review.getUser().getId() != userId) {
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }
    }
}

