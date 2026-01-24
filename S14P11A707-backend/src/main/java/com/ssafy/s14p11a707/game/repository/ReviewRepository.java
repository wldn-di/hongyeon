package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {
}

