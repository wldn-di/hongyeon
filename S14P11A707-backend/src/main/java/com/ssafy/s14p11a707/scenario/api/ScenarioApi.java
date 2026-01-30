package com.ssafy.s14p11a707.scenario.api;

import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
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
import com.ssafy.s14p11a707.scenario.repository.ScenarioRepository;
import com.ssafy.s14p11a707.scenario.service.ScenarioService;
import com.ssafy.s14p11a707.security.CurrentUserIdResolver;
import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
@RequestMapping("/api/scenarios")
public class ScenarioApi implements ScenarioApiDoc {

    private final ScenarioService scenarioService;
    private final ReviewService reviewService;
    private final GameSessionService gameSessionService;
    private final ScenarioRepository scenarioRepository;
    private final CurrentUserIdResolver currentUserIdResolver;


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
    public ResponseEntity<ScenarioCreateResponse> createScenario(
            @RequestBody ScenarioCreateRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        return ResponseEntity.ok(scenarioService.createScenario(request, userId));
    }

    @DeleteMapping("/{scenarioId}")
    @Override
    public ResponseEntity<ScenarioDeleteResponse> deleteScenario(
            @PathVariable long scenarioId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        ensureScenarioOwnership(scenarioId, userId);
        return ResponseEntity.ok(scenarioService.deleteScenario(scenarioId));
    }

    @GetMapping("/{scenarioId}/rankings")
    @Override
    public ResponseEntity<ScenarioRankingResponse> getScenarioRankings(
            @PathVariable long scenarioId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        Long userId = oidcUser == null ? null : currentUserIdResolver.requireUserId(oidcUser);
        return ResponseEntity.ok(scenarioService.getScenarioRankings(scenarioId, userId));
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

    private void ensureScenarioOwnership(long scenarioId, long userId) {
        var scenario = scenarioRepository.findByIdWithCreator(scenarioId)
                .orElseThrow(() -> new BaseException(ErrorCode.SCENARIO_NOT_FOUND));
        if (scenario.getCreator().getId() != userId) {
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }
    }
}
