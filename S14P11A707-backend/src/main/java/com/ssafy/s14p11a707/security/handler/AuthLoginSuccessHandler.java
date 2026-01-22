package com.ssafy.s14p11a707.security.handler;

import com.ssafy.s14p11a707.auth.service.AuthRedirectService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

/**
 * OAuth2 로그인 성공 후 리다이렉트 처리기
 * <p>
 * {@link com.ssafy.s14p11a707.config.SecurityConfig}의 {@code oauth2Login().successHandler(...)}에 연결되어,
 * 로그인 성공 시 세션에 저장해둔 리다이렉트 경로를 꺼내 최종 사용자 에이전트(브라우저)를 이동시킨다.
 * </p>
 * <p><b>보안</b></p>
 * <ul>
 *   <li>{@link AuthRedirectService#isSafeRedirect(String)}로 오픈 리다이렉트를 방지한다.</li>
 * </ul>
 *
 * @see AuthRedirectService
 */
@Component
public class AuthLoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthRedirectService authRedirectService;
    private final String defaultRedirectUrl;

    public AuthLoginSuccessHandler(
            AuthRedirectService authRedirectService,
            @Value("${app.auth.default-redirect-url:/swagger-ui/index.html}") String defaultRedirectUrl
    ) {
        this.authRedirectService = authRedirectService;
        this.defaultRedirectUrl = defaultRedirectUrl;
    }

    /**
     * 로그인 성공 후 리다이렉트 수행
     * <p>
     * {@link AuthRedirectService}에 저장된 리다이렉트(상대 경로/allowlist 기반 절대 URL)가 있으면 해당 경로로 이동시키고,
     * 없거나 검증에 실패하면 {@code app.auth.default-redirect-url}로 이동시킨다.
     * </p>
     *
     * @param request 현재 요청
     * @param response 현재 응답
     * @param authentication 인증 성공한 사용자 정보
     * @throws IOException 리다이렉트 전송 중 I/O 예외 발생 시
     */
    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        String redirect = authRedirectService.consumeLoginRedirect(request);
        String target = authRedirectService.isSafeRedirect(redirect) ? redirect.trim() : defaultRedirectUrl;
        if (!authRedirectService.isSafeRedirect(target)) {
            target = "/swagger-ui/index.html";
        }

        response.sendRedirect(target.trim());
    }
}
