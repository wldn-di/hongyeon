package com.ssafy.s14p11a707.game.dto;

import java.util.List;

public record BoardDeleteRequest(
        List<Long> nodeIds,
        List<Long> connectionIds
) {
}

