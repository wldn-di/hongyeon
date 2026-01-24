package com.ssafy.s14p11a707.ranking.dto;

import java.util.List;

public record GlobalRankingResponse(
        String type,
        List<RankEntry> top10,
        RankEntry myRank
) {

    public record RankEntry(
            int rank,
            long userId,
            String nickname,
            long value
    ) {
    }
}

