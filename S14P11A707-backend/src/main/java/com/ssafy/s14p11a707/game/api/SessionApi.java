package com.ssafy.s14p11a707.game.api;

import com.ssafy.s14p11a707.game.dto.*;
import com.ssafy.s14p11a707.game.service.GameSessionService;
import com.ssafy.s14p11a707.game.v2.service.SuspectChatV2Service;
import com.ssafy.s14p11a707.security.authorization.GameSessionAccessPolicy;
import com.ssafy.s14p11a707.security.CurrentUserIdResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sessions")
public class SessionApi implements SessionApiDoc {

    private final GameSessionService gameSessionService;
    private final SuspectChatV2Service suspectChatV2Service;
    private final GameSessionAccessPolicy gameSessionAccessPolicy;
    private final CurrentUserIdResolver currentUserIdResolver;

    @PostMapping("/{scenarioId}")
    @Override
    public ResponseEntity<GameStartResponse> startGame(
            @PathVariable long scenarioId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        return ResponseEntity.ok(gameSessionService.startGame(scenarioId, userId));
    }

    @PostMapping("/{scenarioId}/restart")
    @Override
    public ResponseEntity<GameStartResponse> restartGame(
            @PathVariable long scenarioId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        return ResponseEntity.ok(gameSessionService.restartGame(scenarioId, userId));
    }

    @GetMapping("/{sessionId}/report")
    @Override
    public ResponseEntity<InvestigationReportResponse> getInvestigationReport(
            @PathVariable long sessionId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        gameSessionAccessPolicy.assertSessionOwner(userId, sessionId);
        return ResponseEntity.ok(gameSessionService.getInvestigationReport(sessionId));
    }

    @GetMapping("/{sessionId}/report/public")
    @Override
    public ResponseEntity<InvestigationReportResponse> getOtherInvestigationReport(
            @PathVariable long sessionId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        gameSessionAccessPolicy.assertCanReadOtherReport(userId, sessionId);
        return ResponseEntity.ok(gameSessionService.getOtherInvestigationReport(sessionId));
    }

    @PostMapping("/{sessionId}/clues/{clueId}")
    @Override
    public ResponseEntity<DiscoveredClueResponse> discoverClue(
            @PathVariable long sessionId,
            @PathVariable long clueId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        gameSessionAccessPolicy.assertSessionOwner(userId, sessionId);
        return ResponseEntity.ok(gameSessionService.discoverClue(sessionId, clueId));
    }

    @GetMapping("/{sessionId}/clues")
    @Override
    public ResponseEntity<ClueListResponse> getClues(
            @PathVariable long sessionId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        gameSessionAccessPolicy.assertSessionOwner(userId, sessionId);
        return ResponseEntity.ok(gameSessionService.getDiscoveredClues(sessionId));
    }

    @GetMapping("/{sessionId}/clues/{clueId}")
    @Override
    public ResponseEntity<ClueDetailResponse> getClue(
            @PathVariable long sessionId,
            @PathVariable long clueId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        gameSessionAccessPolicy.assertSessionOwner(userId, sessionId);
        return ResponseEntity.ok(gameSessionService.getDiscoveredClue(sessionId, clueId));
    }

    @GetMapping("/{sessionId}/logs")
    @Override
    public ResponseEntity<EventLogListResponse> getLogs(
            @PathVariable long sessionId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        gameSessionAccessPolicy.assertSessionOwner(userId, sessionId);
        return ResponseEntity.ok(gameSessionService.getLogs(sessionId));
    }

    @GetMapping("/{sessionId}/resume")
    @Override
    public ResponseEntity<GameResumeResponse> resumeGame(
            @PathVariable long sessionId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        gameSessionAccessPolicy.assertSessionOwner(userId, sessionId);
        return ResponseEntity.ok(gameSessionService.resumeGame(sessionId));
    }

    @PostMapping("/{sessionId}/move-floor")
    @Override
    public ResponseEntity<FloorMoveResponse> moveFloor(
            @PathVariable long sessionId,
            @RequestBody FloorMoveRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        gameSessionAccessPolicy.assertSessionOwner(userId, sessionId);
        return ResponseEntity.ok(gameSessionService.moveFloor(sessionId, request));
    }

    @GetMapping("/{sessionId}/board")
    @Override
    public ResponseEntity<BoardResponse> getBoard(
            @PathVariable long sessionId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        gameSessionAccessPolicy.assertSessionOwner(userId, sessionId);
        return ResponseEntity.ok(gameSessionService.getBoard(sessionId));
    }

    @PutMapping("/{sessionId}/board")
    @Override
    public ResponseEntity<BoardResponse> saveBoard(
            @PathVariable long sessionId,
            @RequestBody BoardSaveRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        gameSessionAccessPolicy.assertSessionOwner(userId, sessionId);
        return ResponseEntity.ok(gameSessionService.saveBoard(sessionId, request));
    }

    @PostMapping("/{sessionId}/submit")
    @Override
    public ResponseEntity<SubmitResponse> submit(
            @PathVariable long sessionId,
            @RequestBody SubmitRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        gameSessionAccessPolicy.assertSessionOwner(userId, sessionId);
        return ResponseEntity.ok(gameSessionService.submit(sessionId, request));
    }

    @PostMapping("/{sessionId}/suspects/{suspectId}/chat")
    @Override
    public ResponseEntity<SuspectChatResponse> chatWithSuspect(
            @PathVariable long sessionId,
            @PathVariable long suspectId,
            @RequestBody SuspectChatRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        gameSessionAccessPolicy.assertSessionOwner(userId, sessionId);
        return ResponseEntity.ok(suspectChatV2Service.chatWithSuspect(sessionId, suspectId, request));
    }

    @GetMapping("/{sessionId}/suspects/{suspectId}/chats")
    @Override
    public ResponseEntity<ChatHistoryResponse> getChatHistory(
            @PathVariable long sessionId,
            @PathVariable long suspectId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        gameSessionAccessPolicy.assertSessionOwner(userId, sessionId);
        return ResponseEntity.ok(gameSessionService.getChatHistory(sessionId, suspectId));
    }
}
