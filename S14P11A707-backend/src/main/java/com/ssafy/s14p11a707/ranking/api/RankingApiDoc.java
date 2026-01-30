package com.ssafy.s14p11a707.ranking.api;

import com.ssafy.s14p11a707.exception.ErrorResponse;
import com.ssafy.s14p11a707.ranking.dto.GlobalRankingResponse;
import com.ssafy.s14p11a707.ranking.dto.MyRankingResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

@Tag(name = "Ranking API", description = "랭킹 API")
public interface RankingApiDoc {

    @Operation(summary = "전체 랭킹 조회", description = "전체 랭킹 Top 10을 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = GlobalRankingResponse.class))
            )
    })
    ResponseEntity<GlobalRankingResponse> getGlobalRankings(
            @Parameter(description = "랭킹 타입 (score: 점수, clears: 클리어 수, time: 플레이 시간)", example = "score")
            String type
    );

    @Operation(summary = "내 랭킹 조회", description = "내 랭킹을 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = MyRankingResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증되지 않은 사용자",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    ResponseEntity<MyRankingResponse> getMyRanking(
            @Parameter(description = "랭킹 타입 (score: 점수, clears: 클리어 수, time: 플레이 시간)", example = "score")
            String type,
            @Parameter(hidden = true) OidcUser oidcUser
    );
}
