package com.ssafy.s14p11a707.game.api;

import com.ssafy.s14p11a707.game.dto.BoardConnectionAddRequest;
import com.ssafy.s14p11a707.game.dto.BoardDeleteRequest;
import com.ssafy.s14p11a707.game.dto.BoardItemMoveRequest;
import com.ssafy.s14p11a707.game.dto.BoardMemoUpdateRequest;
import com.ssafy.s14p11a707.game.dto.BoardNodeAddRequest;
import com.ssafy.s14p11a707.game.dto.BoardResponse;
import com.ssafy.s14p11a707.game.dto.ClueDetailResponse;
import com.ssafy.s14p11a707.game.dto.ClueListResponse;
import com.ssafy.s14p11a707.game.dto.DiscoveredClueResponse;
import com.ssafy.s14p11a707.game.dto.EventLogListResponse;
import com.ssafy.s14p11a707.game.dto.FloorMoveRequest;
import com.ssafy.s14p11a707.game.dto.FloorMoveResponse;
import com.ssafy.s14p11a707.game.dto.GameResumeResponse;
import com.ssafy.s14p11a707.game.dto.GameStartResponse;
import com.ssafy.s14p11a707.game.dto.InvestigationReportResponse;
import com.ssafy.s14p11a707.game.dto.SubmitRequest;
import com.ssafy.s14p11a707.game.dto.SubmitResponse;
import com.ssafy.s14p11a707.game.dto.SuspectChatRequest;
import com.ssafy.s14p11a707.game.dto.SuspectChatResponse;
import com.ssafy.s14p11a707.game.dto.ChatHistoryResponse;
import com.ssafy.s14p11a707.game.service.GameSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @PostMapping("/{scenarioId}/restart")
    @Override
    public ResponseEntity<GameStartResponse> restartGame(
            @PathVariable long scenarioId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.restartGame(scenarioId, oidcUser));
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

    @PostMapping("/{sessionId}/board/nodes")
    @Override
    public ResponseEntity<BoardResponse> addBoardNode(
            @PathVariable long sessionId,
            @RequestBody BoardNodeAddRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.addBoardNode(sessionId, request, oidcUser));
    }

    @PatchMapping("/{sessionId}/board/nodes/position")
    @Override
    public ResponseEntity<BoardResponse> moveBoardNode(
            @PathVariable long sessionId,
            @RequestBody BoardItemMoveRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.moveBoardNode(sessionId, request, oidcUser));
    }

    @PatchMapping("/{sessionId}/board/nodes/{nodeId}")
    @Override
    public ResponseEntity<BoardResponse> updateBoardMemo(
            @PathVariable long sessionId,
            @PathVariable long nodeId,
            @RequestBody BoardMemoUpdateRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.updateBoardMemo(sessionId, nodeId, request, oidcUser));
    }

    @PostMapping("/{sessionId}/board/connections")
    @Override
    public ResponseEntity<BoardResponse> addBoardConnection(
            @PathVariable long sessionId,
            @RequestBody BoardConnectionAddRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.addBoardConnection(sessionId, request, oidcUser));
    }

    @DeleteMapping("/{sessionId}/board")
    @Override
    public ResponseEntity<BoardResponse> deleteBoard(
            @PathVariable long sessionId,
            @RequestBody BoardDeleteRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.deleteBoard(sessionId, request, oidcUser));
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
