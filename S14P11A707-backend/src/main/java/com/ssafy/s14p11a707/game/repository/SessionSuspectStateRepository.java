package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.SessionSuspectState;
import com.ssafy.s14p11a707.game.entity.SessionSuspectStateId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionSuspectStateRepository extends JpaRepository<SessionSuspectState, SessionSuspectStateId> {

    void deleteBySessionId(Long sessionId);
}

