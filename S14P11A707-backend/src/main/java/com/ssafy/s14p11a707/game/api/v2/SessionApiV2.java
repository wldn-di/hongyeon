package com.ssafy.s14p11a707.game.api.v2;

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
import com.ssafy.s14p11a707.game.dto.FloorMoveResponse;
import com.ssafy.s14p11a707.game.dto.GameEndResponse;
import com.ssafy.s14p11a707.game.dto.GameResumeResponse;
import com.ssafy.s14p11a707.game.dto.GameSaveRequest;
import com.ssafy.s14p11a707.game.dto.GameSaveResponse;
import com.ssafy.s14p11a707.game.dto.GameStartResponse;
import com.ssafy.s14p11a707.game.dto.InvestigationReportResponse;
import com.ssafy.s14p11a707.game.service.v2.GameSessionServiceV2;
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
@RequestMapping("/api/v2/sessions")
public class SessionApiV2 implements SessionApiV2Doc {

    private final GameSessionServiceV2 gameSessionService;

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
        return ResponseEntity.ok(gameSessionService.getClues(sessionId, oidcUser));
    }

    @GetMapping("/{sessionId}/clues/{clueId}")
    @Override
    public ResponseEntity<ClueDetailResponse> getClue(
            @PathVariable long sessionId,
            @PathVariable long clueId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.getClue(sessionId, clueId, oidcUser));
    }

    @GetMapping("/{sessionId}/logs")
    @Override
    public ResponseEntity<EventLogListResponse> getLogs(
            @PathVariable long sessionId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.getLogs(sessionId, oidcUser));
    }

    @PatchMapping("/{sessionId}")
    @Override
    public ResponseEntity<GameSaveResponse> saveGame(
            @PathVariable long sessionId,
            @RequestBody GameSaveRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.saveGame(sessionId, request, oidcUser));
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
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.moveFloor(sessionId, oidcUser));
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

    @PostMapping("/{sessionId}/end")
    @Override
    public ResponseEntity<GameEndResponse> endGame(
            @PathVariable long sessionId,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(gameSessionService.endGame(sessionId, oidcUser));
    }
}
