package com.ssafy.s14p11a707.security.handler;

import com.ssafy.s14p11a707.auth.service.AuthRedirectService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

/**
 * OAuth2 로그인 실패 처리기
 * <p>
 * 기본 실패 동작({@code /login?error} 리다이렉트)은 이 프로젝트에서 별도 로그인 페이지를 사용하지 않아
 * 브라우저에서 401 JSON이 노출되는 혼동이 생길 수 있으므로, 실패 원인을 로그로 남기고
 * 로그인 시작 시 저장해둔 리다이렉트(상대 경로/allowlist 기반 절대 URL) 또는 기본 리다이렉트로 되돌려 보낸다.
 * </p>
 *
 * @see com.ssafy.s14p11a707.config.SecurityConfig
 * @see AuthRedirectService
 */
@Slf4j
@Component
public class AuthLoginFailureHandler implements AuthenticationFailureHandler {

    private final AuthRedirectService authRedirectService;
    private final String defaultRedirectUrl;

    public AuthLoginFailureHandler(
            AuthRedirectService authRedirectService,
            @Value("${app.auth.default-redirect-url:/swagger-ui/index.html}") String defaultRedirectUrl
    ) {
        this.authRedirectService = authRedirectService;
        this.defaultRedirectUrl = defaultRedirectUrl;
    }

    /**
     * 로그인 실패 시 로그 기록 후 리다이렉트 수행
     * <p>
     * OIDC/OAuth2 플로우에서 실패는 대부분 콜백 이후 토큰 교환/검증 단계에서 발생하므로
     * 원인 파악을 위해 에러 코드/설명을 함께 남긴다.
     * </p>
     *
     * @param request 현재 요청
     * @param response 현재 응답
     * @param exception 인증 실패 예외
     * @throws IOException 리다이렉트 전송 중 I/O 예외 발생 시
     */
    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException {
        String errorCode = "oauth2";
        if (exception instanceof OAuth2AuthenticationException oauth2) {
            errorCode = oauth2.getError().getErrorCode();
            log.error("OAuth2 login failed: code={}, description={}", oauth2.getError().getErrorCode(), oauth2.getError().getDescription(), exception);
        } else {
            log.error("OAuth2 login failed: {}", exception.getMessage(), exception);
        }

        String redirect = authRedirectService.consumeLoginRedirect(request);
        if (!authRedirectService.isSafeRedirect(redirect)) {
            redirect = defaultRedirectUrl;
        }
        if (!authRedirectService.isSafeRedirect(redirect)) {
            redirect = "/swagger-ui/index.html";
        }

        redirect = redirect.trim();

        String encoded = URLEncoder.encode(errorCode, StandardCharsets.UTF_8);
        String target = redirect.contains("?")
                ? redirect + "&loginError=" + encoded
                : redirect + "?loginError=" + encoded;

        response.sendRedirect(target);
    }
}

