package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.DiscoveredClue;
import com.ssafy.s14p11a707.game.entity.GameSession;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DiscoveredClueRepository extends JpaRepository<DiscoveredClue, Long> {

    List<DiscoveredClue> findBySessionIdOrderByDiscoveredAtAsc(long sessionId);

    Optional<DiscoveredClue> findBySessionIdAndClueId(long sessionId, long clueId);

    int countBySession(GameSession session);

    // 목록 조회
    @Query("SELECT dc FROM DiscoveredClue dc " +
            "JOIN FETCH dc.clue c " +
            "LEFT JOIN FETCH c.room " +
            "WHERE dc.session.id = :sessionId " +
            "ORDER BY dc.discoveredAt ASC")
    List<DiscoveredClue> findBySessionIdWithClue(@Param("sessionId") Long sessionId);

    // 단건 조회
    @Query("SELECT dc FROM DiscoveredClue dc JOIN FETCH dc.clue c LEFT JOIN FETCH c.room WHERE dc.session.id = :sessionId AND dc.clue.id = :clueId")
    Optional<DiscoveredClue> findBySessionIdAndClueIdWithClue(@Param("sessionId") long sessionId, @Param("clueId") long clueId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM DiscoveredClue dc WHERE dc.session.id = :sessionId")
    int deleteBySessionId(@Param("sessionId") Long sessionId);
}
