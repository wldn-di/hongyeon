package com.ssafy.s14p11a707.game.dto;

import java.time.Instant;
import java.util.List;

public record EventLogListResponse(
        long sessionId,
        List<Log> logs
) {

    public record Log(
            String type,
            String name,
            String message,
            Instant createdAt
    ) {
    }
}

