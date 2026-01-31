package com.ssafy.s14p11a707.scenario.repository;

import com.ssafy.s14p11a707.game.entity.ChatMessage;
import com.ssafy.s14p11a707.scenario.entity.Suspect;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface SuspectRepository extends JpaRepository<Suspect, Long> {
    default List<Suspect> saveSuspects(List<Suspect> suspects) {
        return saveAll(suspects);
    }

    List<Suspect> findByScenarioIdOrderByDisplayOrderAsc(long scenarioId);
    @Modifying
    @Transactional
    @Query("DELETE FROM Suspect s WHERE s.scenario.id = :scenarioId")
    void deleteByScenarioId(@Param("scenarioId") long scenarioId);

}

