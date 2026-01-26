package com.ssafy.s14p11a707.game.api.v1;

import com.ssafy.s14p11a707.game.dto.BoardConnectionAddRequest;
import com.ssafy.s14p11a707.game.dto.BoardDeleteRequest;
import com.ssafy.s14p11a707.game.dto.BoardItemMoveRequest;
import com.ssafy.s14p11a707.game.dto.BoardMemoUpdateRequest;
import com.ssafy.s14p11a707.game.dto.BoardNodeAddRequest;
import com.ssafy.s14p11a707.game.dto.BoardResponse;
import com.ssafy.s14p11a707.game.dto.ChatHistoryResponse;
import com.ssafy.s14p11a707.game.dto.ClueListResponse;
import com.ssafy.s14p11a707.game.dto.DiscoveredClueResponse;
import com.ssafy.s14p11a707.game.dto.EventLogListResponse;
import com.ssafy.s14p11a707.game.dto.FloorMoveResponse;
import com.ssafy.s14p11a707.game.dto.GameEndResponse;
import com.ssafy.s14p11a707.game.dto.GameResumeResponse;
import com.ssafy.s14p11a707.game.dto.GameSaveRequest;
import com.ssafy.s14p11a707.game.dto.GameSaveResponse;
import com.ssafy.s14p11a707.game.dto.InvestigationReportResponse;
import com.ssafy.s14p11a707.game.dto.SubmitRequest;
import com.ssafy.s14p11a707.game.dto.SubmitResponse;
import com.ssafy.s14p11a707.game.dto.SubmitValidateResponse;
import com.ssafy.s14p11a707.game.dto.SuspectChatRequest;
import com.ssafy.s14p11a707.game.dto.SuspectChatResponse;
import com.ssafy.s14p11a707.game.dto.SuspectInterrogationStateResponse;
import com.ssafy.s14p11a707.game.service.v1.GameSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/v1/sessions")
public class SessionApi implements SessionApiDoc {

    private final GameSessionService gameSessionService;

    @GetMapping("/{sessionId}/report")
    @Override
    public ResponseEntity<InvestigationReportResponse> getInvestigationReport(@PathVariable long sessionId) {
        return ResponseEntity.ok(gameSessionService.getInvestigationReport(sessionId));
    }

    @GetMapping("/{sessionId}/suspects/{suspectId}/chats")
    @Override
    public ResponseEntity<ChatHistoryResponse> getChatHistory(
            @PathVariable long sessionId,
            @PathVariable long suspectId
    ) {
        return ResponseEntity.ok(gameSessionService.getChatHistory(sessionId, suspectId));
    }

    @GetMapping("/{sessionId}/suspects/{suspectId}/state")
    @Override
    public ResponseEntity<SuspectInterrogationStateResponse> getSuspectInterrogationState(
            @PathVariable long sessionId,
            @PathVariable long suspectId
    ) {
        return ResponseEntity.ok(gameSessionService.getSuspectInterrogationState(sessionId, suspectId));
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

    @PostMapping("/{sessionId}/clues/{clueId}")
    @Override
    public ResponseEntity<DiscoveredClueResponse> discoverClue(
            @PathVariable long sessionId,
            @PathVariable long clueId
    ) {
        return ResponseEntity.ok(gameSessionService.discoverClue(sessionId, clueId));
    }

    @GetMapping("/{sessionId}/clues")
    @Override
    public ResponseEntity<ClueListResponse> getClues(@PathVariable long sessionId) {
        return ResponseEntity.ok(gameSessionService.getClues(sessionId));
    }

    @GetMapping("/{sessionId}/logs")
    @Override
    public ResponseEntity<EventLogListResponse> getLogs(@PathVariable long sessionId) {
        return ResponseEntity.ok(gameSessionService.getLogs(sessionId));
    }

    @PatchMapping("/{sessionId}")
    @Override
    public ResponseEntity<GameSaveResponse> saveGame(
            @PathVariable long sessionId,
            @RequestBody GameSaveRequest request
    ) {
        return ResponseEntity.ok(gameSessionService.saveGame(sessionId, request));
    }

    @GetMapping("/{sessionId}/resume")
    @Override
    public ResponseEntity<GameResumeResponse> resumeGame(@PathVariable long sessionId) {
        return ResponseEntity.ok(gameSessionService.resumeGame(sessionId));
    }

    @PostMapping("/{sessionId}/move-floor")
    @Override
    public ResponseEntity<FloorMoveResponse> moveFloor(@PathVariable long sessionId) {
        return ResponseEntity.ok(gameSessionService.moveFloor(sessionId));
    }

    @GetMapping("/{sessionId}/board")
    @Override
    public ResponseEntity<BoardResponse> getBoard(@PathVariable long sessionId) {
        return ResponseEntity.ok(gameSessionService.getBoard(sessionId));
    }

    @PostMapping("/{sessionId}/board/nodes")
    @Override
    public ResponseEntity<BoardResponse> addBoardNode(
            @PathVariable long sessionId,
            @RequestBody BoardNodeAddRequest request
    ) {
        return ResponseEntity.ok(gameSessionService.addBoardNode(sessionId, request));
    }

    @PatchMapping("/{sessionId}/board/nodes/position")
    @Override
    public ResponseEntity<BoardResponse> moveBoardNode(
            @PathVariable long sessionId,
            @RequestBody BoardItemMoveRequest request
    ) {
        return ResponseEntity.ok(gameSessionService.moveBoardNode(sessionId, request));
    }

    @PatchMapping("/{sessionId}/board/nodes/{nodeId}")
    @Override
    public ResponseEntity<BoardResponse> updateBoardMemo(
            @PathVariable long sessionId,
            @PathVariable long nodeId,
            @RequestBody BoardMemoUpdateRequest request
    ) {
        return ResponseEntity.ok(gameSessionService.updateBoardMemo(sessionId, nodeId, request));
    }

    @PostMapping("/{sessionId}/board/connections")
    @Override
    public ResponseEntity<BoardResponse> addBoardConnection(
            @PathVariable long sessionId,
            @RequestBody BoardConnectionAddRequest request
    ) {
        return ResponseEntity.ok(gameSessionService.addBoardConnection(sessionId, request));
    }

    @DeleteMapping("/{sessionId}/board")
    @Override
    public ResponseEntity<BoardResponse> deleteBoard(
            @PathVariable long sessionId,
            @RequestBody BoardDeleteRequest request
    ) {
        return ResponseEntity.ok(gameSessionService.deleteBoard(sessionId, request));
    }

    @GetMapping("/{sessionId}/submit/validate")
    @Override
    public ResponseEntity<SubmitValidateResponse> validateSubmit(@PathVariable long sessionId) {
        return ResponseEntity.ok(gameSessionService.validateSubmit(sessionId));
    }

    @PostMapping("/{sessionId}/submit")
    @Override
    public ResponseEntity<SubmitResponse> submit(
            @PathVariable long sessionId,
            @RequestBody SubmitRequest request
    ) {
        return ResponseEntity.ok(gameSessionService.submit(sessionId, request));
    }

    @PostMapping("/{sessionId}/end")
    @Override
    public ResponseEntity<GameEndResponse> endGame(@PathVariable long sessionId) {
        return ResponseEntity.ok(gameSessionService.endGame(sessionId));
    }
}
