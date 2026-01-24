package com.ssafy.s14p11a707.game.dto;

public record BoardItemMoveRequest(
        long nodeId,
        int x,
        int y
) {
}

