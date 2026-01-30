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

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/scenarios")
public class ScenarioApi implements ScenarioApiDoc {

    private final ScenarioService scenarioService;
    private final ScenarioAccessPolicy scenarioAccessPolicy;
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
