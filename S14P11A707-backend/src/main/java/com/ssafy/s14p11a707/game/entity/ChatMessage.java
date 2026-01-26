package com.ssafy.s14p11a707.game.entity;

import com.ssafy.s14p11a707.common.entity.CreatedAtEntity;
import com.ssafy.s14p11a707.scenario.entity.Suspect;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suspect_id")
    private Suspect suspect;

    @Column(nullable = false, length = 20)
    private String role;

    @Lob
    @Column(nullable = false)
    private String content;

    private Long usedClueId;

    private Integer responseLevel;

    @Column(name = "is_key_talk", nullable = false)
    private boolean keyTalk;

    @Builder
    public ChatMessage(
            GameSession session,
            Suspect suspect,
            String role,
            String content,
            Long usedClueId,
            Integer responseLevel,
            boolean keyTalk
    ) {
        this.session = session;
        this.suspect = suspect;
        this.role = role;
        this.content = content;
        this.usedClueId = usedClueId;
        this.responseLevel = responseLevel;
        this.keyTalk = keyTalk;
    }
}
