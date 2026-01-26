package com.ssafy.s14p11a707.game.dto;

import com.ssafy.s14p11a707.game.entity.BoardNode;

public record BoardNodeDto(
        long nodeId,
        String type,
        Long targetId,
        String memoContent,
        int x,
        int y
) {
    public static BoardNodeDto from(BoardNode entity) {
        return new BoardNodeDto(
                entity.getId(),
                entity.getItemType().name(),
                entity.getTargetId(),
                entity.getMemoContent(),
                entity.getPositionX(),
                entity.getPositionY()
        );
    }
}
