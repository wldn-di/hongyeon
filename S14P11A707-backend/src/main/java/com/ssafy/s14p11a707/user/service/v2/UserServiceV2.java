package com.ssafy.s14p11a707.user.service.v2;

import com.ssafy.s14p11a707.scenario.dto.ScenarioListResponse;
import com.ssafy.s14p11a707.user.dto.BookshelfSessionResponse;
import com.ssafy.s14p11a707.user.dto.BookshelfStatsResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

public interface UserServiceV2 {

    BookshelfStatsResponse getMyBookshelfStats(OidcUser oidcUser);

    BookshelfSessionResponse getMyBookshelfSessions(OidcUser oidcUser, Pageable pageable);

    ScenarioListResponse getMyScenarios(OidcUser oidcUser, Pageable pageable);
}
