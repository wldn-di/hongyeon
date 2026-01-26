package com.ssafy.s14p11a707.ranking.service.v2;

import com.ssafy.s14p11a707.ranking.dto.GlobalRankingResponse;
import com.ssafy.s14p11a707.ranking.dto.MyRankingResponse;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

public interface RankingServiceV2 {

    GlobalRankingResponse getGlobalRanking(String type);

    MyRankingResponse getMyRanking(String type, OidcUser oidcUser);
}
