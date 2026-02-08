package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.ChatMessage;
import com.ssafy.s14p11a707.game.entity.GameSession;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findBySessionIdAndKeyTalkTrueOrderByCreatedAtDesc(long sessionId);

    int countBySessionAndRole(GameSession session, String role);

    List<ChatMessage> findBySessionIdAndSuspectIdOrderByCreatedAtAsc(long sessionId, long suspectId);

    List<ChatMessage> findTop5BySessionIdAndSuspectIdOrderByCreatedAtDesc(long sessionId, long suspectId);

    Optional<ChatMessage> findFirstBySessionIdAndSuspectIdAndUsedClueIdIsNotNullOrderByCreatedAtDesc(long sessionId, long suspectId);

    // conversationId 형식: "session-{sessionId}-suspect-{suspectId}"
    @Query("""
        SELECT cm FROM ChatMessage cm
        WHERE cm.session.id = :sessionId
        AND cm.suspect.id = :suspectId
        ORDER BY cm.createdAt DESC
        """)
    List<ChatMessage> findBySessionIdAndSuspectIdOrderByCreatedAtDesc(
            @Param("sessionId") long sessionId,
            @Param("suspectId") long suspectId);

    @Modifying
    @Query("""
        DELETE FROM ChatMessage cm
        WHERE cm.session.id = :sessionId
        AND cm.suspect.id = :suspectId
        """)
    void deleteBySessionIdAndSuspectId(@Param("sessionId") long sessionId, @Param("suspectId") long suspectId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM ChatMessage cm WHERE cm.session.id = :sessionId")
    int deleteBySessionId(@Param("sessionId") Long sessionId);

    @Query("SELECT cm FROM ChatMessage cm " +
            "LEFT JOIN FETCH cm.suspect " +
            "WHERE cm.session.id = :sessionId " +
            "ORDER BY cm.createdAt ASC")
    List<ChatMessage> findBySessionIdWithSuspect(@Param("sessionId") Long sessionId);
}
