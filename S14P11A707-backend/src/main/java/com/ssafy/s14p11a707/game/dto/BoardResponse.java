package com.ssafy.s14p11a707.game.dto;

import java.util.List;

public record BoardResponse(
        long sessionId,
        List<BoardNode> nodes,
        List<BoardConnection> connections,
        int redConnectionCount
) {
}

