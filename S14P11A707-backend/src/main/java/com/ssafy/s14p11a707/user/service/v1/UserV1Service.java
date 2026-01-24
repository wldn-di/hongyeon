package com.ssafy.s14p11a707.user.service.v1;

import com.ssafy.s14p11a707.ranking.dto.GlobalRankingResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioListResponse;
import com.ssafy.s14p11a707.user.dto.ActiveSessionListResponse;
import com.ssafy.s14p11a707.user.dto.BookshelfStatsResponse;

public interface UserV1Service {

    BookshelfStatsResponse getMyBookshelfStats();

    GlobalRankingResponse getMyRankings();

    ScenarioListResponse getMyScenarios();

    ScenarioListResponse getMyBookshelfFailed();

    ScenarioListResponse getMyBookshelfCompleted();

    ActiveSessionListResponse getMyActiveSessions();
}

