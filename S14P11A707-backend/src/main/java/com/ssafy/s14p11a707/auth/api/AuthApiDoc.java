package com.ssafy.s14p11a707.auth.api;

import com.ssafy.s14p11a707.auth.dto.AuthMeResponse;
import com.ssafy.s14p11a707.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

@Tag(name = "Auth API", description = "세션 기반(Keycloak OIDC) 인증 API")
public interface AuthApiDoc {

    @Operation(
            summary = "로그인 시작",
            description = """
                    Keycloak(OIDC) 로그인 플로우를 시작합니다.

                    - redirect 파라미터로 로그인 성공/실패 후 이동할 경로/URL을 지정할 수 있습니다.
                    - 상대 경로(/...) 또는 allowlist 기반 절대 URL만 허용합니다.
                    - redirect가 없거나 유효하지 않으면 서버 기본값으로 이동합니다.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "302", description = "Keycloak 인가 엔드포인트로 리다이렉트"),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<Void> login(
            @Parameter(description = "로그인 완료 후 이동 경로/URL", required = false, example = "/swagger-ui/index.html")
            String redirect,
            @Parameter(hidden = true) HttpServletRequest request
    );

    @Operation(summary = "내 정보", description = "현재 로그인 세션의 사용자 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = AuthMeResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "미인증",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<AuthMeResponse> me(
            @Parameter(hidden = true) OidcUser oidcUser
    );

    @Operation(
            summary = "토큰 갱신",
            description = """
                    세션 기반 OAuth2 Authorized Client를 사용해 토큰을 갱신합니다.

                    - 성공 시 204(No Content)
                    - 세션 미인증/갱신 실패 시 401
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "갱신 성공"),
            @ApiResponse(
                    responseCode = "401",
                    description = "미인증/갱신 실패",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<Void> refresh(
            @Parameter(hidden = true) HttpServletRequest request,
            @Parameter(hidden = true) HttpServletResponse response,
            @Parameter(hidden = true) Authentication authentication
    );

    @Operation(summary = "로그아웃", description = "세션 로그아웃 및 인증 쿠키를 삭제합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "로그아웃 성공"),
            @ApiResponse(
                    responseCode = "401",
                    description = "미인증",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<Void> logout(
            @Parameter(hidden = true) HttpServletRequest request
    );
}
