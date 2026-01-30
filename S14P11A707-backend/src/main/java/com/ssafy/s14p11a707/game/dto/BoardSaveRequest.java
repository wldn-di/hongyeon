package com.ssafy.s14p11a707.game.dto;

import java.util.List;

public record BoardSaveRequest(
        List<BoardNodeRequest> nodes,
        List<BoardConnectionRequest> connections
) {
    public record BoardNodeRequest(
            String type,           // CLUE, SUSPECT, VICTIM, LOCATION, MEMO
            Long targetId,         // MEMO면 null
            String memoContent,    // MEMO일 때 내용
            int x,
            int y
    ) {}

    public record BoardConnectionRequest(
            int fromIndex,         // nodes 배열 인덱스
            int toIndex,           // nodes 배열 인덱스
            String type            // RED, YELLOW
    ) {}
}