package com.ssafy.s14p11a707.security;

import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class CurrentUserIdResolver {

    private final UserRepository userRepository;

    public long requireUserId(OidcUser oidcUser) {
        if (oidcUser == null) {
            throw new BaseException(ErrorCode.UNAUTHORIZED);
        }

        String googleId = oidcUser.getSubject();
        if (!StringUtils.hasText(googleId)) {
            throw new BaseException(ErrorCode.UNAUTHORIZED);
        }

        return userRepository.findByGoogleId(googleId)
                .map(User::getId)
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));
    }
}
