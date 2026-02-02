package com.ssafy.s14p11a707.scenario.api;

import com.ssafy.s14p11a707.exception.ErrorResponse;
import com.ssafy.s14p11a707.scenario.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Tag(name = "Scenario API", description = "시나리오/리뷰/게임시작 API")
public interface ScenarioApiDoc {

    @Operation(
            summary = "시나리오 목록/검색/필터/정렬 조회",
            description = """
                    시나리오 목록을 조회합니다. (검색/필터/정렬/페이지네이션 통합)

                    - 검색: title 기준 부분 일치(대소문자 무시)
                    - 장르: genres 파라미터(복수)로 필터링 (예: genres=crime&genres=mystery)
                    - 난이도: difficulties 파라미터(복수)로 필터링 (easy|medium|hard)
                      - easy: avgDifficulty가 NULL 이거나 <= 2
                      - medium: 2 < avgDifficulty <= 4
                      - hard: 4 < avgDifficulty
                    - 정렬: sortBy=latest|popular|rating

                    호출 예시
                    - 최신순 20개: GET /api/scenarios?page=0&size=20&sortBy=latest
                    - 인기순 10개: GET /api/scenarios?page=0&size=10&sortBy=popular
                    - 장르+난이도 필터: GET /api/scenarios?genres=crime&difficulties=hard&sortBy=popular
                    - 제목 검색: GET /api/scenarios?keyword=셜록
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ScenarioListResponse.class))
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
    ResponseEntity<ScenarioListResponse> listScenarios(
            @Parameter(description = "검색 키워드(시나리오 제목 기준)", example = "셜록") @RequestParam(required = false) String keyword,
            @Parameter(description = "장르 필터(복수 가능)", example = "crime") @RequestParam(required = false) List<String> genres,
            @Parameter(description = "난이도 필터(easy|medium|hard, 복수 가능)", example = "hard") @RequestParam(required = false) List<String> difficulties,
            @Parameter(description = "정렬(latest|popular|rating)", example = "popular") @RequestParam(required = false) String sortBy,
            @Parameter(description = "페이지(0-base)", example = "0") @RequestParam(required = false, defaultValue = "0") int page,
            @Parameter(description = "사이즈", example = "20") @RequestParam(required = false, defaultValue = "20") int size
    );

    @Operation(
            summary = "플레이수 TOP 10",
            description = "플레이수(playCount) 기준 TOP 10 시나리오를 조회합니다. (Redis 캐시 TTL: 5분)"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ScenarioListResponse.class))
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
    ResponseEntity<ScenarioListResponse> topScenariosByPlayCount();

    @Operation(
            summary = "평점 TOP 10",
            description = "평점(avgRating) 기준 TOP 10 시나리오를 조회합니다. (Redis 캐시 TTL: 5분)"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ScenarioListResponse.class))
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
    ResponseEntity<ScenarioListResponse> topScenariosByRating();

    @Operation(summary = "시나리오 상세 조회", description = "시나리오 상세 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ScenarioDetailResponse.class))
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
    ResponseEntity<ScenarioDetailResponse> getScenario(long scenarioId);

    @Operation(summary = "시나리오 생성 상태 조회", description = "시나리오 생성 상태를 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ScenarioStatusResponse.class))
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
    ResponseEntity<ScenarioStatusResponse> getScenarioStatus(long scenarioId);

    @Operation(summary = "시나리오 생성 요청", description = "시나리오 생성을 요청합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "요청 성공",
                    content = @Content(schema = @Schema(implementation = ScenarioCreateResponse.class))
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
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<ScenarioCreateResponse> createScenario(ScenarioCreateRequest request, @Parameter(hidden = true) OidcUser oidcUser);

    @Operation(summary = "시나리오 삭제", description = "시나리오를 삭제합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "삭제 성공",
                    content = @Content(schema = @Schema(implementation = ScenarioDeleteResponse.class))
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
                    responseCode = "403",
                    description = "접근 권한 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "시나리오를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<ScenarioDeleteResponse> deleteScenario(long scenarioId, @Parameter(hidden = true) OidcUser oidcUser);

    @Operation(summary = "시나리오 랭킹 조회", description = "시나리오 랭킹을 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ScenarioRankingResponse.class))
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
    ResponseEntity<ScenarioRankingResponse> getScenarioRankings(
            long scenarioId,
            @Parameter(hidden = true) @AuthenticationPrincipal OidcUser oidcUser
    );

    @Operation(summary = "방 정보 조회", description = "시나리오 방 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = RoomListResponse.class))
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
    ResponseEntity<RoomListResponse> getRooms(long scenarioId);

    @Operation(summary = "피해자 정보 조회", description = "시나리오 피해자 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = VictimResponse.class))
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
    ResponseEntity<VictimResponse> getVictim(long scenarioId);

    @Operation(summary = "용의자 목록 조회", description = "시나리오 용의자 목록을 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = SuspectListResponse.class))
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
    ResponseEntity<SuspectListResponse> getSuspects(long scenarioId);
}
