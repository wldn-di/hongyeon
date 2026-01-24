package com.ssafy.s14p11a707.auth.dto;

import com.ssafy.s14p11a707.user.entity.User;

public record AuthMeResponse(
        long userId,
        String email,
        String nickname,
        User.UserRole role
) {

    public static AuthMeResponse from(User user) {
        if (user == null) return null;

        return new AuthMeResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getRole()
        );
    }
}
