package com.ssafy.s14p11a707.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.AuthorizedClientServiceOAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientProvider;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientProviderBuilder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;

/**
 * OAuth2 토큰 갱신 지원을 위한 클라이언트 매니저 설정
 * <p>
 * {@link OAuth2AuthorizedClientManager}를 구성해 Authorization Code 흐름으로 발급된 토큰에 대해
 * Refresh Token 기반 갱신을 시도할 수 있도록 한다.
 * </p>
 * <p><b>설계 메모</b></p>
 * <ul>
 *   <li>본 설정은 {@link ClientRegistrationRepository}, {@link OAuth2AuthorizedClientService} 구성을 전제로 한다.</li>
 *   <li>주 사용처는 Auth API의 Refresh 동작({@link com.ssafy.s14p11a707.auth.service.AuthService#refresh})이다.</li>
 * </ul>
 *
 * @see OAuth2AuthorizedClientManager
 * @see AuthorizedClientServiceOAuth2AuthorizedClientManager
 */
@Configuration(proxyBeanMethods = false)
public class OAuth2ClientConfig {

    /**
     * OAuth2AuthorizedClientManager 빈 생성
     * <p>
     * {@link OAuth2AuthorizedClientProviderBuilder}로 {@code authorization_code} 및 {@code refresh_token}
     * 지원을 켠 {@link OAuth2AuthorizedClientProvider}를 구성하고,
     * {@link AuthorizedClientServiceOAuth2AuthorizedClientManager}에 주입한다.
     * </p>
     *
     * @param clientRegistrationRepository OAuth2 클라이언트 등록 저장소
     * @param authorizedClientService 인가된 클라이언트를 저장/조회하는 서비스
     * @return 구성된 {@link OAuth2AuthorizedClientManager}
     */
    @Bean
    public OAuth2AuthorizedClientManager oauth2AuthorizedClientManager(
            ClientRegistrationRepository clientRegistrationRepository,
            OAuth2AuthorizedClientService authorizedClientService
    ) {
        OAuth2AuthorizedClientProvider authorizedClientProvider = OAuth2AuthorizedClientProviderBuilder.builder()
                .authorizationCode()
                .refreshToken()
                .build();

        AuthorizedClientServiceOAuth2AuthorizedClientManager manager =
                new AuthorizedClientServiceOAuth2AuthorizedClientManager(clientRegistrationRepository, authorizedClientService);
        manager.setAuthorizedClientProvider(authorizedClientProvider);
        return manager;
    }
}
