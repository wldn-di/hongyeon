package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.BoardConnection;
import com.ssafy.s14p11a707.game.entity.BoardConnection.ConnectionType;
import com.ssafy.s14p11a707.game.entity.BoardNode;
import com.ssafy.s14p11a707.game.entity.GameSession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardConnectionRepository extends JpaRepository<BoardConnection, Long> {

    List<BoardConnection> findBySession(GameSession session);

    boolean existsBySessionAndFromNodeAndToNode(GameSession session, BoardNode fromNode, BoardNode toNode);

    int countBySessionAndConnectionType(GameSession session, ConnectionType connectionType);

    void deleteBySessionAndIdIn(GameSession session, List<Long> ids);
}
