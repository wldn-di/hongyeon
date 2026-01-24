package com.ssafy.s14p11a707.game.dto;

public record SuspectChatResponse(
        long sessionId,
        long suspectId,
        String response,
        int responseLevel,
        int health,
        Long revealedClueId
) {
}

