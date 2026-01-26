package com.ssafy.s14p11a707.game.entity;

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
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "scenario_rankings",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_scenario_rankings_scenario_user", columnNames = {"scenario_id", "user_id"})
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ScenarioRanking {

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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private GameSession session;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false)
    private long clearTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 5)
    private RankGrade rankGrade;

    @Builder
    public ScenarioRanking(
            Scenario scenario,
            User user,
            GameSession session,
            int score,
            long clearTime,
            RankGrade rankGrade
    ) {
        this.scenario = scenario;
        this.user = user;
        this.session = session;
        this.score = score;
        this.clearTime = clearTime;
        this.rankGrade = rankGrade;
    }

    public enum RankGrade {
        S,
        A,
        B,
        C,
        F
    }
}
