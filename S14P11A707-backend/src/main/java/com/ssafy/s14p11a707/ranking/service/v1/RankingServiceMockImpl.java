package com.ssafy.s14p11a707.ranking.service.v1;

import com.ssafy.s14p11a707.mock.MockFixtures;
import com.ssafy.s14p11a707.ranking.dto.GlobalRankingResponse;
import org.springframework.stereotype.Service;

@Service
public class RankingServiceMockImpl implements RankingService {

    @Override
    public GlobalRankingResponse getGlobalRanking() {
        return MockFixtures.globalRankingResponse();
    }
}
