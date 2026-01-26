package com.ssafy.s14p11a707.game.service.v2;

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
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

public interface GameSessionServiceV2 {

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
}
