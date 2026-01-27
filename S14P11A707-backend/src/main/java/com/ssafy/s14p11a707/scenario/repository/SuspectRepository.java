package com.ssafy.s14p11a707.scenario.repository;

import com.ssafy.s14p11a707.scenario.entity.Suspect;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SuspectRepository extends JpaRepository<Suspect, Long> {
    default List<Suspect> saveSuspects(List<Suspect> suspects) {
        return saveAll(suspects);
    }

    List<Suspect> findByScenarioIdOrderByDisplayOrderAsc(long scenarioId);
}

