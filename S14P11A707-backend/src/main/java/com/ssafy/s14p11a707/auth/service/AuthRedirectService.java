package com.ssafy.s14p11a707.auth.service;

import com.ssafy.s14p11a707.security.handler.AuthLoginSuccessHandler;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.net.URI;
import java.util.Arrays;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

/**
 * 로그인 리다이렉트 경로 세션 관리 서비스
 * <p>
 * {@link AuthService}가 로그인 시작 시 저장한 “로그인 성공 후 이동 경로”를
 * {@link AuthLoginSuccessHandler}가 소비하여 최종 리다이렉트를 수행할 수 있도록 한다.
 * </p>
 * <p><b>보안</b></p>
 * <ul>
 *   <li>오픈 리다이렉트 방지를 위해 상대 경로 + allowlist 기반 절대 URL만 허용한다.</li>
 * </ul>
 * <p><b>설계 메모</b></p>
 * <ul>
 *   <li>세션 키는 내부 상수({@code LOGIN_REDIRECT_SESSION_KEY})로 고정하여 클래스 간 결합을 줄인다.</li>
 * </ul>
 *
 * @see AuthService
 * @see AuthLoginSuccessHandler
 */
@Service
public class AuthRedirectService {

    private static final String LOGIN_REDIRECT_SESSION_KEY = AuthRedirectService.class.getName() + ".loginRedirect";

    private record Origin(String scheme, String host, int port) {
    }

    private final Set<Origin> allowedRedirectOrigins;

    public AuthRedirectService(
            @Value("${app.auth.allowed-redirect-origins:}") String allowedRedirectOriginsCsv
    ) {
        this.allowedRedirectOrigins = parseAllowedOrigins(allowedRedirectOriginsCsv);
    }

    /**
     * 로그인 성공 후 이동 경로를 세션에 저장
     * <p>
     * {@link #isSafeRedirect(String)} 검증을 통과한 경우에만 세션에 저장한다.
     * </p>
     *
     * @param request 현재 요청
     * @param redirect 로그인 성공 후 이동할 경로/URL(예: {@code /swagger-ui/index.html}, {@code https://hongyeon.cloud-ip.cc/})
     */
    public void storeLoginRedirect(HttpServletRequest request, String redirect) {
        if (!isSafeRedirect(redirect)) return;

        request.getSession(true).setAttribute(LOGIN_REDIRECT_SESSION_KEY, redirect.trim());
    }

    /**
     * 세션에서 로그인 리다이렉트 경로를 꺼내고 제거
     * <p>
     * 한 번 소비하면 세션에서 즉시 제거하여 재사용을 방지한다.
     * </p>
     *
     * @param request 현재 요청
     * @return 저장된 리다이렉트 상대 경로, 없으면 {@code null}
     */
    public String consumeLoginRedirect(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;


        Object value = session.getAttribute(LOGIN_REDIRECT_SESSION_KEY);
        session.removeAttribute(LOGIN_REDIRECT_SESSION_KEY);
        return value instanceof String s ? s : null;
    }

    /**
     * 오픈 리다이렉트 방지를 위한 리다이렉트 검증
     * <ul>
     *   <li>상대 경로: {@link #isSafeRelativeRedirect(String)}</li>
     *   <li>절대 URL: allowlist 기반 origin 검증</li>
     * </ul>
     */
    public boolean isSafeRedirect(String redirect) {
        if (isSafeRelativeRedirect(redirect)) {
            return true;
        }
        return isSafeAbsoluteRedirect(redirect);
    }

    /**
     * 오픈 리다이렉트 방지를 위한 상대 경로 검증
     */
    public boolean isSafeRelativeRedirect(String redirect) {
        if (redirect == null || redirect.isBlank()) return false;
        String trimmed = redirect.trim();
        if (!trimmed.startsWith("/")) return false;
        if (trimmed.startsWith("//")) return false;
        if (trimmed.contains("\\")) return false;

        return !containsHeaderBreakingChars(trimmed);
    }

    private boolean isSafeAbsoluteRedirect(String redirect) {
        if (redirect == null || redirect.isBlank()) return false;
        if (allowedRedirectOrigins.isEmpty()) return false;

        String trimmed = redirect.trim();
        if (containsHeaderBreakingChars(trimmed)) return false;

        URI uri;
        try {
            uri = URI.create(trimmed);
        } catch (IllegalArgumentException e) {
            return false;
        }

        if (!uri.isAbsolute()) return false;
        if (uri.getUserInfo() != null) return false;

        String scheme = uri.getScheme();
        if (scheme == null) return false;
        scheme = scheme.toLowerCase(Locale.ROOT);
        if (!scheme.equals("http") && !scheme.equals("https")) return false;

        String host = uri.getHost();
        if (host == null || host.isBlank()) return false;

        int port = effectivePort(uri);
        if (port < 0) return false;

        Origin origin = new Origin(scheme, host.toLowerCase(Locale.ROOT), port);
        return allowedRedirectOrigins.contains(origin);
    }

    private static int effectivePort(URI uri) {
        int port = uri.getPort();
        if (port != -1) return port;

        String scheme = uri.getScheme();
        if (scheme == null) return -1;
        if ("https".equalsIgnoreCase(scheme)) return 443;
        if ("http".equalsIgnoreCase(scheme)) return 80;
        return -1;
    }

    private static boolean containsHeaderBreakingChars(String value) {
        return value.indexOf('\r') >= 0 || value.indexOf('\n') >= 0 || value.indexOf('\0') >= 0;
    }

    private static Set<Origin> parseAllowedOrigins(String csv) {
        if (csv == null || csv.isBlank()) {
            return Set.of();
        }

        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(AuthRedirectService::parseOrigin)
                .filter(Objects::nonNull)
                .collect(Collectors.toUnmodifiableSet());
    }

    private static Origin parseOrigin(String value) {
        URI uri;
        try {
            uri = URI.create(value);
        } catch (IllegalArgumentException e) {
            return null;
        }

        if (!uri.isAbsolute()) return null;
        if (uri.getUserInfo() != null) return null;

        String scheme = uri.getScheme();
        if (scheme == null) return null;
        scheme = scheme.toLowerCase(Locale.ROOT);
        if (!scheme.equals("http") && !scheme.equals("https")) return null;

        String host = uri.getHost();
        if (host == null || host.isBlank()) return null;

        int port = effectivePort(uri);
        if (port < 0) return null;

        return new Origin(scheme, host.toLowerCase(Locale.ROOT), port);
    }
}
