package com.ssafy.s14p11a707.scenario.api.v2;

import com.ssafy.s14p11a707.game.dto.GameStartResponse;
import com.ssafy.s14p11a707.game.service.GameSessionService;
import com.ssafy.s14p11a707.review.dto.ReviewCreateRequest;
import com.ssafy.s14p11a707.review.dto.ReviewListResponse;
import com.ssafy.s14p11a707.review.dto.ReviewResponse;
import com.ssafy.s14p11a707.review.service.ReviewService;
import com.ssafy.s14p11a707.scenario.dto.RoomListResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioCreateRequest;
import com.ssafy.s14p11a707.scenario.dto.ScenarioCreateResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioDeleteResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioDetailResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioListResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioRankingResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioStatusResponse;
import com.ssafy.s14p11a707.scenario.dto.SuspectListResponse;
import com.ssafy.s14p11a707.scenario.dto.VictimResponse;
import com.ssafy.s14p11a707.scenario.service.v2.ScenarioService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/scenarios")
public class ScenarioApi implements ScenarioApiDoc {

    private final ScenarioService scenarioService;
    private final ReviewService reviewService;
    private final GameSessionService gameSessionService;

    public ScenarioApi(
            @Qualifier("scenarioServiceImpl") ScenarioService scenarioService,
            ReviewService reviewService,
            @Qualifier("gameSessionServiceImpl") GameSessionService gameSessionService
    ) {
        this.scenarioService = scenarioService;
        this.reviewService = reviewService;
        this.gameSessionService = gameSessionService;
    }

    @GetMapping
    @Override
    public ResponseEntity<ScenarioListResponse> listScenarios() {
        return ResponseEntity.ok(scenarioService.listScenarios());
    }

    @GetMapping("/search")
    @Override
    public ResponseEntity<ScenarioListResponse> searchScenarios(@RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(scenarioService.searchScenarios(keyword));
    }

    @GetMapping("/{scenarioId}")
    @Override
    public ResponseEntity<ScenarioDetailResponse> getScenario(@PathVariable long scenarioId) {
        return ResponseEntity.ok(scenarioService.getScenario(scenarioId));
    }

    @GetMapping("/{scenarioId}/status")
    @Override
    public ResponseEntity<ScenarioStatusResponse> getScenarioStatus(@PathVariable long scenarioId) {
        return ResponseEntity.ok(scenarioService.getScenarioStatus(scenarioId));
    }

    @PostMapping
    @Override
    public ResponseEntity<ScenarioCreateResponse> createScenario(@RequestBody ScenarioCreateRequest request) {
        return ResponseEntity.ok(scenarioService.createScenario(request));
    }

    @DeleteMapping("/{scenarioId}")
    @Override
    public ResponseEntity<ScenarioDeleteResponse> deleteScenario(@PathVariable long scenarioId) {
        return ResponseEntity.ok(scenarioService.deleteScenario(scenarioId));
    }

    @GetMapping("/{scenarioId}/rankings")
    @Override
    public ResponseEntity<ScenarioRankingResponse> getScenarioRankings(
            @PathVariable long scenarioId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(scenarioService.getScenarioRankings(scenarioId, oidcUser));
    }

    @GetMapping("/{scenarioId}/rooms")
    @Override
    public ResponseEntity<RoomListResponse> getRooms(@PathVariable long scenarioId) {
        return ResponseEntity.ok(scenarioService.getRooms(scenarioId));
    }

    @GetMapping("/{scenarioId}/victim")
    @Override
    public ResponseEntity<VictimResponse> getVictim(@PathVariable long scenarioId) {
        return ResponseEntity.ok(scenarioService.getVictim(scenarioId));
    }

    @GetMapping("/{scenarioId}/suspects")
    @Override
    public ResponseEntity<SuspectListResponse> getSuspects(@PathVariable long scenarioId) {
        return ResponseEntity.ok(scenarioService.getSuspects(scenarioId));
    }

    @GetMapping("/{scenarioId}/reviews")
    @Override
    public ResponseEntity<ReviewListResponse> getReviews(@PathVariable long scenarioId) {
        return ResponseEntity.ok(reviewService.getReviews(scenarioId));
    }

    @PostMapping("/{scenarioId}/reviews")
    @Override
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable long scenarioId,
            @RequestBody ReviewCreateRequest request
    ) {
        return ResponseEntity.ok(reviewService.createReview(scenarioId, request));
    }

    @PostMapping("/{scenarioId}/sessions")
    @Override
    public ResponseEntity<GameStartResponse> startGame(@PathVariable long scenarioId) {
        return ResponseEntity.ok(gameSessionService.startGame(scenarioId));
    }
}
