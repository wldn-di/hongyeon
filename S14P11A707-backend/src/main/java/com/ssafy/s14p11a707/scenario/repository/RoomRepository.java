package com.ssafy.s14p11a707.scenario.repository;

import com.ssafy.s14p11a707.scenario.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {
    default List<Room> saveRooms(List<Room> rooms) {
        return saveAll(rooms);
    }

    List<Room> findByScenarioIdOrderByFloorNumberAsc(long scenarioId);
}
