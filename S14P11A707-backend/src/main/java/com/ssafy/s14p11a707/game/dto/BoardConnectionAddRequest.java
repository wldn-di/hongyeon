package com.ssafy.s14p11a707.game.dto;

public record BoardConnectionAddRequest(
        long fromNodeId,
        long toNodeId,
        String type
) {
}

