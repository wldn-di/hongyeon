package com.ssafy.s14p11a707.review.service;

import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.review.repository.ReviewRepository;
import com.ssafy.s14p11a707.review.dto.ReviewCreateRequest;
import com.ssafy.s14p11a707.review.dto.ReviewListResponse;
import com.ssafy.s14p11a707.review.dto.ReviewResponse;
import com.ssafy.s14p11a707.review.dto.ReviewUpdateRequest;
import com.ssafy.s14p11a707.review.entity.Review;
import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.scenario.repository.ScenarioRepository;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ScenarioRepository scenarioRepository;
    private final UserRepository userRepository;

    @Override
    public ReviewListResponse getReviews(long scenarioId, Pageable pageable) {
        if (!scenarioRepository.existsById(scenarioId)) {
            throw new BaseException(ErrorCode.SCENARIO_NOT_FOUND);
        }

        Page<Review> reviewPage = reviewRepository.findByScenarioId(scenarioId, pageable);

        List<ReviewListResponse.Item> items = reviewPage.getContent().stream()
                .map(ReviewListResponse.Item::from)
                .toList();

        return new ReviewListResponse(
                scenarioId,
                items,
                reviewPage.getTotalPages(),
                reviewPage.getTotalElements(),
                reviewPage.getNumber()
        );
    }

    @Transactional
    @Override
    public ReviewResponse createReview(long scenarioId, ReviewCreateRequest request, long userId) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));

        Scenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new BaseException(ErrorCode.SCENARIO_NOT_FOUND));

        if (reviewRepository.existsByScenarioIdAndUserId(scenarioId, currentUser.getId())) {
            throw new BaseException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        Review review = request.toEntity(scenario, currentUser);
        reviewRepository.save(review);

        updateScenarioAverages(scenario);

        return ReviewResponse.from(review);
    }

    @Transactional
    @Override
    public ReviewResponse updateReview(long reviewId, ReviewUpdateRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BaseException(ErrorCode.REVIEW_NOT_FOUND));

        if (request != null) {
            review.updateContent(request.content());
        }

        return ReviewResponse.from(review);
    }

    @Transactional
    @Override
    public ReviewResponse deleteReview(long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BaseException(ErrorCode.REVIEW_NOT_FOUND));
        if (review.isDeleted()) {
            throw new BaseException(ErrorCode.REVIEW_ALREADY_DELETED);
        }

        review.markDeleted();

        return ReviewResponse.from(review);
    }

    private void updateScenarioAverages(Scenario scenario) {
        Double avgRating = reviewRepository.calculateAvgRating(scenario.getId());
        Double avgDifficulty = reviewRepository.calculateAvgDifficulty(scenario.getId());

        scenario.updateAverages(
                avgRating != null ? BigDecimal.valueOf(avgRating) : null,
                avgDifficulty != null ? BigDecimal.valueOf(avgDifficulty) : null
        );
    }
}
