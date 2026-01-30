package com.ssafy.s14p11a707.user.service;

import com.ssafy.s14p11a707.scenario.dto.ScenarioListResponse;
import com.ssafy.s14p11a707.user.dto.BookshelfSessionResponse;
import com.ssafy.s14p11a707.user.dto.BookshelfStatsResponse;
import org.springframework.data.domain.Pageable;

public interface UserMeService {

    BookshelfStatsResponse getMyBookshelfStats(long userId);

    BookshelfSessionResponse getMyBookshelfSessions(long userId, Pageable pageable);

    ScenarioListResponse getMyScenarios(long userId, Pageable pageable);
}

