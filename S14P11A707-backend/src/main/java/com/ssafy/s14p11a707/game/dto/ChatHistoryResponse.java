package com.ssafy.s14p11a707.game.dto;

import java.time.Instant;
import java.util.List;

public record ChatHistoryResponse(
        long sessionId,
        long suspectId,
        List<Message> messages
) {

    public record Message(
            String role,
            String content,
            boolean isKeyTalk,
            Instant createdAt
    ) {
    }
}

