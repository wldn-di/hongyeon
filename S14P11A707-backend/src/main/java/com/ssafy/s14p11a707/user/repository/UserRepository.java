package com.ssafy.s14p11a707.user.repository;

import com.ssafy.s14p11a707.user.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * {@link User} 엔티티 영속성 리포지토리
 * <p>
 * 이메일 기반 조회와 소프트 삭제 복구를 제공한다.
 * {@link org.hibernate.annotations.SoftDelete}를 사용해 삭제 플래그 컬럼({@code deleted})을 관리하며,
 * 복구는 네이티브 업데이트 쿼리로 처리한다.
 * </p>
 *
 * @see User
 * @see com.ssafy.s14p11a707.user.service.UserService
 */
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * 이메일로 사용자 조회
     * <p>
     * 주어진 이메일에 해당하는 {@link User}를 조회한다.
     * </p>
     *
     * @param email 정규화된 이메일(예: {@link User#normalizeEmail(String)})
     * @return 사용자 {@link Optional}
     */
    Optional<User> findByEmail(String email);

    /**
     * 소프트 삭제된 사용자 복구
     * <p>
     * 동일 이메일로 소프트 삭제된 레코드가 있을 때 {@code deleted=false}로 되돌린다.
     * </p>
     *
     * @param email 정규화된 이메일(예: {@link User#normalizeEmail(String)})
     * @return 영향을 받은 행(row) 수
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "update users set deleted = false where email = :email", nativeQuery = true)
    int restoreByEmail(@Param("email") String email);
}
