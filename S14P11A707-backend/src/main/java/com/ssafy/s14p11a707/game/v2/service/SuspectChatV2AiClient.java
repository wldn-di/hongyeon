package com.ssafy.s14p11a707.game.v2.service;

import org.springframework.ai.chat.messages.Message;

import java.util.List;

public interface SuspectChatV2AiClient {

    String generate(String systemMessage, String userMessage, List<Message> recentHistory);
}
