package com.ssafy.s14p11a707.user.repository;

import com.ssafy.s14p11a707.user.entity.User;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByGoogleId(String googleId);

    Optional<User> findByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") Long id);

    // 랭킹 Top 10 조회
    List<User> findTop10ByOrderByTotalScoreDesc();

    List<User> findTop10ByOrderByTotalClearsDesc();

    List<User> findTop10ByOrderByTotalPlayTimeDesc();

    // 내 순위 계산용
    long countByTotalScoreGreaterThan(int totalScore);

    long countByTotalClearsGreaterThan(int totalClears);

    long countByTotalPlayTimeLessThan(long totalPlayTime);
}
