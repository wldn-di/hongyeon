package com.ssafy.s14p11a707.game.entity;

import com.ssafy.s14p11a707.scenario.entity.Suspect;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "session_suspect_states")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SessionSuspectState {

    @EmbeddedId
    private SessionSuspectStateId id;

    @MapsId("sessionId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private GameSession session;

    @MapsId("suspectId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "suspect_id", nullable = false)
    private Suspect suspect;

    @Column(nullable = false)
    private int currentInterrogationLevel;

    @Column(name = "is_secret_revealed", nullable = false)
    private boolean secretRevealed;

    @Builder
    public SessionSuspectState(
            GameSession session,
            Suspect suspect,
            int currentInterrogationLevel,
            boolean secretRevealed
    ) {
        this.id = new SessionSuspectStateId();
        this.session = session;
        this.suspect = suspect;
        this.currentInterrogationLevel = currentInterrogationLevel;
        this.secretRevealed = secretRevealed;
    }
}
