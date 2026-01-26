package com.ssafy.s14p11a707.game.dto;

import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.game.entity.GameSession.Status;
import java.time.Instant;

public record GameEndResponse(
        long sessionId,
        String status,
        boolean isSuccess,
        Instant completedAt,
        int finalScore,
        String rankGrade
) {

    public static GameEndResponse from(GameSession session) {
        return new GameEndResponse(
                session.getId(),
                session.getStatus().name(),
                session.getStatus() == Status.COMPLETED,
                session.getCompletedAt(),
                session.getFinalScore() != null ? session.getFinalScore() : 0,
                session.getRankGrade() != null ? session.getRankGrade().name() : "F"
        );
    }
}
