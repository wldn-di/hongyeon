package com.ssafy.s14p11a707.scenario.dto;

import java.util.List;

public record ScenarioRankingResponse(
        long scenarioId,
        boolean hasUserCleared,
        List<Ranking> rankings
) {

    public record Ranking(
            int rank,
            long userId,
            String nickname,
            int score,
            long clearTime,
            String rankGrade
    ) {
    }
}

