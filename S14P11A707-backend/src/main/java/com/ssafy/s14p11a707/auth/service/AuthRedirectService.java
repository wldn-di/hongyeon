package com.ssafy.s14p11a707.auth.service;

import jakarta.servlet.http.HttpServletRequest;

public interface AuthRedirectService {

    void storeLoginRedirect(HttpServletRequest request, String redirect);

    String consumeLoginRedirect(HttpServletRequest request);

    boolean isSafeRedirect(String redirect);

    boolean isSafeRelativeRedirect(String redirect);
}

