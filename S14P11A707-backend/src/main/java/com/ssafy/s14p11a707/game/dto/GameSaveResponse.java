package com.ssafy.s14p11a707.game.dto;

import com.ssafy.s14p11a707.game.entity.GameSession;
import java.time.Instant;

public record GameSaveResponse(
        long sessionId,
        String status,
        Instant lastSavedAt,
        Instant expiresAt
) {

    public static GameSaveResponse from(GameSession session) {
        return new GameSaveResponse(
                session.getId(),
                session.getStatus().name(),
                session.getLastSavedAt(),
                session.getExpiresAt()
        );
    }
}
