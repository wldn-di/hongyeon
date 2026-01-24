package com.ssafy.s14p11a707.game.entity;

import com.ssafy.s14p11a707.scenario.entity.Scenario;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "scenario_rankings")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ScenarioRanking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "scenario_id", nullable = false)
    private Scenario scenario;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false, unique = true)
    private GameSession session;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false)
    private long clearTime;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private RankGrade rankGrade;

    @Builder
    public ScenarioRanking(
            Scenario scenario,
            GameSession session,
            int score,
            long clearTime,
            RankGrade rankGrade
    ) {
        this.scenario = scenario;
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
        D,
        F
    }
}
