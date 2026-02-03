package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.SessionSuspectState;
import com.ssafy.s14p11a707.game.entity.SessionSuspectStateId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SessionSuspectStateRepository extends JpaRepository<SessionSuspectState, SessionSuspectStateId> {

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM SessionSuspectState sss WHERE sss.session.id = :sessionId")
    int deleteBySessionId(@Param("sessionId") Long sessionId);
}

