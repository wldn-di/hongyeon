package com.ssafy.s14p11a707.user.service;

import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.repository.UserRepository;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 사용자({@link User}) upsert 애플리케이션 서비스
 * <p>
 * OIDC 로그인 과정에서 전달받은 {@code email}을 기준으로 사용자를 조회하고,
 * 없으면 생성한 뒤 반환한다.
 * </p>
 * <p><b>트랜잭션</b></p>
 * <ul>
 *   <li>클래스 기본은 {@code readOnly=true}로 동작한다.</li>
 *   <li>쓰기 작업(upsert)은 {@link #upsertByOidc(String, String)}에서 별도 트랜잭션으로 수행한다.</li>
 * </ul>
 * <p><b>예외</b></p>
 * <ul>
 *   <li>이메일이 비어 있으면 {@link BaseException}({@link ErrorCode#INVALID_INPUT_VALUE})을 발생시킨다.</li>
 * </ul>
 * <p><b>설계 메모</b></p>
 *
 * @see UserRepository
 * @see com.ssafy.s14p11a707.security.oidc.OidcUserSyncService
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    /**
     * OIDC subject + 이메일 기준 사용자 upsert
     * <p>
     * OIDC subject(= {@code google_id})를 기준으로 사용자 조회 후,
     * 없으면 생성하고 있으면 이메일을 최신 값으로 동기화한다.
     * </p>
     * <p>
     * 본 메서드는 트랜잭션 범위 내에서 실행되며, 예외 발생 시 롤백된다.
     * </p>
     *
     * @param rawGoogleId OIDC subject(= google_id)
     * @param rawEmail OIDC 클레임 등에서 전달받은 원본 이메일
     * @return 조회/생성/복구된 {@link User}
     * @throws BaseException googleId/email이 비어 있는 경우
     */
    @Override
    @Transactional
    public User upsertByOidc(String rawGoogleId, String rawEmail) {
        String googleId = rawGoogleId == null ? null : rawGoogleId.trim();
        if (!StringUtils.hasText(googleId)) {
            throw new BaseException(ErrorCode.INVALID_INPUT_VALUE);
        }

        String email = rawEmail == null ? null : rawEmail.trim().toLowerCase(Locale.ROOT);
        if (!StringUtils.hasText(email)) {
            throw new BaseException(ErrorCode.INVALID_INPUT_VALUE);
        }

        return userRepository.findByGoogleId(googleId)
                .map(user -> {
                    if (!email.equals(user.getEmail())) {
                        user.changeEmail(email);
                    }
                    return user;
                })
                .orElseGet(() -> createOrGet(googleId, email));
    }

    @Transactional
    public User changeNickname(String rawGoogleId, String rawEmail, String rawNickname) {
        User user = upsertByOidc(rawGoogleId, rawEmail);
        return changeNickname(user, rawNickname);
    }

    @Transactional
    @Override
    public User changeNickname(long userId, String rawNickname) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));
        return changeNickname(user, rawNickname);
    }

    @Override
    public User getById(long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));
    }

    private User changeNickname(User user, String rawNickname) {
        String nickname = rawNickname == null ? null : rawNickname.trim();
        if (!StringUtils.hasText(nickname) || nickname.length() > 50) {
            throw new BaseException(ErrorCode.INVALID_INPUT_VALUE);
        }

        try {
            user.changeNickname(nickname);
            userRepository.flush();
            return user;
        } catch (DataIntegrityViolationException e) {
            throw new BaseException(ErrorCode.NICKNAME_ALREADY_EXISTS, e);
        }
    }

    private User createOrGet(String googleId, String email) {
        try {
            return userRepository.save(User.builder().googleId(googleId).email(email).build());
        } catch (DataIntegrityViolationException e) {
            return userRepository.findByGoogleId(googleId)
                    .orElseThrow(() -> e);
        }
    }
}
