package com.ssafy.s14p11a707.game.entity;

import com.ssafy.s14p11a707.scenario.entity.Clue;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "discovered_clues",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_discovered_clues_session_clue", columnNames = {"session_id", "clue_id"})
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DiscoveredClue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private GameSession session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "clue_id", nullable = false)
    private Clue clue;

    private Instant discoveredAt;

    @Builder
    public DiscoveredClue(
            GameSession session,
            Clue clue,
            Instant discoveredAt
    ) {
        this.session = session;
        this.clue = clue;
        this.discoveredAt = discoveredAt;
    }
}

