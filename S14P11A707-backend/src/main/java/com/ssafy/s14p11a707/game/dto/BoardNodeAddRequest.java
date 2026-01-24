package com.ssafy.s14p11a707.game.dto;

public record BoardNodeAddRequest(
        String type,
        Long targetId,
        String memoContent,
        int x,
        int y
) {
}

