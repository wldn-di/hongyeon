package com.ssafy.s14p11a707.game.service;

import com.ssafy.s14p11a707.game.dto.*;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

public interface GameSessionService {

    GameStartResponse startGame(long scenarioId, OidcUser oidcUser);

    InvestigationReportResponse getInvestigationReport(long sessionId, OidcUser oidcUser);

    InvestigationReportResponse getOtherInvestigationReport(long sessionId, OidcUser oidcUser);

    DiscoveredClueResponse discoverClue(long sessionId, long clueId, OidcUser oidcUser);

    ClueListResponse getDiscoveredClues(long sessionId, OidcUser oidcUser);

    ClueDetailResponse getDiscoveredClue(long sessionId, long clueId, OidcUser oidcUser);

    EventLogListResponse getLogs(long sessionId, OidcUser oidcUser);

    GameResumeResponse resumeGame(long sessionId, OidcUser oidcUser);

    FloorMoveResponse moveFloor(long sessionId, FloorMoveRequest request, OidcUser oidcUser);

    BoardResponse getBoard(long sessionId, OidcUser oidcUser);

    BoardResponse saveBoard(long sessionId, BoardSaveRequest request, OidcUser oidcUser);

    SuspectChatResponse chatWithSuspect(long sessionId, long suspectId, SuspectChatRequest request);

    ChatHistoryResponse getChatHistory(long sessionId, long suspectId, OidcUser oidcUser);

    SubmitResponse submit(long sessionId, SubmitRequest request, OidcUser oidcUser);
}
