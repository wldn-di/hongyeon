package com.ssafy.s14p11a707.user.dto;

public record BookshelfStatsResponse(
        long userId,
        int totalPlays,
        int successPlays,
        float clearRate,
        int sRankCount,
        int totalScore,
        long avgPlayTime
) {
}

