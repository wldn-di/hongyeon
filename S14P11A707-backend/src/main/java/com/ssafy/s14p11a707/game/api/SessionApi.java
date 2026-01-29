package com.ssafy.s14p11a707.game.api;

import com.ssafy.s14p11a707.game.dto.*;
import com.ssafy.s14p11a707.game.service.GameSessionService;
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

    @PostMapping("/{scenarioId}")
    @Override
    public ResponseEntity<GameStartResponse> startGame(
            @PathVariable long scenarioId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.startGame(scenarioId, oidcUser));
    }

    @GetMapping("/{sessionId}/report")
    @Override
    public ResponseEntity<InvestigationReportResponse> getInvestigationReport(
            @PathVariable long sessionId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.getInvestigationReport(sessionId, oidcUser));
    }

    @GetMapping("/{sessionId}/report/public")
    @Override
    public ResponseEntity<InvestigationReportResponse> getOtherInvestigationReport(
            @PathVariable long sessionId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.getOtherInvestigationReport(sessionId, oidcUser));
    }

    @PostMapping("/{sessionId}/clues/{clueId}")
    @Override
    public ResponseEntity<DiscoveredClueResponse> discoverClue(
            @PathVariable long sessionId,
            @PathVariable long clueId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.discoverClue(sessionId, clueId, oidcUser));
    }

    @GetMapping("/{sessionId}/clues")
    @Override
    public ResponseEntity<ClueListResponse> getClues(
            @PathVariable long sessionId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.getDiscoveredClues(sessionId, oidcUser));
    }

    @GetMapping("/{sessionId}/clues/{clueId}")
    @Override
    public ResponseEntity<ClueDetailResponse> getClue(
            @PathVariable long sessionId,
            @PathVariable long clueId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.getDiscoveredClue(sessionId, clueId, oidcUser));
    }

    @GetMapping("/{sessionId}/logs")
    @Override
    public ResponseEntity<EventLogListResponse> getLogs(
            @PathVariable long sessionId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.getLogs(sessionId, oidcUser));
    }

    @GetMapping("/{sessionId}/resume")
    @Override
    public ResponseEntity<GameResumeResponse> resumeGame(
            @PathVariable long sessionId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.resumeGame(sessionId, oidcUser));
    }

    @PostMapping("/{sessionId}/move-floor")
    @Override
    public ResponseEntity<FloorMoveResponse> moveFloor(
            @PathVariable long sessionId,
            @RequestBody FloorMoveRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.moveFloor(sessionId, request, oidcUser));
    }

    @GetMapping("/{sessionId}/board")
    @Override
    public ResponseEntity<BoardResponse> getBoard(
            @PathVariable long sessionId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.getBoard(sessionId, oidcUser));
    }

    @PutMapping("/{sessionId}/board")
    public ResponseEntity<BoardResponse> saveBoard(
            @PathVariable long sessionId,
            @RequestBody BoardSaveRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.saveBoard(sessionId, request, oidcUser));
    }

    @PostMapping("/{sessionId}/submit")
    @Override
    public ResponseEntity<SubmitResponse> submit(
            @PathVariable long sessionId,
            @RequestBody SubmitRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.submit(sessionId, request, oidcUser));
    }

    @PostMapping("/{sessionId}/suspects/{suspectId}/chat")
    @Override
    public ResponseEntity<SuspectChatResponse> chatWithSuspect(
            @PathVariable long sessionId,
            @PathVariable long suspectId,
            @RequestBody SuspectChatRequest request
    ) {
        return ResponseEntity.ok(gameSessionService.chatWithSuspect(sessionId, suspectId, request));
    }

    @GetMapping("/{sessionId}/suspects/{suspectId}/chats")
    @Override
    public ResponseEntity<ChatHistoryResponse> getChatHistory(
            @PathVariable long sessionId,
            @PathVariable long suspectId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.getChatHistory(sessionId, suspectId, oidcUser));
    }
}
