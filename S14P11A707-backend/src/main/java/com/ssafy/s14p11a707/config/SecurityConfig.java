package com.ssafy.s14p11a707.config;

import com.ssafy.s14p11a707.security.oidc.OidcUserSyncService;
import com.ssafy.s14p11a707.security.handler.AuthLoginFailureHandler;
import com.ssafy.s14p11a707.security.handler.AuthLoginSuccessHandler;
import com.ssafy.s14p11a707.security.handler.RestAccessDeniedHandler;
import com.ssafy.s14p11a707.security.handler.RestAuthenticationEntryPoint;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * 세션 기반 Keycloak(OIDC) OAuth2 로그인 보안 설정
 * <p>
 * Spring Security의 {@code oauth2Login}을 사용해 Keycloak(OIDC)로 인증을 위임하고,
 * 로그인 성공 시 {@link AuthLoginSuccessHandler}로 애플리케이션 세션 기반 리다이렉트를 수행
 * </p>
 * <p>
 * 인증이 필요한 요청은 기본적으로 {@code authenticated()}로 보호하며,
 * API 요청에 대해서는 리다이렉트 대신 JSON 형태의 401/403을 반환하도록
 * {@link RestAuthenticationEntryPoint}, {@link RestAccessDeniedHandler}를 사용
 * </p>
 * <p><b>설계 메모</b></p>
 * <ul>
 *   <li>세션 정책은 {@link SessionCreationPolicy#IF_REQUIRED}로 설정하여 OAuth2 로그인 플로우에 필요한 세션만 생성</li>
 *   <li>인가 요청은 {@link #authorizationRequestResolver(ClientRegistrationRepository)}에서 PKCE와 {@code kc_idp_hint=google}을 자동 적용</li>
 * </ul>
 *
 * @see OidcUserSyncService
 * @see AuthLoginSuccessHandler
 * @see RestAuthenticationEntryPoint
 * @see RestAccessDeniedHandler
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String[] SWAGGER_WHITELIST = {
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };

    private static final String[] PUBLIC_WHITELIST = {
            "/error",
            "/actuator/health/**",
            "/actuator/info",
            "/oauth2/**",
            "/login/oauth2/**",
            "/api/auth/login",
            "/concurrency-test.html"
    };

    private static final String[] PUBLIC_GET_WHITELIST = {
            // Scenarios: list (read-only)
            "/api/scenarios",
            "/api/scenarios/",
            // Scenarios: top 10 (read-only)
            "/api/scenarios/top/rating",
            "/api/scenarios/top/play-count",
            // Scenarios: detail and sub-resources (read-only)
            "/api/scenarios/*",
            "/api/scenarios/*/status",
            "/api/scenarios/*/rankings",
            "/api/scenarios/*/victim",
            "/api/scenarios/*/suspects",
            // Reviews: list by scenario (read-only)
            "/api/reviews/*/reviews",
            // Global rankings (read-only)
            "/api/rankings",
            // Scenarios: detail and sub-resources (read-only)
            "/api/scenarios/*",
            "/api/scenarios/*/status",
            "/api/scenarios/*/rankings",
            "/api/scenarios/*/victim",
            "/api/scenarios/*/suspects",
    };

    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;
    private final ClientRegistrationRepository clientRegistrationRepository;
    private final OidcUserSyncService oidcUserSyncService;
    private final AuthLoginSuccessHandler authLoginSuccessHandler;
    private final AuthLoginFailureHandler authLoginFailureHandler;

    /**
     * Spring Security 필터 체인 생성
     * <p>
     * 세션 기반(BFF) 인증을 전제로, API 요청은 리다이렉트 대신 JSON 401/403을 반환하도록 설정하고
     * OAuth2 로그인(Keycloak)을 연결한다.
     * </p>
     * <p><b>OAuth2 로그인 연결(주요 라인 설명)</b></p>
     * <ul>
     *   <li>{@code http.oauth2Login(...)}:
     *   OAuth2/OIDC 로그인 플로우(인가 요청, 콜백 처리, 토큰 교환, 사용자 로드)를 수행하는 필터들을 활성화한다.</li>
     *   <li>{@code authorizationEndpoint(...)}:
     *   {@code /oauth2/authorization/{registrationId}}로 시작되는 인가 요청을 커스터마이징한다.</li>
     *   <li>{@code authorizationRequestResolver(...)}:
     *   PKCE 적용 + {@code kc_idp_hint=google} 파라미터 추가로 “즉시 Google로 보내기” 동작을 구현한다.</li>
     *   <li>{@code userInfoEndpoint(...).oidcUserService(...)}:
     *   OIDC 사용자 로딩 시 {@link OidcUserSyncService}를 사용해 {@code email} 기반 사용자 upsert를 수행한다.</li>
     *   <li>{@code redirectionEndpoint(...).baseUri("/oauth2/code/*")}:
     *   콜백 URL을 {@code /oauth2/code/keycloak}로 사용하기 위해 리다이렉션 엔드포인트 패턴을 맞춘다.</li>
     *   <li>{@code successHandler(authLoginSuccessHandler)}:
     *   로그인 성공 후 {@link AuthLoginSuccessHandler}에서 세션에 저장된 리다이렉트 경로로 이동시킨다.</li>
     * </ul>
     *
     * @param http 보안 구성을 위한 {@link HttpSecurity}
     * @return 구성된 {@link SecurityFilterChain}
     * @throws Exception 보안 설정 구성 중 예외 발생 시
     */
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(SWAGGER_WHITELIST).permitAll()
                        .requestMatchers(PUBLIC_WHITELIST).permitAll()
                        .requestMatchers("/api/v1/**").permitAll()
                        .requestMatchers(HttpMethod.GET, PUBLIC_GET_WHITELIST).permitAll()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exceptionHandling -> exceptionHandling
                        .authenticationEntryPoint(restAuthenticationEntryPoint)
                        .accessDeniedHandler(restAccessDeniedHandler)
                );

        http.logout(logout -> logout
                .logoutRequestMatcher(PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.POST, "/api/auth/logout"))
                .deleteCookies("SESSION", "JSESSIONID")
                .logoutSuccessHandler((request, response, authentication) -> response.setStatus(204))
        );

        http.oauth2Login(oauth2 -> oauth2
                .authorizationEndpoint(authorization -> authorization
                        .authorizationRequestResolver(authorizationRequestResolver(clientRegistrationRepository))
                )
                .userInfoEndpoint(userInfo -> userInfo
                        .oidcUserService(oidcUserSyncService)
                )
                .redirectionEndpoint(redirection -> redirection
                        .baseUri("/oauth2/code/*")
                )
                .successHandler(authLoginSuccessHandler)
                .failureHandler(authLoginFailureHandler)
        );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origin-patterns:http://localhost:*,http://127.0.0.1:*}") String allowedOriginPatterns
    ) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowCredentials(true);
        configuration.setAllowedOriginPatterns(splitCsv(allowedOriginPatterns));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private static List<String> splitCsv(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }

    /**
     * OAuth2 인가 요청 리졸버 생성
     * <p>
     * 기본 인가 엔드포인트({@code /oauth2/authorization})를 기준으로
     * {@link DefaultOAuth2AuthorizationRequestResolver}를 생성한 뒤,
     * PKCE({@link OAuth2AuthorizationRequestCustomizers#withPkce()}) 적용과 함께
     * Keycloak이 Google IdP로 즉시 이동하도록 {@code kc_idp_hint=google} 파라미터를 추가한다.
     * </p>
     *
     * @param clientRegistrationRepository OAuth2 클라이언트 등록 저장소
     * @return 커스터마이징된 {@link OAuth2AuthorizationRequestResolver}
     */
    @Bean
    public OAuth2AuthorizationRequestResolver authorizationRequestResolver(
            ClientRegistrationRepository clientRegistrationRepository
    ) {
        DefaultOAuth2AuthorizationRequestResolver resolver =
                new DefaultOAuth2AuthorizationRequestResolver(clientRegistrationRepository, "/oauth2/authorization");

        resolver.setAuthorizationRequestCustomizer(customizer -> {
            OAuth2AuthorizationRequestCustomizers.withPkce().accept(customizer);
            customizer.additionalParameters(params -> params.put("kc_idp_hint", "google"));
        });
        return resolver;
    }

}
