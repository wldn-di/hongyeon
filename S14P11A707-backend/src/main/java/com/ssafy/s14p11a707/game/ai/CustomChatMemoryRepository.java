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
                .findBySessionIdAndSuspectIdOrderByCreatedAtDesc(key.sessionId, key.suspectId);

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
        ConversationKey key = parseConversationId(conversationId);

        GameSession session = gameSessionRepository.findById(key.sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + key.sessionId));

        // suspect가 없으면 저장하지 않음 (AI 응답 후 별도 처리)
        Suspect suspect = suspectRepository.findById(key.suspectId).orElse(null);
        if (suspect == null) {
            return; // suspect가 없으면 저장하지 않고 건너뜀
        }

        // 기존 저장된 메시지 개수 확인
        List<ChatMessage> existingMessages = chatMessageRepository
                .findBySessionIdAndSuspectIdOrderByCreatedAtDesc(key.sessionId, key.suspectId);
        int existingCount = existingMessages.size();

        // 새로운 메시지만 저장 (Spring AI가 전체 메시지 리스트를 전달하므로 중복 방지)
        int startIndex = Math.max(0, messages.size() - existingCount - 2); // +2는 user+assistant 쌍 고려
        for (int i = startIndex; i < messages.size(); i++) {
            Message message = messages.get(i);

            // 중복 체크: 동일한 role과 content를 가진 최근 메시지가 있는지 확인
            boolean isDuplicate = existingMessages.stream()
                    .anyMatch(existing -> existing.getRole().equals(getRoleFromMessage(message))
                            && existing.getContent().equals(message.getText()));

            if (!isDuplicate) {
                ChatMessage chatMessage = ChatMessage.builder()
                        .session(session)
                        .suspect(suspect)
                        .role(getRoleFromMessage(message))
                        .content(message.getText())
                        .usedClueId(null)
                        .responseLevel(null)
                        .keyTalk(false)
                        .build();

                chatMessageRepository.save(chatMessage);
            }
        }
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
