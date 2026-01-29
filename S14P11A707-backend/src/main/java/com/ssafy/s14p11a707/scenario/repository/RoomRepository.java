package com.ssafy.s14p11a707.scenario.repository;

import com.ssafy.s14p11a707.scenario.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    Optional<Room> findByScenarioIdAndFloorNumber(long scenarioId, int floorNumber);

    default List<Room> saveRooms(List<Room> rooms) {
        return saveAll(rooms);
    }

    List<Room> findByScenarioIdOrderByFloorNumberAsc(long scenarioId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Room r WHERE r.scenario.id = :scenarioId")
    void deleteByScenarioId(@Param("scenarioId") long scenarioId);
}
