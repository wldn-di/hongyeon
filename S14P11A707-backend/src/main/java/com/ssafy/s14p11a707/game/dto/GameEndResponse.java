package com.ssafy.s14p11a707.game.dto;

import java.time.Instant;

public record GameEndResponse(
        long sessionId,
        String status,
        boolean isSuccess,
        Instant completedAt,
        int finalScore,
        String rankGrade
) {
}

