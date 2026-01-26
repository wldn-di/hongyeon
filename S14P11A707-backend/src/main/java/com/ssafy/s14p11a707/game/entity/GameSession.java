package com.ssafy.s14p11a707.game.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.common.entity.BaseEntity;
import com.ssafy.s14p11a707.common.jpa.PgVectorConverter;
import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
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
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
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
    private Boolean firstPlay;

    private Integer finalScore;

    @Enumerated(EnumType.STRING)
    @Column(length = 5)
    private RankGrade rankGrade;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode resultReportJson;

    @Convert(converter = PgVectorConverter.class)
    @Column(name = "submitted_motive_embedding", columnDefinition = "vector(1536)")
    private float[] submittedMotiveEmbedding;

    @Convert(converter = PgVectorConverter.class)
    @Column(name = "submitted_cause_of_death_embedding", columnDefinition = "vector(1536)")
    private float[] submittedCauseOfDeathEmbedding;

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
            Boolean firstPlay,
            Integer finalScore,
            RankGrade rankGrade,
            JsonNode resultReportJson,
            float[] submittedMotiveEmbedding,
            float[] submittedCauseOfDeathEmbedding,
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
        this.firstPlay = firstPlay;
        this.finalScore = finalScore;
        this.rankGrade = rankGrade;
        this.resultReportJson = resultReportJson;
        this.submittedMotiveEmbedding = submittedMotiveEmbedding;
        this.submittedCauseOfDeathEmbedding = submittedCauseOfDeathEmbedding;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.playTime = playTime;
        this.lastSavedAt = lastSavedAt;
        this.expiresAt = expiresAt;
    }

    public void updateProgress(int currentFloor, JsonNode visitedFloorsJson, int health, long playTime) {
        this.currentFloor = currentFloor;
        this.visitedFloorsJson = visitedFloorsJson;
        this.health = health;
        this.playTime = playTime;
        this.lastSavedAt = Instant.now();
        this.expiresAt = this.lastSavedAt.plusSeconds(7 * 24 * 60 * 60); // 7일 후 만료
    }

    public void moveFloor(int floor, JsonNode visitedFloorsJson) {
        this.currentFloor = floor;
        this.visitedFloorsJson = visitedFloorsJson;
    }

    public void endGame(Status status, boolean success, int finalScore, RankGrade rankGrade) {
        this.status = status;
        this.finalScore = finalScore;
        this.rankGrade = rankGrade;
        this.completedAt = Instant.now();
    }

    public void markSaved() {
        this.lastSavedAt = Instant.now();
        this.expiresAt = this.lastSavedAt.plusSeconds(7 * 24 * 60 * 60); // 7일 후 만료
    }

    public enum Status {
        PLAYING,
        COMPLETED,
        FAILED,
        ABANDONED
    }

    public enum RankGrade {
        S,
        A,
        B,
        C,
        F
    }
}
