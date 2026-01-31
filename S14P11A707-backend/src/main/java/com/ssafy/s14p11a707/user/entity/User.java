package com.ssafy.s14p11a707.user.entity;

import com.ssafy.s14p11a707.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Table;
import java.util.concurrent.ThreadLocalRandom;
import lombok.Builder;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "users",
        indexes = {
                @Index(name = "uk_users_google_id", columnList = "google_id", unique = true),
                @Index(name = "uk_users_email", columnList = "email", unique = true),
                @Index(name = "uk_users_nickname", columnList = "nickname", unique = true)
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private long id;

    @Column(nullable = false, length = 255)
    private String googleId;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(length = 50)
    private String nickname;

    @Column(nullable = false)
    private long totalPlayTime;

    @Column(nullable = false)
    private int totalScore;

    @Column(nullable = false)
    private int totalClears;

    @Column(nullable = false)
    private int totalAttempts;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Builder
    public User(
            String googleId,
            String email,
            String nickname,
            long totalPlayTime,
            int totalScore,
            int totalClears,
            int totalAttempts,
            UserRole role
    ) {
        this.googleId = googleId;
        this.email = email;
        this.nickname = (nickname == null || nickname.isBlank()) ? defaultNickname() : nickname;
        this.totalPlayTime = totalPlayTime;
        this.totalScore = totalScore;
        this.totalClears = totalClears;
        this.totalAttempts = totalAttempts;
        this.role = role == null ? UserRole.GENERAL : role;
    }

    private static String defaultNickname() {
        return String.valueOf(ThreadLocalRandom.current().nextInt(100_000, 1_000_000));
    }

    public void changeNickname(String nickname) {
        this.nickname = nickname;
    }

    public void changeEmail(String email) {
        this.email = email;
    }

    // 게임 시작 시 호출
    public void incrementTotalAttempts() {
        this.totalAttempts++;
    }

    // 게임 완료 시 호출(첫 클리어)
    public void addFirstClearStats(long playTime, int score) {
        this.totalPlayTime += playTime;
        this.totalScore += score;
        this.totalClears++;
    }

    // 게임 완료 시 호출(재 클리어)
    public void addReClearStats(long playTime, int score) {
        this.totalPlayTime += playTime;
        this.totalScore += score;
    }

    // 게임 실패 시 호출
    public void addPlayTime(long playTime) {
        this.totalPlayTime += playTime;
    }

    public enum UserRole {
        GENERAL,
        ADMIN
    }
}
