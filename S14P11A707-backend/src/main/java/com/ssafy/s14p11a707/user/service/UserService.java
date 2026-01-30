package com.ssafy.s14p11a707.user.service;

import com.ssafy.s14p11a707.user.entity.User;

public interface UserService {

    User upsertByOidc(String rawGoogleId, String rawEmail);

    User changeNickname(long userId, String rawNickname);

    User getById(long userId);
}

