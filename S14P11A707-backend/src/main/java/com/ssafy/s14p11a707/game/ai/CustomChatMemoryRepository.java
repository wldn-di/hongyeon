package com.ssafy.s14p11a707.game.ai;

import com.ssafy.s14p11a707.game.entity.ChatMessage;
import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.game.repository.ChatMessageRepository;
import com.ssafy.s14p11a707.game.repository.GameSessionRepository;
import com.ssafy.s14p11a707.scenario.entity.Suspect;
import com.ssafy.s14p11a707.scenario.repository.SuspectRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.ai.chat.memory.ChatMemoryRepository;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.context.annotation.Primary;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Spring AI의 ChatMemoryRepository를 구현하여 기존 chat_messages 테이블을 사용하도록 커스터마이징
 * conversationId 형식: "session-{sessionId}-suspect-{suspectId}"
 */
@Component
@Primary
public class CustomChatMemoryRepository implements ChatMemoryRepository {

    private static final Pattern CONVERSATION_ID_PATTERN =
            Pattern.compile("session-(\\d+)-suspect-(\\d+)");

    private final ChatMessageRepository chatMessageRepository;
    private final GameSessionRepository gameSessionRepository;
    private final SuspectRepository suspectRepository;

    public CustomChatMemoryRepository(
            ChatMessageRepository chatMessageRepository,
            GameSessionRepository gameSessionRepository,
            SuspectRepository suspectRepository) {
        this.chatMessageRepository = chatMessageRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.suspectRepository = suspectRepository;
    }

    @Override
    @NonNull
    public List<String> findConversationIds() {
        // 모든 conversationId를 반환할 필요 없으면 빈 리스트 반환
        return List.of();
    }

    @Override
    @Transactional(readOnly = true)
    @NonNull
    public List<Message> findByConversationId(@NonNull String conversationId) {
        ConversationKey key = parseConversationId(conversationId);

        List<ChatMessage> chatMessages = chatMessageRepository
                .findBySessionIdAndSuspectIdOrderByCreatedAtAsc(key.sessionId, key.suspectId);

        List<Message> messages = new ArrayList<>();
        for (ChatMessage chatMessage : chatMessages) {
            Message message = createMessageFromRole(chatMessage.getRole(), chatMessage.getContent());
            if (message != null) {
                messages.add(message);
            }
        }
        return messages;
    }

    @Override
    @Transactional
    public void saveAll(@NonNull String conversationId, @NonNull List<Message> messages) {
        // chatWithSuspect에서 직접 저장하므로 중복 방지를 위해 아무것도 하지 않음
        return;
    }

    @Override
    @Transactional
    public void deleteByConversationId(@NonNull String conversationId) {
        ConversationKey key = parseConversationId(conversationId);
        chatMessageRepository.deleteBySessionIdAndSuspectId(key.sessionId, key.suspectId);
    }

    private ConversationKey parseConversationId(String conversationId) {
        Matcher matcher = CONVERSATION_ID_PATTERN.matcher(conversationId);
        if (!matcher.matches()) {
            throw new IllegalArgumentException(
                    "Invalid conversationId format: " + conversationId +
                    ". Expected format: session-{sessionId}-suspect-{suspectId}");
        }
        long sessionId = Long.parseLong(matcher.group(1));
        long suspectId = Long.parseLong(matcher.group(2));
        return new ConversationKey(sessionId, suspectId);
    }

    private String getRoleFromMessage(Message message) {
        if (message instanceof UserMessage) {
            return "user";
        } else if (message instanceof AssistantMessage) {
            return "suspect";
        }
        return "user";
    }

    private Message createMessageFromRole(String role, String content) {
        return switch (role.toLowerCase()) {
            case "user" -> new UserMessage(content);
            case "suspect", "assistant", "ai" -> new AssistantMessage(content);
            default -> null;
        };
    }

    private record ConversationKey(long sessionId, long suspectId) {
    }
}
