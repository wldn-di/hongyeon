package com.ssafy.s14p11a707.scenario.repository;

import com.ssafy.s14p11a707.scenario.entity.Victim;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VictimRepository extends JpaRepository<Victim, Long> {
    default Victim saveVictim(Victim victim) {
        return save(victim);
    }

    Optional<Victim> findByScenarioId(long scenarioId);

    Optional<Victim> findByScenarioId(long scenarioId);
}

