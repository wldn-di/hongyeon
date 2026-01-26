package com.ssafy.s14p11a707.user.dto;

public record BookshelfStatsResponse(
        long userId,
        int totalAttempts,
        int totalClears,
        float clearRate,
        int sRankCount
) {
}

