package com.ssafy.s14p11a707.game.api.v1;

import com.ssafy.s14p11a707.exception.ErrorResponse;
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
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;

@Tag(name = "Session API", description = "게임 세션/보드/단서/제출 API")
public interface SessionApiDoc {

    @Operation(summary = "수사보고서 조회", description = "세션의 수사보고서를 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = InvestigationReportResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<InvestigationReportResponse> getInvestigationReport(long sessionId);

    @Operation(summary = "채팅내역 조회", description = "용의자 채팅 내역을 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ChatHistoryResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<ChatHistoryResponse> getChatHistory(long sessionId, long suspectId);

    @Operation(summary = "용의자 심문 진행도 조회", description = "용의자별 심문 진행 상태를 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = SuspectInterrogationStateResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<SuspectInterrogationStateResponse> getSuspectInterrogationState(long sessionId, long suspectId);

    @Operation(summary = "용의자 심문", description = "용의자에게 질문을 보내고 답변을 받습니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "요청 성공",
                    content = @Content(schema = @Schema(implementation = SuspectChatResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<SuspectChatResponse> chatWithSuspect(long sessionId, long suspectId, SuspectChatRequest request);

    @Operation(summary = "단서 획득", description = "단서를 획득합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "획득 성공",
                    content = @Content(schema = @Schema(implementation = DiscoveredClueResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<DiscoveredClueResponse> discoverClue(long sessionId, long clueId);

    @Operation(summary = "단서 목록 조회", description = "세션의 단서 목록을 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ClueListResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<ClueListResponse> getClues(long sessionId);

    @Operation(summary = "수사 로그 조회", description = "세션의 수사 로그 목록을 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = EventLogListResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<EventLogListResponse> getLogs(long sessionId);

    @Operation(summary = "게임 저장", description = "세션 진행 내용을 저장합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "저장 성공",
                    content = @Content(schema = @Schema(implementation = GameSaveResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<GameSaveResponse> saveGame(long sessionId, GameSaveRequest request);

    @Operation(summary = "이어하기", description = "세션을 이어하기 위한 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = GameResumeResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<GameResumeResponse> resumeGame(long sessionId);

    @Operation(summary = "층 이동", description = "현재 세션의 층을 이동합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "이동 성공",
                    content = @Content(schema = @Schema(implementation = FloorMoveResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<FloorMoveResponse> moveFloor(long sessionId);

    @Operation(summary = "보드 조회", description = "세션의 추리 보드를 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = BoardResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<BoardResponse> getBoard(long sessionId);

    @Operation(summary = "보드 노드 추가", description = "추리 보드에 노드를 추가합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "추가 성공",
                    content = @Content(schema = @Schema(implementation = BoardResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<BoardResponse> addBoardNode(long sessionId, BoardNodeAddRequest request);

    @Operation(summary = "보드 노드 이동", description = "추리 보드의 노드 위치를 이동합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "이동 성공",
                    content = @Content(schema = @Schema(implementation = BoardResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<BoardResponse> moveBoardNode(long sessionId, BoardItemMoveRequest request);

    @Operation(summary = "보드 메모 수정", description = "추리 보드의 메모 노드 내용을 수정합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "수정 성공",
                    content = @Content(schema = @Schema(implementation = BoardResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<BoardResponse> updateBoardMemo(long sessionId, long nodeId, BoardMemoUpdateRequest request);

    @Operation(summary = "보드 연결선 추가", description = "추리 보드에 연결선을 추가합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "추가 성공",
                    content = @Content(schema = @Schema(implementation = BoardResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<BoardResponse> addBoardConnection(long sessionId, BoardConnectionAddRequest request);

    @Operation(summary = "보드 삭제", description = "추리 보드를 삭제합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "삭제 성공",
                    content = @Content(schema = @Schema(implementation = BoardResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<BoardResponse> deleteBoard(long sessionId, BoardDeleteRequest request);

    @Operation(summary = "제출 조건 확인", description = "최종 제출 가능한 상태인지 확인합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = SubmitValidateResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<SubmitValidateResponse> validateSubmit(long sessionId);

    @Operation(summary = "최종 제출", description = "최종 추리 결과를 제출합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "제출 성공",
                    content = @Content(schema = @Schema(implementation = SubmitResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<SubmitResponse> submit(long sessionId, SubmitRequest request);

    @Operation(summary = "게임 종료", description = "세션을 종료합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "종료 성공",
                    content = @Content(schema = @Schema(implementation = GameEndResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<GameEndResponse> endGame(long sessionId);
}

