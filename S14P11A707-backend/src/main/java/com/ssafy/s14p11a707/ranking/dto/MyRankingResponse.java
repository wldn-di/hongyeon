package com.ssafy.s14p11a707.ranking.dto;

public record MyRankingResponse(
        String type,
        int rank,
        long userId,
        String nickname,
        long value
) {
}
