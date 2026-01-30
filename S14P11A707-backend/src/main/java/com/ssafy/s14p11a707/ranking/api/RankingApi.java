package com.ssafy.s14p11a707.ranking.api;

import com.ssafy.s14p11a707.ranking.dto.GlobalRankingResponse;
import com.ssafy.s14p11a707.ranking.dto.MyRankingResponse;
import com.ssafy.s14p11a707.ranking.service.RankingService;
import com.ssafy.s14p11a707.security.CurrentUserIdResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rankings")
public class RankingApi implements RankingApiDoc {

    private final RankingService rankingService;
    private final CurrentUserIdResolver currentUserIdResolver;

    // top10 랭킹, 비로그인자도 확인 가능
    @GetMapping
    @Override
    public ResponseEntity<GlobalRankingResponse> getGlobalRankings(
            @RequestParam(defaultValue = "score") String type
    ) {
        return ResponseEntity.ok(rankingService.getGlobalRanking(type));
    }
    // 내 랭킹, 로그인자만 확인 가능
    @GetMapping("/me")
    @Override
    public ResponseEntity<MyRankingResponse> getMyRanking(
            @RequestParam(defaultValue = "score") String type,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        return ResponseEntity.ok(rankingService.getMyRanking(type, userId));
    }
}
