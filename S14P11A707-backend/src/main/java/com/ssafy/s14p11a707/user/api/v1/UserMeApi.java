package com.ssafy.s14p11a707.user.api.v1;

import com.ssafy.s14p11a707.ranking.dto.GlobalRankingResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioListResponse;
import com.ssafy.s14p11a707.user.dto.ActiveSessionListResponse;
import com.ssafy.s14p11a707.user.dto.BookshelfStatsResponse;
import com.ssafy.s14p11a707.user.service.v1.UserV1Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users/me")
public class UserMeApi implements UserMeApiDoc {

    private final UserV1Service userService;

    @GetMapping("/bookshelf/stats")
    @Override
    public ResponseEntity<BookshelfStatsResponse> getMyBookshelfStats() {
        return ResponseEntity.ok(userService.getMyBookshelfStats());
    }

    @GetMapping("/rankings")
    @Override
    public ResponseEntity<GlobalRankingResponse> getMyRankings() {
        return ResponseEntity.ok(userService.getMyRankings());
    }

    @GetMapping("/scenarios")
    @Override
    public ResponseEntity<ScenarioListResponse> getMyScenarios() {
        return ResponseEntity.ok(userService.getMyScenarios());
    }

    @GetMapping("/bookshelf/failed")
    @Override
    public ResponseEntity<ScenarioListResponse> getMyBookshelfFailed() {
        return ResponseEntity.ok(userService.getMyBookshelfFailed());
    }

    @GetMapping("/bookshelf/completed")
    @Override
    public ResponseEntity<ScenarioListResponse> getMyBookshelfCompleted() {
        return ResponseEntity.ok(userService.getMyBookshelfCompleted());
    }

    @GetMapping("/sessions/active")
    @Override
    public ResponseEntity<ActiveSessionListResponse> getMyActiveSessions() {
        return ResponseEntity.ok(userService.getMyActiveSessions());
    }
}
