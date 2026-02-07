package com.ssafy.s14p11a707.game.v2.service;

import com.ssafy.s14p11a707.game.entity.ChatMessage;
import com.ssafy.s14p11a707.game.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SuspectChatV2HistoryService {

    private final ChatMessageRepository chatMessageRepository;

    @Transactional(readOnly = true)
    public List<HistoryMessage> findRecentMessages(long sessionId, long suspectId) {
        List<ChatMessage> history = new ArrayList<>(
                chatMessageRepository.findTop5BySessionIdAndSuspectIdOrderByCreatedAtDesc(sessionId, suspectId)
        );
        Collections.reverse(history);

        List<HistoryMessage> snapshots = new ArrayList<>(history.size());
        for (ChatMessage message : history) {
            snapshots.add(new HistoryMessage(message.getRole(), message.getContent()));
        }
        return snapshots;
    }

    public record HistoryMessage(String role, String content) {
    }
}
