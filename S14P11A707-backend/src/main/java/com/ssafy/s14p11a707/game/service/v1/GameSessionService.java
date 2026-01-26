package com.ssafy.s14p11a707.game.service.v1;

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
import com.ssafy.s14p11a707.game.dto.GameStartResponse;
import com.ssafy.s14p11a707.game.dto.InvestigationReportResponse;
import com.ssafy.s14p11a707.game.dto.SubmitRequest;
import com.ssafy.s14p11a707.game.dto.SubmitResponse;
import com.ssafy.s14p11a707.game.dto.SubmitValidateResponse;
import com.ssafy.s14p11a707.game.dto.SuspectInterrogationStateResponse;
import com.ssafy.s14p11a707.game.dto.SuspectChatRequest;
import com.ssafy.s14p11a707.game.dto.SuspectChatResponse;

public interface GameSessionService {

    GameStartResponse startGame(long scenarioId);

    InvestigationReportResponse getInvestigationReport(long sessionId);

    ChatHistoryResponse getChatHistory(long sessionId, long suspectId);

    SuspectInterrogationStateResponse getSuspectInterrogationState(long sessionId, long suspectId);

    SuspectChatResponse chatWithSuspect(long sessionId, long suspectId, SuspectChatRequest request);

    DiscoveredClueResponse discoverClue(long sessionId, long clueId);

    ClueListResponse getClues(long sessionId);

    EventLogListResponse getLogs(long sessionId);

    GameSaveResponse saveGame(long sessionId, GameSaveRequest request);

    GameResumeResponse resumeGame(long sessionId);

    FloorMoveResponse moveFloor(long sessionId);

    BoardResponse getBoard(long sessionId);

    BoardResponse addBoardNode(long sessionId, BoardNodeAddRequest request);

    BoardResponse moveBoardNode(long sessionId, BoardItemMoveRequest request);

    BoardResponse updateBoardMemo(long sessionId, long nodeId, BoardMemoUpdateRequest request);

    BoardResponse addBoardConnection(long sessionId, BoardConnectionAddRequest request);

    BoardResponse deleteBoard(long sessionId, BoardDeleteRequest request);

    SubmitValidateResponse validateSubmit(long sessionId);

    SubmitResponse submit(long sessionId, SubmitRequest request);

    GameEndResponse endGame(long sessionId);
}

