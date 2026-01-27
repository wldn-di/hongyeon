package com.ssafy.s14p11a707.scenario.repository;

import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScenarioRepository extends JpaRepository<Scenario, Long> {

    // 유저가 생성한 시나리오 조회 (페이징)
    Page<Scenario> findByCreator(User creator, Pageable pageable);
    default Scenario saveScenario(Scenario scenario) {
        return save(scenario);
    }

    List<Scenario> findByTitleContainingOrSynopsisContaining(String title, String synopsis);
}

