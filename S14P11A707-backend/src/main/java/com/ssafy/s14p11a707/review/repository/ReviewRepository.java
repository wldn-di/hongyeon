package com.ssafy.s14p11a707.review.repository;

import com.ssafy.s14p11a707.review.entity.Review;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByScenarioIdOrderByCreatedAtDesc(long scenarioId);

    Page<Review> findByScenarioId(long scenarioId, Pageable pageable);

    Optional<Review> findByScenarioIdAndUserId(long scenarioId, long userId);

    boolean existsByScenarioIdAndUserId(long scenarioId, long userId);
}

