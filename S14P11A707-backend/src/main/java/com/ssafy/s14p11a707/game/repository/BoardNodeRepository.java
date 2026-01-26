package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.BoardNode;
import com.ssafy.s14p11a707.game.entity.GameSession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardNodeRepository extends JpaRepository<BoardNode, Long> {

    List<BoardNode> findBySession(GameSession session);

    void deleteBySessionAndIdIn(GameSession session, List<Long> ids);
}
