package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.ScenarioRanking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScenarioRankingRepository extends JpaRepository<ScenarioRanking, Long> {

    List<ScenarioRanking> findByScenarioIdOrderByScoreDescClearTimeAsc(long scenarioId);

    void deleteBySessionId(long sessionId);
}

