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
    @Column(nullable = false, length = 30)
    private Status status;

    @Column(name = "is_success", nullable = false)
    private boolean success;

    @Column(nullable = false)
    private int finalScore;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private RankGrade rankGrade;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode sessionProgressJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode resultReportJson;

    private Instant startedAt;

    private Instant completedAt;

    @Column(nullable = false)
    private long playTime;

    private Instant lastSavedAt;

    @Builder
    public GameSession(
            Scenario scenario,
            User user,
            Status status,
            boolean success,
            int finalScore,
            RankGrade rankGrade,
            JsonNode sessionProgressJson,
            JsonNode resultReportJson,
            Instant startedAt,
            Instant completedAt,
            long playTime,
            Instant lastSavedAt
    ) {
        this.scenario = scenario;
        this.user = user;
        this.status = status == null ? Status.IN_PROGRESS : status;
        this.success = success;
        this.finalScore = finalScore;
        this.rankGrade = rankGrade;
        this.sessionProgressJson = sessionProgressJson;
        this.resultReportJson = resultReportJson;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.playTime = playTime;
        this.lastSavedAt = lastSavedAt;
    }

    public enum Status {
        CREATED,
        IN_PROGRESS,
        COMPLETED,
        ABANDONED
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
