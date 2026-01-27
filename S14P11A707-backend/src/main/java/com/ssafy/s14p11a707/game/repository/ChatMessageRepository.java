package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.ChatMessage;
import com.ssafy.s14p11a707.game.entity.GameSession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findBySessionAndKeyTalkTrueOrderByCreatedAtDesc(GameSession session);

    int countBySessionAndRole(GameSession session, String role);
}
