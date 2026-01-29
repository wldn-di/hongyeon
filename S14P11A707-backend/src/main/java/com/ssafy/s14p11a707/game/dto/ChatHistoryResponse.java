package com.ssafy.s14p11a707.game.dto;

import com.ssafy.s14p11a707.game.entity.ChatMessage;
import java.time.Instant;
import java.util.List;

public record ChatHistoryResponse(
        long sessionId,
        long suspectId,
        List<MessageItem> messages
) {

    public static ChatHistoryResponse from(long sessionId, long suspectId, List<ChatMessage> entities) {
        List<MessageItem> messages = entities.stream()
                .map(MessageItem::from)
                .toList();
        return new ChatHistoryResponse(sessionId, suspectId, messages);
    }

    public record MessageItem(
            long messageId,
            String role,  // "user" 또는 "suspect"
            String content,
            Instant createdAt,
            boolean isKeyTalk,
            Long usedClueId,
            Integer responseLevel
    ) {
        public static MessageItem from(ChatMessage entity) {
            return new MessageItem(
                    entity.getId(),
                    entity.getRole(),
                    entity.getContent(),
                    entity.getCreatedAt(),
                    entity.isKeyTalk(),
                    entity.getUsedClueId(),
                    entity.getResponseLevel()
            );
        }
    }
}