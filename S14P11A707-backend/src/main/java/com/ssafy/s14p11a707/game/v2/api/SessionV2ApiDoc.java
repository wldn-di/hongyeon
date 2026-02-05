package com.ssafy.s14p11a707.game.v2.api;

import com.ssafy.s14p11a707.exception.ErrorResponse;
import com.ssafy.s14p11a707.game.dto.SuspectChatRequest;
import com.ssafy.s14p11a707.game.dto.SuspectChatResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

@Tag(name = "Game Session V2 API", description = "용의자 채팅 v2(트랜잭션 분리) API")
public interface SessionV2ApiDoc {

    @Operation(
            summary = "용의자 심문 v2",
            description = """
                    용의자와 대화를 진행합니다. (v2)

                    - AI 호출을 DB 트랜잭션 밖으로 분리하여 긴 트랜잭션을 방지합니다.
                    - AI 호출이 실패하면 에러 메시지를 응답/저장합니다.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "심문 성공(또는 AI 실패 에러 메시지 포함)",
                    content = @Content(schema = @Schema(implementation = SuspectChatResponse.class))
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
                    description = "세션/용의자를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<SuspectChatResponse> chatWithSuspect(
            long sessionId,
            long suspectId,
            SuspectChatRequest request,
            @Parameter(hidden = true) OidcUser oidcUser
    );
}

