package com.ssafy.s14p11a707.review.dto;

import com.ssafy.s14p11a707.review.entity.Review;
import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.user.entity.User;

public record ReviewCreateRequest(
        int rating,
        int difficulty,
        String content,
        boolean isSpoiler
) {
    public Review toEntity(Scenario scenario, User user) {
        return Review.builder()
                .scenario(scenario)
                .user(user)
                .rating(rating)
                .difficulty(difficulty)
                .content(content)
                .spoiler(isSpoiler)
                .deleted(false)
                .build();
    }
}

