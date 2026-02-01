package com.ssafy.s14p11a707.game.dto;

import java.time.Instant;

public record SubmitResponse(
        long sessionId,
        String status,              // COMPLETED, WRONG_ANSWER, FAILED, BOARD_INVALID
        int attemptsUsed,
        int remainingAttempts,
        String errorCode,           // INVALID_RED_COUNT, INCOMPLETE_BOARD, WRONG_CULPRIT, MAX_ATTEMPTS_EXCEEDED
        String errorMessage,
        Instant completedAt,
        Integer finalScore,
        String rankGrade,
        Boolean hasCleared,
        Evaluation evaluation,
        String epilogue,            // 에필로그 (성공 시)
        String culpritMonologue,    // 범인 자백 (성공 시)
        String unsolvedMonologue    // 미해결 독백 (실패 시)
) {

    public record Evaluation(
            boolean culpritCorrect,
            boolean weaponCorrect,
            boolean locationCorrect,
            int motiveSimilarity,   // 0-100 범위
            String aiComment
    ) {
    }

    // 보드 검증 실패 (횟수 감소 X)
    public static SubmitResponse boardInvalid(long sessionId, String errorCode, String errorMessage, int attempts) {
        return new SubmitResponse(
                sessionId, "BOARD_INVALID", attempts, 3 - attempts,
                errorCode, errorMessage, null, null, null, null, null,
                null, null, null
        );
    }

    // 범인 틀림 (횟수 감소 O)
    public static SubmitResponse wrongAnswer(long sessionId, int attempts, String message) {
        return new SubmitResponse(
                sessionId, "WRONG_ANSWER", attempts, 3 - attempts,
                "WRONG_CULPRIT", message, null, null, null, null, null,
                null, null, null
        );
    }

    // 게임 실패 (3회 초과)
    public static SubmitResponse failed(long sessionId, Instant completedAt, String message, String unsolvedMonologue) {
        return new SubmitResponse(
                sessionId, "FAILED", 3, 0,
                "MAX_ATTEMPTS_EXCEEDED", message, completedAt, 0, "F", false, null,
                null, null, unsolvedMonologue
        );
    }

    // 성공
    public static SubmitResponse success(long sessionId, int attempts, Instant completedAt,
                                         int finalScore, String rankGrade, boolean hasCleared, Evaluation evaluation,
                                         String epilogue, String culpritMonologue) {
        return new SubmitResponse(
                sessionId, "COMPLETED", attempts, 3 - attempts,
                null, null, completedAt, finalScore, rankGrade, hasCleared, evaluation,
                epilogue, culpritMonologue, null
        );
    }
}

