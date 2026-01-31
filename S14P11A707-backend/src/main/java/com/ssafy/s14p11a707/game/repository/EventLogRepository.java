package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.EventLog;
import com.ssafy.s14p11a707.game.entity.GameSession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventLogRepository extends JpaRepository<EventLog, Long> {

    List<EventLog> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM EventLog el WHERE el.session.id = :sessionId")
    int deleteBySessionId(@Param("sessionId") Long sessionId);
}
