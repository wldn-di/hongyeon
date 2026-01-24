package com.ssafy.s14p11a707.game.dto;

public record BoardNode(
        long nodeId,
        String type,
        Long targetId,
        String memoContent,
        int x,
        int y
) {
}

