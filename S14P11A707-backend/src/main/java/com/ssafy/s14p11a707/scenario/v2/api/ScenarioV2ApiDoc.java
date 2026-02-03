package com.ssafy.s14p11a707.scenario.v2.api;

import com.ssafy.s14p11a707.exception.ErrorResponse;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateRequest;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Tag(name = "Scenario V2 API", description = "시나리오 생성 v2(Async + SSE) API")
public interface ScenarioV2ApiDoc {

    @Operation(
            summary = "시나리오 v2 생성 요청",
            description = """
                    시나리오 생성 v2를 시작합니다. (Non-blocking)

                    - 즉시 Scenario 스텁을 DB에 저장(generationStatus=GENERATING)
                    - 백그라운드에서 생성 그래프 실행
                    - 진행 상황은 SSE(/api/v2/scenarios/stream)로 수신
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "요청 성공",
                    content = @Content(schema = @Schema(implementation = ScenarioV2CreateResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 입력 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "이미 생성 중인 시나리오가 있음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<ScenarioV2CreateResponse> createScenario(ScenarioV2CreateRequest request, @Parameter(hidden = true) OidcUser oidcUser);

    @Operation(
            summary = "시나리오 v2 생성 진행 SSE",
            description = """
                    시나리오 v2 생성 진행 상황을 수신하기 위한 SSE 스트림입니다.

                    - 재연결 시 진행률 리셋(Last-Event-ID 리플레이 미지원)
                    - 서버는 complete/error 이벤트 이후 emitter.complete()로 연결을 종료합니다.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "연결 성공(text/event-stream)",
                    content = @Content(mediaType = "text/event-stream")
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    SseEmitter connect(@Parameter(hidden = true) OidcUser oidcUser);
}

