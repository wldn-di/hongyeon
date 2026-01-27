package com.ssafy.s14p11a707.scenario.repository;

import com.ssafy.s14p11a707.scenario.entity.Clue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClueRepository extends JpaRepository<Clue, Long>{
    default List<Clue> saveClues(List<Clue> clues) {
        return saveAll(clues);
    }

    List<Clue> findByScenarioId(long scenarioId);
}


