package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
}

