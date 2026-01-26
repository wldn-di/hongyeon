package com.ssafy.s14p11a707.game.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BoardMemoUpdateRequest(
        @NotBlank
        @Size(max = 500)
        String memoContent
) {
}

