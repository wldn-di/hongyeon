package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.game.entity.GameSession.Status;
import com.ssafy.s14p11a707.user.entity.User;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GameSessionRepository extends JpaRepository<GameSession, Long> {

    Page<GameSession> findByUserAndStatusIn(User user, List<Status> statuses, Pageable pageable);

    int countByUserAndRankGrade(User user, GameSession.RankGrade rankGrade);

    boolean existsByScenarioIdAndUserIdAndStatus(long scenarioId, long userId, Status status);

    // 특정 유저의 특정 시나리오에 대한 가장 최신 세션 조회
    Optional<GameSession> findTopByScenarioIdAndUserIdOrderByCreatedAtDesc(long scenarioId, long userId);

    // 시나리오 ID로 세션 목록 조회
    List<GameSession> findByScenarioId(long scenarioId);

    // 유저 ID로 세션 목록 조회
    List<GameSession> findByUserId(long userId);

    // GameSessionRepository
    Optional<GameSession> findByUserIdAndScenarioId(long userId, long scenarioId);

    @Query("select s from GameSession s join fetch s.user join fetch s.scenario where s.id = :sessionId")
    Optional<GameSession> findByIdWithUserAndScenario(@Param("sessionId") long sessionId);

    // LOB 문제 회피: 권한 체크를 위해 ownerId만 조회
    @Query("SELECT s.user.id FROM GameSession s WHERE s.id = :sessionId")
    Optional<Long> findOwnerIdById(@Param("sessionId") long sessionId);

}
