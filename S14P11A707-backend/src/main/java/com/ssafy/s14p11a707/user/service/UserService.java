package com.ssafy.s14p11a707.user.service;

import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 사용자({@link User}) upsert 애플리케이션 서비스
 * <p>
 * Cognito OIDC 로그인 과정에서 전달받은 {@code email}을 기준으로 사용자를 조회하고,
 * 없으면 생성하거나 소프트 삭제된 레코드를 복구한 뒤 반환한다.
 * </p>
 * <p><b>트랜잭션</b></p>
 * <ul>
 *   <li>클래스 기본은 {@code readOnly=true}로 동작한다.</li>
 *   <li>쓰기 작업(upsert)은 {@link #upsertByEmail(String)}에서 별도 트랜잭션으로 수행한다.</li>
 * </ul>
 * <p><b>예외</b></p>
 * <ul>
 *   <li>이메일이 비어 있으면 {@link BaseException}({@link ErrorCode#INVALID_INPUT_VALUE})을 발생시킨다.</li>
 * </ul>
 * <p><b>설계 메모</b></p>
 * <ul>
 *   <li>이메일은 {@link User#normalizeEmail(String)}로 정규화하여 저장/조회한다.</li>
 *   <li>동시성으로 인해 insert가 충돌하면 {@link DataIntegrityViolationException}을 기반으로 복구/재조회한다.</li>
 * </ul>
 *
 * @see UserRepository
 * @see com.ssafy.s14p11a707.security.oidc.CognitoOidcUserService
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    /**
     * 이메일 기준 사용자 upsert
     * <p>
     * 입력 이메일을 정규화한 뒤 {@link UserRepository#findByEmail(String)}로 조회하고,
     * 존재하지 않으면 새 {@link User}를 저장한다.
     * 저장 시 유니크 제약 등으로 충돌하면 소프트 삭제 복구({@link UserRepository#restoreByEmail(String)})를 시도한 뒤 재조회한다.
     * </p>
     * <p>
     * 본 메서드는 트랜잭션 범위 내에서 실행되며, 예외 발생 시 롤백된다.
     * </p>
     *
     * @param rawEmail Cognito 클레임 등에서 전달받은 원본 이메일
     * @return 조회/생성/복구된 {@link User}
     * @throws BaseException 이메일이 비어 있는 경우
     */
    @Transactional
    public User upsertByEmail(String rawEmail) {
        String email = User.normalizeEmail(rawEmail);
        if (!StringUtils.hasText(email)) {
            throw new BaseException(ErrorCode.INVALID_INPUT_VALUE);
        }

        return userRepository.findByEmail(email)
                .orElseGet(() -> createOrRestore(email));
    }

    private User createOrRestore(String email) {
        try {
            return userRepository.save(new User(email));
        } catch (DataIntegrityViolationException e) {
            userRepository.restoreByEmail(email);
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> e);
        }
    }
}
