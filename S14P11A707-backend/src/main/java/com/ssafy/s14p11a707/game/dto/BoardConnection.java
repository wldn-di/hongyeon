package com.ssafy.s14p11a707.game.dto;

public record BoardConnection(
        long connectionId,
        long fromNodeId,
        long toNodeId,
        String type
) {
}

