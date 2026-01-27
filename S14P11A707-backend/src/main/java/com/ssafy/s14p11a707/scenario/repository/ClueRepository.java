package com.ssafy.s14p11a707.scenario.repository;

import com.ssafy.s14p11a707.scenario.entity.Clue;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClueRepository extends JpaRepository<Clue, Long> {

    default List<Clue> saveClues(List<Clue> clues) {
        return saveAll(clues);
    }

    List<Clue> findByScenarioId(long scenarioId);

   List<Clue> findByScenarioIdOrderByRoomFloorNumberAsc(long scenarioId);
}
