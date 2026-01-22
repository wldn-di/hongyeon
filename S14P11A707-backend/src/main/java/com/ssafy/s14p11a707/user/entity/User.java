package com.ssafy.s14p11a707.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SoftDelete;
import org.hibernate.annotations.SoftDeleteType;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Cognito 로그인 기반 사용자 엔티티
 * <p>
 * 최소한의 사용자 식별 정보로 {@code email}을 보관하며,
 * 기본 키는 {@link UUID}로 생성한다({@link UuidGenerator}).
 * </p>
 * <p><b>삭제/감사</b></p>
 * <ul>
 *   <li>{@link SoftDelete}로 소프트 삭제를 적용한다.</li>
 *   <li>{@link AuditingEntityListener}로 생성/수정 시각({@link #createdAt}, {@link #updatedAt})을 자동 기록한다.</li>
 * </ul>
 *
 * @see com.ssafy.s14p11a707.user.service.UserService
 * @see com.ssafy.s14p11a707.security.oidc.CognitoOidcUserService
 */
@Getter
@Entity
@Table(
        name = "users",
        indexes = {
                @Index(name = "uk_users_email", columnList = "email", unique = true)
        }
)
@SoftDelete(columnName = "deleted", strategy = SoftDeleteType.DELETED)
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, length = 320)
    private String email;

    @Column(nullable = false, length = 30)
    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;

    /**
     * 이메일로 사용자 생성
     * <p>
     * 이메일은 {@link #normalizeEmail(String)}로 정규화하여 저장한다.
     * </p>
     *
     * @param email 사용자 이메일
     */
    public User(String email) {
        this.email = normalizeEmail(email);
        this.nickname = defaultNickname(this.email);
        this.role = UserRole.GENERAL;
    }

    public static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    @PrePersist
    @PreUpdate
    private void normalize() {
        this.email = normalizeEmail(this.email);
    }

    private static String defaultNickname(String normalizedEmail) {
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            return "user";
        }

        String localPart = normalizedEmail;
        int at = normalizedEmail.indexOf('@');
        if (at > 0) {
            localPart = normalizedEmail.substring(0, at);
        }

        String candidate = localPart.isBlank() ? "user" : localPart;
        return candidate.length() <= 30 ? candidate : candidate.substring(0, 30);
    }

    public enum UserRole {
        GENERAL,
        ADMIN
    }
}
