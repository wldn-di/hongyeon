package com.ssafy.s14p11a707.auth.service;

import com.ssafy.s14p11a707.auth.dto.AuthMeResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.net.URI;
import org.springframework.security.core.Authentication;

public interface AuthService {

    enum RefreshResult {
        SUCCESS,
        UNAUTHORIZED
    }

    URI startLogin(String redirect, HttpServletRequest request);

    AuthMeResponse me(long userId);

    RefreshResult refresh(HttpServletRequest request, HttpServletResponse response, Authentication authentication);
}

