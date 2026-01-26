package com.ssafy.s14p11a707.game.entity;

import com.ssafy.s14p11a707.common.entity.CreatedAtEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "event_logs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EventLog extends CreatedAtEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private GameSession session;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EventType eventType;

    @Column(length = 100)
    private String eventName;

    @Column(length = 500)
    private String displayMessage;

    @Builder
    public EventLog(
            GameSession session,
            EventType eventType,
            String eventName,
            String displayMessage
    ) {
        this.session = session;
        this.eventType = eventType;
        this.eventName = eventName;
        this.displayMessage = displayMessage;
    }

    public enum EventType {
        GAME_START,
        GAME_END,
        FLOOR_MOVED,
        CLUE_FOUND,
        CHAT_STARTED,
        SUBMIT_ATTEMPT
    }
}
