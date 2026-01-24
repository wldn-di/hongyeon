package com.ssafy.s14p11a707.review.dto;

public record ReviewCreateRequest(
        int rating,
        int difficulty,
        String content,
        boolean isSpoiler
) {
}

