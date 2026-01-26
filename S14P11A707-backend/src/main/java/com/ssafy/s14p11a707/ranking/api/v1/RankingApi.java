package com.ssafy.s14p11a707.ranking.api.v1;

import com.ssafy.s14p11a707.ranking.dto.GlobalRankingResponse;
import com.ssafy.s14p11a707.ranking.service.v1.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/rankings")
public class RankingApi implements RankingApiDoc {

    private final RankingService rankingService;

    @GetMapping
    @Override
    public ResponseEntity<GlobalRankingResponse> getGlobalRankings() {
        return ResponseEntity.ok(rankingService.getGlobalRanking());
    }
}
