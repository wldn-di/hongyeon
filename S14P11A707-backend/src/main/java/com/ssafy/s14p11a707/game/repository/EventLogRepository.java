package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.EventLog;
import com.ssafy.s14p11a707.game.entity.GameSession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventLogRepository extends JpaRepository<EventLog, Long> {

    List<EventLog> findBySessionOrderByCreatedAtAsc(GameSession session);
}
