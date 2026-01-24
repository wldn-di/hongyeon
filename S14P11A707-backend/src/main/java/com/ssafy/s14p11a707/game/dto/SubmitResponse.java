package com.ssafy.s14p11a707.game.dto;

public record SubmitResponse(
        long sessionId,
        boolean isSuccess,
        int attemptsUsed,
        String rankGrade,
        Evaluation evaluation
) {

    public record Evaluation(
            boolean culpritCorrect,
            boolean weaponCorrect,
            boolean locationCorrect,
            float motiveSimilarity,
            float causeOfDeathSimilarity,
            String aiComment
    ) {
    }
}

