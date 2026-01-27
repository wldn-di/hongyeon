package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.DiscoveredClue;
import com.ssafy.s14p11a707.game.entity.GameSession;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscoveredClueRepository extends JpaRepository<DiscoveredClue, Long> {

    List<DiscoveredClue> findBySessionOrderByDiscoveredAtAsc(GameSession session);

    Optional<DiscoveredClue> findBySessionIdAndClueId(long sessionId, long clueId);

    boolean existsBySessionIdAndClueId(long sessionId, long clueId);

    int countBySession(GameSession session);
}
