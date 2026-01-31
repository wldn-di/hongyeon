package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.BoardConnection;
import com.ssafy.s14p11a707.game.entity.BoardConnection.ConnectionType;
import com.ssafy.s14p11a707.game.entity.GameSession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BoardConnectionRepository extends JpaRepository<BoardConnection, Long> {

    @Query("SELECT bc FROM BoardConnection bc " +
            "JOIN FETCH bc.fromNode " +
            "JOIN FETCH bc.toNode " +
            "WHERE bc.session.id = :sessionId")
    List<BoardConnection> findBySessionIdWithNodes(@Param("sessionId") long sessionId);

    boolean existsBySessionIdAndFromNodeIdAndToNodeId(long sessionId, long fromNodeId, long toNodeId);

    void deleteBySessionIdAndIdIn(long sessionId, List<Long> ids);

    int countBySessionAndConnectionType(GameSession session, ConnectionType connectionType);

    List<BoardConnection> findBySessionAndConnectionType(GameSession session, ConnectionType connectionType);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM BoardConnection bc WHERE bc.session.id = :sessionId")
    int deleteBySessionId(@Param("sessionId") Long sessionId);
}
