package com.ssafy.s14p11a707.game.dto;

import com.ssafy.s14p11a707.game.entity.EventLog;
import java.time.Instant;
import java.util.List;

public record EventLogListResponse(
        long sessionId,
        List<Log> logs
) {

    public static EventLogListResponse from(long sessionId, List<EventLog> entities) {
        return new EventLogListResponse(sessionId, entities.stream().map(Log::from).toList());
    }

    public record Log(
            String type,
            String name,
            String message,
            Instant createdAt
    ) {
        public static Log from(EventLog entity) {
            return new Log(
                    entity.getEventType().name(),
                    entity.getEventName(),
                    entity.getDisplayMessage(),
                    entity.getCreatedAt()
            );
        }
    }
}
