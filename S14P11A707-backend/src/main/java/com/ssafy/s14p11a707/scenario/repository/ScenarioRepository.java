package com.ssafy.s14p11a707.scenario.repository;

import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ScenarioRepository extends JpaRepository<Scenario, Long>, JpaSpecificationExecutor<Scenario> {

    // 유저가 생성한 시나리오 조회 (페이징)
    Page<Scenario> findByCreator(User creator, Pageable pageable);
    Page<ScenarioListProjection> findByCreatorId(Long creatorId, Pageable pageable);

    List<ScenarioListProjection> findAllProjectedBy();
    default Scenario saveScenario(Scenario scenario) {
        return save(scenario);
    }

    // 유저 ID로 시나리오 목록 조회
    List<Scenario> findByCreatorId(long creatorId);

    boolean existsByCreatorIdAndGenerationStatus(Long creatorId, Scenario.GenerationStatus status);

    List<ScenarioListProjection> findAllByGenerationStatus(Scenario.GenerationStatus status);

    @Query("select s from Scenario s join fetch s.creator where s.id = :scenarioId")
    Optional<Scenario> findByIdWithCreator(@Param("scenarioId") long scenarioId);
}
