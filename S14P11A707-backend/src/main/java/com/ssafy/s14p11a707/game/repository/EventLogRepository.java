package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.EventLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventLogRepository extends JpaRepository<EventLog, Long> {
}

