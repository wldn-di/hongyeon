package com.ssafy.s14p11a707.game.entity;

import com.ssafy.s14p11a707.common.entity.BaseEntity;
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
@Table(name = "board_nodes")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoardNode extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private GameSession session;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ItemType itemType;

    private Long targetId;

    @Lob
    private String memoContent;

    @Column(nullable = false)
    private int positionX;

    @Column(nullable = false)
    private int positionY;

    @Builder
    public BoardNode(
            GameSession session,
            ItemType itemType,
            Long targetId,
            String memoContent,
            int positionX,
            int positionY
    ) {
        this.session = session;
        this.itemType = itemType == null ? ItemType.MEMO : itemType;
        this.targetId = targetId;
        this.memoContent = memoContent;
        this.positionX = positionX;
        this.positionY = positionY;
    }

    public void updatePosition(int x, int y) {
        this.positionX = x;
        this.positionY = y;
    }

    public void updateMemoContent(String memoContent) {
        this.memoContent = memoContent;
    }

    public enum ItemType {
        VICTIM,
        SUSPECT,
        CLUE,
        LOCATION,
        MEMO
    }
}
