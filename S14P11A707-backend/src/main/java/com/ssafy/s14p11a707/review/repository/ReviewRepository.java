package com.ssafy.s14p11a707.review.repository;

import com.ssafy.s14p11a707.review.entity.Review;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByScenarioIdOrderByCreatedAtDesc(long scenarioId);

    Page<Review> findByScenarioId(long scenarioId, Pageable pageable);

    Optional<Review> findByScenarioIdAndUserId(long scenarioId, long userId);

    boolean existsByScenarioIdAndUserId(long scenarioId, long userId);

    @Query("select r from Review r join fetch r.user where r.id = :reviewId")
    Optional<Review> findByIdWithUser(@Param("reviewId") long reviewId);

    // 평균 계산 (삭제된 리뷰 포함)
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.scenario.id = :scenarioId")
    Double calculateAvgRating(@Param("scenarioId") long scenarioId);

    @Query("SELECT AVG(r.difficulty) FROM Review r WHERE r.scenario.id = :scenarioId")
    Double calculateAvgDifficulty(@Param("scenarioId") long scenarioId);
}

