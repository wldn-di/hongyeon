package com.ssafy.s14p11a707.game.dto;

import com.ssafy.s14p11a707.game.entity.BoardConnection;
import com.ssafy.s14p11a707.game.entity.BoardNode;
import java.util.List;

public record BoardResponse(
        long sessionId,
        List<BoardNodeDto> nodes,
        List<BoardConnectionDto> connections,
        int redConnectionCount
) {

    public static BoardResponse from(
            long sessionId,
            List<BoardNode> nodeEntities,
            List<BoardConnection> connectionEntities,
            int redConnectionCount
    ) {
        return new BoardResponse(
                sessionId,
                nodeEntities.stream().map(BoardNodeDto::from).toList(),
                connectionEntities.stream().map(BoardConnectionDto::from).toList(),
                redConnectionCount
        );
    }
}
