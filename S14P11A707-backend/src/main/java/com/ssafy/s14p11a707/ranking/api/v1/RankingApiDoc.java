package com.ssafy.s14p11a707.ranking.api.v1;

import com.ssafy.s14p11a707.exception.ErrorResponse;
import com.ssafy.s14p11a707.ranking.dto.GlobalRankingResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;

@Tag(name = "Ranking API", description = "랭킹 API")
public interface RankingApiDoc {

    @Operation(summary = "전체 랭킹 조회", description = "전체 랭킹을 조회합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = GlobalRankingResponse.class))
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
    ResponseEntity<GlobalRankingResponse> getGlobalRankings();
}

