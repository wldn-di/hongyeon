package com.ssafy.s14p11a707.game.api;

import com.ssafy.s14p11a707.exception.ErrorResponse;
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
import com.ssafy.s14p11a707.game.dto.GameSaveRequest;
import com.ssafy.s14p11a707.game.dto.GameSaveResponse;
import com.ssafy.s14p11a707.game.dto.GameStartResponse;
import com.ssafy.s14p11a707.game.dto.InvestigationReportResponse;
import com.ssafy.s14p11a707.game.dto.SubmitRequest;
import com.ssafy.s14p11a707.game.dto.SubmitResponse;
import com.ssafy.s14p11a707.game.dto.SuspectChatRequest;
import com.ssafy.s14p11a707.game.dto.SuspectChatResponse;
import com.ssafy.s14p11a707.game.dto.ChatHistoryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

@Tag(name = "Session API", description = "게임 세션/보드/단서 API")
public interface SessionApiDoc {

    @Operation(summary = "게임 시작", description = "새로운 게임 세션을 생성하고 게임을 시작합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "게임 시작 성공",
                    content = @Content(schema = @Schema(implementation = GameStartResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "시나리오를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "이미 진행 중인 게임이 있음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<GameStartResponse> startGame(long scenarioId, OidcUser oidcUser);

    @Operation(summary = "내 수사보고서 조회", description = "내 세션의 수사보고서를 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = InvestigationReportResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "접근 권한 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<InvestigationReportResponse> getInvestigationReport(long sessionId, OidcUser oidcUser);

    @Operation(summary = "타인 수사보고서 조회", description = "타인의 완료된 세션 수사보고서를 조회합니다. 동일 시나리오를 완료한 유저만 열람 가능합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = InvestigationReportResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "접근 권한 없음 (동일 시나리오 완료 필요)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<InvestigationReportResponse> getOtherInvestigationReport(long sessionId, OidcUser oidcUser);

    @Operation(summary = "단서 획득", description = "단서를 획득합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "획득 성공",
                    content = @Content(schema = @Schema(implementation = DiscoveredClueResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "접근 권한 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션/단서를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "이미 획득한 단서",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<DiscoveredClueResponse> discoverClue(long sessionId, long clueId, OidcUser oidcUser);

    @Operation(summary = "단서 목록 조회", description = "세션의 단서 목록을 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ClueListResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "접근 권한 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<ClueListResponse> getClues(long sessionId, OidcUser oidcUser);

    @Operation(summary = "단서 상세 조회", description = "단서의 상세 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ClueDetailResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "접근 권한 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션/단서를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<ClueDetailResponse> getClue(long sessionId, long clueId, OidcUser oidcUser);

    @Operation(summary = "수사 로그 조회", description = "세션의 수사 로그 목록을 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = EventLogListResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "접근 권한 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<EventLogListResponse> getLogs(long sessionId, OidcUser oidcUser);

    @Operation(summary = "게임 저장", description = "세션 진행 내용을 저장합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "저장 성공",
                    content = @Content(schema = @Schema(implementation = GameSaveResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "접근 권한 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<GameSaveResponse> saveGame(long sessionId, GameSaveRequest request, OidcUser oidcUser);

    @Operation(summary = "이어하기", description = "세션을 이어하기 위한 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = GameResumeResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "접근 권한 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<GameResumeResponse> resumeGame(long sessionId, OidcUser oidcUser);

    @Operation(summary = "층 이동", description = "현재 세션의 층을 이동합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "이동 성공",
                    content = @Content(schema = @Schema(implementation = FloorMoveResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "접근 권한 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션/방을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<FloorMoveResponse> moveFloor(long sessionId, FloorMoveRequest request, OidcUser oidcUser);

    @Operation(summary = "보드 조회", description = "세션의 추리 보드를 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = BoardResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "접근 권한 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<BoardResponse> getBoard(long sessionId, OidcUser oidcUser);

    @Operation(summary = "보드 노드 추가", description = "추리 보드에 노드를 추가합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "추가 성공",
                    content = @Content(schema = @Schema(implementation = BoardResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "접근 권한 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<BoardResponse> addBoardNode(long sessionId, BoardNodeAddRequest request, OidcUser oidcUser);

    @Operation(summary = "보드 노드 이동", description = "추리 보드의 노드 위치를 이동합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "이동 성공",
                    content = @Content(schema = @Schema(implementation = BoardResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "접근 권한 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션/노드를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<BoardResponse> moveBoardNode(long sessionId, BoardItemMoveRequest request, OidcUser oidcUser);

    @Operation(summary = "보드 메모 수정", description = "추리 보드의 메모 노드 내용을 수정합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "수정 성공",
                    content = @Content(schema = @Schema(implementation = BoardResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "접근 권한 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션/노드를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<BoardResponse> updateBoardMemo(long sessionId, long nodeId, BoardMemoUpdateRequest request, OidcUser oidcUser);

    @Operation(summary = "보드 연결선 추가", description = "추리 보드에 연결선을 추가합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "추가 성공",
                    content = @Content(schema = @Schema(implementation = BoardResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "접근 권한 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션/노드를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "이미 연결된 노드",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<BoardResponse> addBoardConnection(long sessionId, BoardConnectionAddRequest request, OidcUser oidcUser);

    @Operation(summary = "보드 삭제", description = "추리 보드의 노드/연결선을 삭제합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "삭제 성공",
                    content = @Content(schema = @Schema(implementation = BoardResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "접근 권한 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<BoardResponse> deleteBoard(long sessionId, BoardDeleteRequest request, OidcUser oidcUser);

    @Operation(summary = "최종 정답 제출", description = "보드 검증 + 범인/흉기/장소/동기 채점 + 결과 처리를 수행합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "제출 결과 반환 (COMPLETED/WRONG_ANSWER/FAILED/BOARD_INVALID)",
                    content = @Content(schema = @Schema(implementation = SubmitResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "접근 권한 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<SubmitResponse> submit(long sessionId, SubmitRequest request, OidcUser oidcUser);

    @Operation(summary = "용의자 심문", description = "용의자와 대화를 진행합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "심문 성공",
                    content = @Content(schema = @Schema(implementation = SuspectChatResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션/용의자를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<SuspectChatResponse> chatWithSuspect(long sessionId, long suspectId, SuspectChatRequest request);

    @Operation(summary = "심문 기록 조회", description = "특정 용의자와의 대화 기록을 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ChatHistoryResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "세션/용의자를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<ChatHistoryResponse> getChatHistory(long sessionId, long suspectId);
}
