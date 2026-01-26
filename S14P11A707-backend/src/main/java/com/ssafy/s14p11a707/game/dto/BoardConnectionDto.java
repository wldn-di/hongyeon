package com.ssafy.s14p11a707.game.dto;

import com.ssafy.s14p11a707.game.entity.BoardConnection;

public record BoardConnectionDto(
        long connectionId,
        long fromNodeId,
        long toNodeId,
        String type
) {
    public static BoardConnectionDto from(BoardConnection entity) {
        return new BoardConnectionDto(
                entity.getId(),
                entity.getFromNode().getId(),
                entity.getToNode().getId(),
                entity.getConnectionType().name()
        );
    }
}
