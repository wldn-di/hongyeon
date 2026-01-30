package com.ssafy.s14p11a707.ranking.service;

import com.ssafy.s14p11a707.ranking.dto.GlobalRankingResponse;
import com.ssafy.s14p11a707.ranking.dto.MyRankingResponse;

public interface RankingService {

    GlobalRankingResponse getGlobalRanking(String type);

    MyRankingResponse getMyRanking(String type, long userId);
}
