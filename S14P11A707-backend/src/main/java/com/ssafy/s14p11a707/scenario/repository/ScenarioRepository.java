package com.ssafy.s14p11a707.scenario.repository;

import com.ssafy.s14p11a707.scenario.entity.Scenario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScenarioRepository extends JpaRepository<Scenario, Long> {
    default Scenario saveScenario(Scenario scenario) {
        return save(scenario);
    }

    List<Scenario> findByTitleContainingOrSynopsisContaining(String title, String synopsis);
}

