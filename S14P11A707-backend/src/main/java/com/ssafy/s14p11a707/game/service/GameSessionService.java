package com.ssafy.s14p11a707.game.service;

import com.ssafy.s14p11a707.game.dto.*;

public interface GameSessionService {

    GameStartResponse startGame(long scenarioId, long userId);

    GameStartResponse restartGame(long scenarioId, long userId);

    InvestigationReportResponse getInvestigationReport(long sessionId);

    InvestigationReportResponse getOtherInvestigationReport(long sessionId);

    DiscoveredClueResponse discoverClue(long sessionId, long clueId);

    ClueListResponse getDiscoveredClues(long sessionId);

    ClueDetailResponse getDiscoveredClue(long sessionId, long clueId);

    EventLogListResponse getLogs(long sessionId);

    GameResumeResponse resumeGame(long sessionId);

    FloorMoveResponse moveFloor(long sessionId, FloorMoveRequest request);

    BoardResponse getBoard(long sessionId);

    BoardResponse saveBoard(long sessionId, BoardSaveRequest request);

    SuspectChatResponse chatWithSuspect(long sessionId, long suspectId, SuspectChatRequest request);

    ChatHistoryResponse getChatHistory(long sessionId, long suspectId);

    SubmitResponse submit(long sessionId, SubmitRequest request);
}
