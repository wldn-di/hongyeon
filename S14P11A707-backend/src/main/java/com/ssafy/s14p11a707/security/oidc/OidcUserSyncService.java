package com.ssafy.s14p11a707.security.oidc;

import com.ssafy.s14p11a707.user.service.UserService;
import java.util.ArrayList;
import java.util.Collection;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

/**
 * OIDC 사용자 로드 후 사용자 동기화 서비스
 * <p>
 * {@link OidcUserService}를 확장하여 OIDC 로그인 과정에서 사용자 정보를 로드한 뒤,
 * 핵심 클레임(특히 {@code email})을 이용해 애플리케이션 사용자 레코드를 동기화(upsert)한다.
 * </p>
 * <p><b>예외</b></p>
 * <ul>
 *   <li>{@code email} 클레임이 누락된 경우 {@link OAuth2AuthenticationException}을 발생시켜 인증을 중단한다.</li>
 * </ul>
 *
 * @see com.ssafy.s14p11a707.config.SecurityConfig
 * @see UserService
 */
@Service
@RequiredArgsConstructor
public class OidcUserSyncService extends OidcUserService {

    private final UserService userService;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);

        String email = oidcUser.getEmail();
        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("invalid_token", "email claim is missing", null),
                    "email claim is missing"
            );
        }

        String subject = oidcUser.getSubject();
        var user = userService.upsertByOidc(subject, email);

        Collection<GrantedAuthority> mappedAuthorities = new ArrayList<>(oidcUser.getAuthorities());
        mappedAuthorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

        return new DefaultOidcUser(
                mappedAuthorities,
                oidcUser.getIdToken(),
                oidcUser.getUserInfo(),
                IdTokenClaimNames.SUB
        );
    }
}
