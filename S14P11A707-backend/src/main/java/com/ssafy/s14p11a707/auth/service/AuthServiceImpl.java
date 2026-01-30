package com.ssafy.s14p11a707.auth.service;

import com.ssafy.s14p11a707.auth.dto.AuthMeResponse;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.stereotype.Service;

/**
 * Keycloak(OIDC) OAuth2 로그인 BFF 애플리케이션 서비스
 * <p>
 * {@link com.ssafy.s14p11a707.auth.api.AuthApi}에서 호출되며,
 * 로그인 시작(인가 엔드포인트로 리다이렉트), 현재 사용자 조회, (선택) 토큰 갱신을 담당한다.
 * </p>
 * <p><b>설계 메모</b></p>
 * <ul>
 *   <li>컨트롤러는 요청/응답만 다루고, 인증 플로우 관련 처리는 본 서비스로 위임한다.</li>
 *   <li>로그인 후 이동 경로는 {@link AuthRedirectService}로 세션에 저장/소비한다.</li>
 * </ul>
 *
 * @see AuthRedirectService
 * @see com.ssafy.s14p11a707.config.OAuth2ClientConfig
 */
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String REGISTRATION_ID = "keycloak";

    private final AuthRedirectService authRedirectService;
    private final OAuth2AuthorizedClientManager authorizedClientManager;
    private final UserService userService;

    /**
     * OAuth2 로그인 시작 URL 반환
     * <p>
     * 프론트가 요청한 리다이렉트 경로를 {@link AuthRedirectService}에 저장한 뒤,
     * Spring Security의 기본 인가 시작 엔드포인트({@code /oauth2/authorization/keycloak})로 이동할 URI를 반환한다.
     * </p>
     *
     * @param redirect 로그인 성공 후 이동할 경로/URL(예: {@code /swagger-ui/index.html}, {@code https://hongyeon.cloud-ip.cc/})
     * @param request 현재 요청
     * @return 인가 시작 엔드포인트로의 {@link URI}
     */
    @Override
    public URI startLogin(String redirect, HttpServletRequest request) {
        authRedirectService.storeLoginRedirect(request, redirect);
        return URI.create("/oauth2/authorization/" + REGISTRATION_ID);
    }

    /**
     * 세션 인증된 사용자 기반 내 정보 응답 생성
     *
     * @param userId 현재 로그인한 사용자 ID
     * @return 인증 주체 기반의 {@link AuthMeResponse}
     */
    @Override
    public AuthMeResponse me(long userId) {
        User user = userService.getById(userId);
        return AuthMeResponse.from(user);
    }

    @Override
    public RefreshResult refresh(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        // 1) authorize() 호출에 필요한 컨텍스트 구성
        // - clientRegistrationId: 어떤 OAuth2 클라이언트 설정을 쓸지(keycloak)
        // - principal(Authentication): "누가" 요청했는지(세션/인증 정보)로 기존 Authorized Client를 조회/갱신
        // - request/response: 세션 기반 저장소 사용 시 Authorized Client 로드/저장에 필요할 수 있음
        OAuth2AuthorizeRequest authorizeRequest = OAuth2AuthorizeRequest.withClientRegistrationId(REGISTRATION_ID)
                .principal(authentication)
                .attribute(HttpServletRequest.class.getName(), request)
                .attribute(HttpServletResponse.class.getName(), response)
                .build();

        // 2) 재-인가(authorize) 실행
        // - access token이 유효하면 기존 client를 반환할 수 있음
        // - 만료 등으로 갱신이 필요하면 refresh token 기반으로 갱신을 시도하고 갱신된 client를 반환
        OAuth2AuthorizedClient client = authorizedClientManager.authorize(authorizeRequest);
        if (client == null) {
            // 3) 갱신 실패: 세션이 없거나, 저장된 Authorized Client/refresh token이 없거나, refresh가 거부된 케이스
            return RefreshResult.UNAUTHORIZED;
        }

        // 4) 갱신 성공(또는 갱신 불필요): 이후 요청부터는 갱신된 토큰이 저장소에 반영될 수 있음
        return RefreshResult.SUCCESS;
    }
}
