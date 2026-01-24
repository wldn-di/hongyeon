package com.ssafy.s14p11a707.game.dto;

public record SuspectChatRequest(
        String message,
        Long usedClueId
) {
}

