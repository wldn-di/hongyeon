package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.game.entity.GameSession.Status;
import com.ssafy.s14p11a707.user.entity.User;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameSessionRepository extends JpaRepository<GameSession, Long> {

    Page<GameSession> findByUserAndStatusIn(User user, List<Status> statuses, Pageable pageable);

    int countByUserAndRankGrade(User user, GameSession.RankGrade rankGrade);

    boolean existsByScenarioIdAndUserIdAndStatus(long scenarioId, long userId, Status status);
}
