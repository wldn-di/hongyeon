package com.ssafy.s14p11a707.game.entity;

import com.ssafy.s14p11a707.common.entity.CreatedAtEntity;
import com.ssafy.s14p11a707.scenario.entity.Clue;
import com.ssafy.s14p11a707.scenario.entity.Suspect;
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
@Table(name = "chat_messages")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatMessage extends CreatedAtEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private GameSession session;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private TargetType targetType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suspect_id")
    private Suspect suspect;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private MessageRole role;

    @Lob
    private String content;

    @Column(name = "is_key", nullable = false)
    private boolean keyMessage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revealed_clue_id")
    private Clue revealedClue;

    @Builder
    public ChatMessage(
            GameSession session,
            TargetType targetType,
            Suspect suspect,
            MessageRole role,
            String content,
            boolean keyMessage,
            Clue revealedClue
    ) {
        this.session = session;
        this.targetType = targetType;
        this.suspect = suspect;
        this.role = role;
        this.content = content;
        this.keyMessage = keyMessage;
        this.revealedClue = revealedClue;
    }

    public enum TargetType {
        SUSPECT,
        VICTIM,
        ROOM,
        CLUE,
        SYSTEM
    }

    public enum MessageRole {
        USER,
        ASSISTANT,
        SYSTEM
    }
}
