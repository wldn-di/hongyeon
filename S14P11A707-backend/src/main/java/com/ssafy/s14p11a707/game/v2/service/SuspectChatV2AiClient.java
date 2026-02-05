package com.ssafy.s14p11a707.game.v2.service;

public interface SuspectChatV2AiClient {

    String generate(String conversationId, String systemMessage, String userMessage);
}

