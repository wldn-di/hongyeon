package com.ssafy.s14p11a707.game.dto;

import java.time.Instant;

public record GameSaveResponse(
        long sessionId,
        String status,
        Instant lastSavedAt,
        Instant expiresAt
) {
}

