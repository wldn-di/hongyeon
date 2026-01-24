package com.ssafy.s14p11a707.game.dto;

import java.time.Instant;
import java.util.List;

public record InvestigationReportResponse(
        long sessionId,
        long scenarioId,
        long userId,
        String rankGrade,
        int finalScore,
        String summary,
        String aiComment,
        Stats stats,
        List<KeyTalk> keyTalks
) {

    public record Stats(
            int totalInterrogations,
            int cluesCollected
    ) {
    }

    public record KeyTalk(
            long suspectId,
            String content,
            Instant createdAt
    ) {
    }
}

