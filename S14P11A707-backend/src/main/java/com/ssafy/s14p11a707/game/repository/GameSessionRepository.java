package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.game.entity.GameSession.Status;
import com.ssafy.s14p11a707.user.entity.User;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameSessionRepository extends JpaRepository<GameSession, Long> {

    // 유저별 특정 상태들 세션 조회 (통합 책장 조회용, 페이징)
    Page<GameSession> findByUserAndStatusIn(User user, List<Status> statuses, Pageable pageable);

    // 유저별 세션 개수 (S랭크 카운트용)
    int countByUserAndRankGrade(User user, GameSession.RankGrade rankGrade);
}

