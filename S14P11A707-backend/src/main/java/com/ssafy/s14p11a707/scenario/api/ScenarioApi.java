package com.ssafy.s14p11a707.scenario.api;

import com.ssafy.s14p11a707.scenario.dto.*;
import com.ssafy.s14p11a707.scenario.service.ScenarioService;
import com.ssafy.s14p11a707.security.CurrentUserIdResolver;
import com.ssafy.s14p11a707.security.authorization.ScenarioAccessPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/scenarios")
public class ScenarioApi implements ScenarioApiDoc {

    private final ScenarioService scenarioService;
    private final ScenarioAccessPolicy scenarioAccessPolicy;
    private final CurrentUserIdResolver currentUserIdResolver;


    @GetMapping
    @Override
    public ResponseEntity<ScenarioListResponse> listScenarios(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<String> genres,
            @RequestParam(required = false) List<String> difficulties,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        List<ScenarioDifficultyTier> difficultyTiers = difficulties == null
                ? null
                : difficulties.stream()
                        .map(ScenarioDifficultyTier::from)
                        .filter(Objects::nonNull)
                        .toList();

        ScenarioListRequest request = new ScenarioListRequest(
                keyword,
                genres,
                difficultyTiers,
                ScenarioSortBy.from(sortBy),
                page,
                size
        );

        return ResponseEntity.ok(scenarioService.listScenarios(request));
    }

    @GetMapping("/top/play-count")
    @Override
    public ResponseEntity<ScenarioListResponse> topScenariosByPlayCount() {
        return ResponseEntity.ok(scenarioService.topScenariosByPlayCount());
    }

    @GetMapping("/top/rating")
    @Override
    public ResponseEntity<ScenarioListResponse> topScenariosByRating() {
        return ResponseEntity.ok(scenarioService.topScenariosByRating());
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
        scenarioAccessPolicy.assertScenarioOwner(userId, scenarioId);
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
}
