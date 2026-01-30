package com.ssafy.s14p11a707.scenario.repository;

import com.ssafy.s14p11a707.scenario.entity.Clue;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClueRepository extends JpaRepository<Clue, Long> {

    default List<Clue> saveClues(List<Clue> clues) {
        return saveAll(clues);
    }

    List<Clue> findByScenarioId(long scenarioId);

   List<Clue> findByScenarioIdOrderByRoomFloorNumberAsc(long scenarioId);

    @Query("SELECT c FROM Clue c " +
            "LEFT JOIN FETCH c.room " +
            "WHERE c.scenario.id = :scenarioId " +
            "ORDER BY c.room.floorNumber ASC, c.id ASC")
    List<Clue> findByScenarioIdWithRoom(@Param("scenarioId") long scenarioId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Clue c WHERE c.scenario.id = :scenarioId")
    void deleteByScenarioId(@Param("scenarioId") long scenarioId);
}
