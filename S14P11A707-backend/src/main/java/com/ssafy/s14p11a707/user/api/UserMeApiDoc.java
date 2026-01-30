package com.ssafy.s14p11a707.user.api;

import com.ssafy.s14p11a707.auth.dto.AuthMeResponse;
import com.ssafy.s14p11a707.exception.ErrorResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioListResponse;
import com.ssafy.s14p11a707.user.dto.BookshelfSessionResponse;
import com.ssafy.s14p11a707.user.dto.BookshelfStatsResponse;
import com.ssafy.s14p11a707.user.dto.UserNicknameUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

@Tag(name = "User(Me) API", description = "내 정보/책장 API")
public interface UserMeApiDoc {

    @Operation(summary = "내 책장 통계 조회", description = "내 책장 통계를 조회합니다. (clearRate는 0.0~1.0 사이 값, 프론트에서 xx% 포맷 필요)")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = BookshelfStatsResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증되지 않은 사용자",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<BookshelfStatsResponse> getMyBookshelfStats(@Parameter(hidden = true) OidcUser oidcUser);

    @Operation(
            summary = "내 책장 기록 통합 조회",
            description = """
                    내 책장(완료/미완/미제) 기록을 통합 조회합니다.
                    - COMPLETED: rankGrade, playTime, hasReport 사용 (수사보고서 열람 가능)
                    - PLAYING: lastSavedAt, expiresAt 사용 (이어하기 가능, 7일 후 만료)
                    - FAILED: playTime 사용
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = BookshelfSessionResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증되지 않은 사용자",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<BookshelfSessionResponse> getMyBookshelfSessions(
            @Parameter(hidden = true) OidcUser oidcUser,
            @Parameter(hidden = true) Pageable pageable
    );

    @Operation(summary = "내 시나리오 조회", description = "내가 생성한 시나리오 목록을 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ScenarioListResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증되지 않은 사용자",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<ScenarioListResponse> getMyScenarios(
            @Parameter(hidden = true) OidcUser oidcUser,
            @Parameter(hidden = true) Pageable pageable
    );

    @Operation(summary = "내 닉네임 변경", description = "현재 로그인한 사용자의 닉네임을 변경합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "변경 성공",
                    content = @Content(schema = @Schema(implementation = AuthMeResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증되지 않은 사용자",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "닉네임 중복",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<AuthMeResponse> updateMyNickname(@Parameter(hidden = true) OidcUser oidcUser, UserNicknameUpdateRequest request);
}
