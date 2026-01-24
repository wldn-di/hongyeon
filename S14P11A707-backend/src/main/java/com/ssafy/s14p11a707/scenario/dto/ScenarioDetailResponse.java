package com.ssafy.s14p11a707.scenario.dto;

import java.math.BigDecimal;
import java.util.List;

public record ScenarioDetailResponse(
        long id,
        String title,
        String synopsis,
        String genre,
        String thumbnailUrl,
        int playCount,
        BigDecimal avgRating,
        BigDecimal avgDifficulty,
        Victim victim,
        List<Suspect> suspects,
        List<TopRanking> topRankings
) {

    public record Victim(
            long victimId,
            String name,
            int age,
            String gender,
            String occupation,
            String discoveryLocation,
            String estimatedDeathTime,
            String causeOfDeath,
            String portraitUrl
    ) {
    }

    public record Suspect(
            long suspectId,
            String name,
            int age,
            String gender,
            String occupation,
            String oneLiner,
            String portraitUrl,
            int displayOrder
    ) {
    }

    public record TopRanking(
            int rank,
            long userId,
            String nickname,
            int score,
            long clearTime,
            String rankGrade
    ) {
    }
}

