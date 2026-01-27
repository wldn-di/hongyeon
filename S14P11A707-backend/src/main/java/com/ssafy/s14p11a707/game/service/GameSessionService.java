package com.ssafy.s14p11a707.game.service;

import com.ssafy.s14p11a707.game.dto.*;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

public interface GameSessionService {

    GameStartResponse startGame(long scenarioId, OidcUser oidcUser);

    InvestigationReportResponse getInvestigationReport(long sessionId, OidcUser oidcUser);

    InvestigationReportResponse getOtherInvestigationReport(long sessionId, OidcUser oidcUser);

    DiscoveredClueResponse discoverClue(long sessionId, long clueId, OidcUser oidcUser);

    ClueListResponse getClues(long sessionId, OidcUser oidcUser);

    ClueDetailResponse getClue(long sessionId, long clueId, OidcUser oidcUser);

    EventLogListResponse getLogs(long sessionId, OidcUser oidcUser);

    GameSaveResponse saveGame(long sessionId, GameSaveRequest request, OidcUser oidcUser);

    GameResumeResponse resumeGame(long sessionId, OidcUser oidcUser);

    FloorMoveResponse moveFloor(long sessionId, OidcUser oidcUser);

    BoardResponse getBoard(long sessionId, OidcUser oidcUser);

    BoardResponse addBoardNode(long sessionId, BoardNodeAddRequest request, OidcUser oidcUser);

    BoardResponse moveBoardNode(long sessionId, BoardItemMoveRequest request, OidcUser oidcUser);

    BoardResponse updateBoardMemo(long sessionId, long nodeId, BoardMemoUpdateRequest request, OidcUser oidcUser);

    BoardResponse addBoardConnection(long sessionId, BoardConnectionAddRequest request, OidcUser oidcUser);

    BoardResponse deleteBoard(long sessionId, BoardDeleteRequest request, OidcUser oidcUser);

    GameEndResponse endGame(long sessionId, OidcUser oidcUser);

    SuspectChatResponse chatWithSuspect(long sessionId, long suspectId, SuspectChatRequest request);

    SubmitResponse submit(long sessionId, SubmitRequest request);
}
