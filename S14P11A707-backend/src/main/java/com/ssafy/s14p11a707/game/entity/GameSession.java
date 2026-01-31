package com.ssafy.s14p11a707.game.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.common.entity.BaseEntity;
import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Duration;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@Entity
@Table(name = "game_sessions")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GameSession extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "scenario_id", nullable = false)
    private Scenario scenario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    private Integer currentFloor;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "visited_floors", columnDefinition = "jsonb")
    private JsonNode visitedFloorsJson;

    private Integer health;

    private Integer submitAttempts;

    @Column(name = "is_first_play")
    private Boolean hasCleared;

    private Integer finalScore;

    @Enumerated(EnumType.STRING)
    @Column(length = 5)
    private RankGrade rankGrade;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode resultReportJson;

    @Column(name = "submitted_motive_embedding", columnDefinition = "text")
    private String submittedMotiveEmbedding;

    private Instant startedAt;

    private Instant completedAt;

    private Long playTime;

    private Instant lastSavedAt;

    private Instant expiresAt;

    @Builder
    public GameSession(
            Scenario scenario,
            User user,
            Status status,
            Integer currentFloor,
            JsonNode visitedFloorsJson,
            Integer health,
            Integer submitAttempts,
            Boolean hasCleared,
            Integer finalScore,
            RankGrade rankGrade,
            JsonNode resultReportJson,
            String submittedMotiveEmbedding,
            Instant startedAt,
            Instant completedAt,
            Long playTime,
            Instant lastSavedAt,
            Instant expiresAt
    ) {
        this.scenario = scenario;
        this.user = user;
        this.status = status == null ? Status.PLAYING : status;
        this.currentFloor = currentFloor;
        this.visitedFloorsJson = visitedFloorsJson;
        this.health = health;
        this.submitAttempts = submitAttempts;
        this.hasCleared = hasCleared;
        this.finalScore = finalScore;
        this.rankGrade = rankGrade;
        this.resultReportJson = resultReportJson;
        this.submittedMotiveEmbedding = submittedMotiveEmbedding;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.playTime = playTime;
        this.lastSavedAt = lastSavedAt;
        this.expiresAt = expiresAt;
    }

    // 중간저장
    public void updateProgress() {
        Instant now = Instant.now();

        if (this.lastSavedAt != null) {
            long delta = Duration.between(this.lastSavedAt, now).getSeconds();
            // 10분 이상 공백이면 이탈로 간주
            if (delta < 600) {
                this.playTime = (this.playTime != null ? this.playTime : 0) + delta;
            }
        }

        this.lastSavedAt = now;
        this.expiresAt = now.plusSeconds(7 * 24 * 60 * 60);
    }

    // 층이동
    public void moveFloor(int floor, JsonNode visitedFloorsJson) {
        this.currentFloor = floor;
        this.visitedFloorsJson = visitedFloorsJson;
        updateProgress();
    }

    // 게임실패처리
    public void failGame() {
        this.status = Status.FAILED;
        this.completedAt = Instant.now();
    }
    // 게임성공처리
    public void completeGame(int finalScore, RankGrade rankGrade) {
        this.status = Status.COMPLETED;
        this.finalScore = finalScore;
        this.rankGrade = rankGrade;
        this.hasCleared = true;
        this.completedAt = Instant.now();
        this.expiresAt = null; // 완료된 세션은 만료되지 않음
    }
    // 최종제출횟수 증가
    public void incrementSubmitAttempts() {
        this.submitAttempts = (this.submitAttempts == null ? 0 : this.submitAttempts) + 1;
    }

    // 세션 초기화
    public void reset(JsonNode initialVisitedFloors) {
        this.status = Status.PLAYING;
        this.currentFloor = 1;
        this.visitedFloorsJson = initialVisitedFloors;
        this.health = 100;
        this.submitAttempts = 0;
        this.finalScore = null;
        this.rankGrade = null;
        this.submittedMotiveEmbedding = null;
        this.startedAt = Instant.now();
        this.completedAt = null;
        this.playTime = 0L;
        this.lastSavedAt = Instant.now();
        this.expiresAt = Instant.now().plusSeconds(7 * 24 * 60 * 60);
    }

    // 수사보고서 저장
    public void saveReport(JsonNode report){
        this.resultReportJson = report;
    }

    public enum Status {
        PLAYING,
        COMPLETED,
        FAILED,
    }

    public enum RankGrade {
        S,
        A,
        B,
        C,
        D,
        F
    }
}
