package com.ssafy.s14p11a707.game.dto;

import java.time.Instant;

public record SubmitResponse(
        long sessionId,
        String status,
        int attemptsUsed,
        Instant completedAt,
        int finalScore,
        String rankGrade,
        Evaluation evaluation
) {

    public record Evaluation(
            boolean culpritCorrect,
            boolean weaponCorrect,
            boolean locationCorrect,
            float motiveSimilarity,
            String aiComment
    ) {
    }
}

