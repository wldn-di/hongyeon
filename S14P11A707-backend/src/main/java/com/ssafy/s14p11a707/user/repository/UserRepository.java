package com.ssafy.s14p11a707.user.repository;

import com.ssafy.s14p11a707.user.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByGoogleId(String googleId);

    Optional<User> findByEmail(String email);

    // 랭킹 Top 10 조회
    List<User> findTop10ByOrderByTotalScoreDesc();

    List<User> findTop10ByOrderByTotalClearsDesc();

    List<User> findTop10ByOrderByTotalPlayTimeDesc();

    // 내 순위 계산용
    long countByTotalScoreGreaterThan(int totalScore);

    long countByTotalClearsGreaterThan(int totalClears);

    long countByTotalPlayTimeLessThan(long totalPlayTime);
}
