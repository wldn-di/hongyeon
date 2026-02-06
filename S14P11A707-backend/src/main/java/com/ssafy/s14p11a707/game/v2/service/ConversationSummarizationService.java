package com.ssafy.s14p11a707.game.v2.service;

import com.ssafy.s14p11a707.game.entity.ChatMessage;
import com.ssafy.s14p11a707.game.repository.SessionSuspectStateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationSummarizationService {

    private final SessionSuspectStateRepository sessionSuspectStateRepository;
    @Qualifier("gmsChatClient")
    private final ChatClient gmsChatClient;

    @Async
    @Transactional
    public void summarizeAsync(
            long sessionId,
            long suspectId,
            String existingSummary,
            List<ChatMessage> newMessages,
            int newSummarizedMessageCount
    ) {
        try {
            log.info("[요약] 시작 sessionId={} suspectId={} newMessages={}", sessionId, suspectId, newMessages.size());

            StringBuilder messagesText = new StringBuilder();
            for (ChatMessage msg : newMessages) {
                String role = "user".equals(msg.getRole()) ? "수사관" : "용의자";
                messagesText.append(String.format("%s: %s\n", role, msg.getContent()));
            }

            String prompt = buildSummarizationPrompt(existingSummary, messagesText.toString());

            String summary = gmsChatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();

            if (summary != null && !summary.isBlank()) {
                String trimmedSummary = summary.trim();
                sessionSuspectStateRepository.updateSummary(
                        sessionId, suspectId, trimmedSummary, newSummarizedMessageCount);
                log.info("[요약] 완료 sessionId={} suspectId={} summaryLength={}",
                        sessionId, suspectId, trimmedSummary.length());
            }
        } catch (Exception e) {
            log.warn("[요약] 실패 sessionId={} suspectId={}: {}",
                    sessionId, suspectId, e.getMessage());
        }
    }

    private String buildSummarizationPrompt(String existingSummary, String newMessagesText) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("""
                당신은 용의자 심문 대화를 요약하는 역할을 합니다.
                다음 대화 내용을 300자 이내의 한국어로 요약해주세요.

                ## 요약 시 반드시 보존해야 할 핵심 정보
                - 용의자의 자백이나 시인 내용
                - 진술의 모순점이나 앞뒤가 맞지 않는 부분
                - 단서에 대한 반응 (당황, 부인, 인정 등)
                - 알리바이 변화 (처음 말한 것과 나중에 바뀐 것)
                - KEY_TALK에 해당하는 중요한 진술

                ## 요약 형식
                - 핵심 사실 위주로 간결하게 작성
                - 시간순으로 정리
                - 불필요한 인사말이나 반복 내용은 제외
                """);

        if (existingSummary != null && !existingSummary.isBlank()) {
            prompt.append("\n## 기존 요약\n");
            prompt.append(existingSummary);
            prompt.append("\n");
        }

        prompt.append("\n## 새로운 대화 내용\n");
        prompt.append(newMessagesText);
        prompt.append("\n위 내용을 기존 요약과 통합하여 300자 이내로 요약해주세요. 요약만 출력하세요.");

        return prompt.toString();
    }
}
