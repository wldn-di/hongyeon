package com.ssafy.s14p11a707.review.api.v1;

import com.ssafy.s14p11a707.exception.ErrorResponse;
import com.ssafy.s14p11a707.review.dto.ReviewCreateRequest;
import com.ssafy.s14p11a707.review.dto.ReviewResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;

@Tag(name = "Review API", description = "리뷰 수정/삭제 API")
public interface ReviewApiDoc {

    @Operation(summary = "리뷰 수정", description = "리뷰를 수정합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "수정 성공",
                    content = @Content(schema = @Schema(implementation = ReviewResponse.class))
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
    ResponseEntity<ReviewResponse> updateReview(long reviewId, ReviewCreateRequest request);

    @Operation(summary = "리뷰 삭제", description = "리뷰를 삭제합니다.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "삭제 성공",
                    content = @Content(schema = @Schema(implementation = ReviewResponse.class))
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
    ResponseEntity<ReviewResponse> deleteReview(long reviewId);
}

