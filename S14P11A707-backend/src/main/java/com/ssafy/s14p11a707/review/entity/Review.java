package com.ssafy.s14p11a707.review.entity;

import com.ssafy.s14p11a707.common.entity.BaseEntity;
import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
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
        name = "reviews",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_reviews_scenario_user", columnNames = {"scenario_id", "user_id"})
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review extends BaseEntity {

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private GameSession session;

    @Column(nullable = false)
    private int rating;

    @Column(nullable = false)
    private int difficulty;

    @Lob
    private String content;

    @Column(name = "is_spoiler", nullable = false)
    private boolean spoiler;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted;

    @Builder
    public Review(
            Scenario scenario,
            User user,
            GameSession session,
            int rating,
            int difficulty,
            String content,
            boolean spoiler,
            boolean deleted
    ) {
        this.scenario = scenario;
        this.user = user;
        this.session = session;
        this.rating = rating;
        this.difficulty = difficulty;
        this.content = content;
        this.spoiler = spoiler;
        this.deleted = deleted;
    }

    public void updateContent(String content) {
        if (content != null && !content.isBlank()) {
            this.content = content.trim();
        }
    }

    public void markDeleted() {
        this.deleted = true;
    }
}

