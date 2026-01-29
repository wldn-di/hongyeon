package com.ssafy.s14p11a707.scenario.repository;

import com.ssafy.s14p11a707.scenario.entity.Victim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface VictimRepository extends JpaRepository<Victim, Long> {
    default Victim saveVictim(Victim victim) {
        return save(victim);
    }

    Optional<Victim> findByScenarioId(long scenarioId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Victim v WHERE v.scenario.id = :scenarioId")
    void deleteByScenarioId(@Param("scenarioId") long scenarioId);
}

