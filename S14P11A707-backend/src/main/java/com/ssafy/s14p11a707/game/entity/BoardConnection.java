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
        name = "board_connections",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_board_connections_session_from_to",
                        columnNames = {"session_id", "from_node_id", "to_node_id"}
                )
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoardConnection extends CreatedAtEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private GameSession session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "from_node_id", nullable = false)
    private BoardNode fromNode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "to_node_id", nullable = false)
    private BoardNode toNode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ConnectionType connectionType;

    @Builder
    public BoardConnection(
            GameSession session,
            BoardNode fromNode,
            BoardNode toNode,
            ConnectionType connectionType
    ) {
        this.session = session;
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.connectionType = connectionType;
    }

    public enum ConnectionType {
        RED,
        YELLOW
    }
}

