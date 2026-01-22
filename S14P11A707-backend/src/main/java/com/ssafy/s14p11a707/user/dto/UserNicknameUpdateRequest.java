package com.ssafy.s14p11a707.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserNicknameUpdateRequest(
        @Schema(description = "변경할 닉네임", example = "홍연탐정")
        @NotBlank
        @Size(max = 30)
        String nickname
) {
}