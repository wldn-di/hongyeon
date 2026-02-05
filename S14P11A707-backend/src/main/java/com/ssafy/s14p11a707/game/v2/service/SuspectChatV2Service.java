package com.ssafy.s14p11a707.game.v2.service;

import com.ssafy.s14p11a707.game.dto.SuspectChatRequest;
import com.ssafy.s14p11a707.game.dto.SuspectChatResponse;
import com.ssafy.s14p11a707.game.entity.ChatMessage;
import com.ssafy.s14p11a707.game.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SuspectChatV2Service {

    private static final String AI_FAILURE_MESSAGE = "현재 답변 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";

    private final SuspectChatV2ContextService contextService;
    private final SuspectChatV2PromptBuilder promptBuilder;
    private final SuspectChatV2AiClient aiClient;
    private final SuspectChatV2PersistService persistService;
    private final ChatMessageRepository chatMessageRepository;
    @Qualifier("gmsChatClient")
    private final ChatClient gmsChatClient;

    public SuspectChatResponse chatWithSuspect(long sessionId, long suspectId, SuspectChatRequest request) {
        long startNs = System.nanoTime();

        long t0 = System.nanoTime();
        SuspectChatV2Context context = contextService.load(sessionId, suspectId, request);
        long contextMs = toMsSince(t0);

        String systemMessage = promptBuilder.buildSystemMessage(context);

        long t1 = System.nanoTime();
        AiResult aiResult = callAi(context, systemMessage);
        long aiMs = toMsSince(t1);

        long t2 = System.nanoTime();
        SuspectChatV2PersistResult persisted = persistService.persist(
                context,
                aiResult.reply(),
                aiResult.keyTalk(),
                aiResult.success()
        );
        long persistMs = toMsSince(t2);

        long totalMs = toMsSince(startNs);
        log.info(
                "suspectChatV2 sessionId={} suspectId={} aiFailed={} contextMs={} aiMs={} persistMs={} totalMs={}",
                sessionId,
                suspectId,
                !aiResult.success(),
                contextMs,
                aiMs,
                persistMs,
                totalMs
        );

        return new SuspectChatResponse(
                sessionId,
                suspectId,
                aiResult.reply(),
                persisted.responseLevel(),
                persisted.health(),
                null
        );
    }

    private AiResult callAi(SuspectChatV2Context context, String systemMessage) {
        try {
            // 질문 재작성: 맥락 의존적인 질문을 명확한 질문으로 변환
            String rewrittenUserMessage = rewriteQuestionWithContext(
                    context.conversationId(),
                    context.userMessage(),
                    context.sessionId(),
                    context.suspectId()
            );

            String fullResponse = aiClient.generate(context.conversationId(), systemMessage, rewrittenUserMessage);
            return parseAiResponse(fullResponse);
        } catch (Exception ex) {
            log.warn(
                    "suspectChatV2 AI call failed sessionId={} suspectId={}",
                    context.sessionId(),
                    context.suspectId(),
                    ex
            );
            return new AiResult(false, AI_FAILURE_MESSAGE, false);
        }
    }

    private AiResult parseAiResponse(String fullResponse) {
        if (fullResponse == null) {
            return new AiResult(true, "", false);
        }

        boolean keyTalk = false;
        String reply = fullResponse;

        if (fullResponse.contains("[KEY_TALK:")) {
            int start = fullResponse.lastIndexOf("[KEY_TALK:");
            int end = fullResponse.indexOf("]", start);
            if (end != -1) {
                String keyTalkStr = fullResponse.substring(start + 11, end).trim().toLowerCase();
                keyTalk = keyTalkStr.equals("true");
                reply = fullResponse.substring(0, start).trim();
            }
        } else {
            log.warn("suspectChatV2 KEY_TALK metadata missing");
        }

        return new AiResult(true, reply, keyTalk);
    }

    private long toMsSince(long startNs) {
        return (System.nanoTime() - startNs) / 1_000_000;
    }

    /**
     * 맥락 의존적인 질문을 명확한 질문으로 재작성
     * 대화 기록을 바탕으로 "그때", "그거", "얘" 등 맥락 의존적인 표현을 구체적인 정보로 변환
     */
    private String rewriteQuestionWithContext(String conversationId, String userMessage, long sessionId, long suspectId) {
        // 단서 제시 메시지는 재작성하지 않음
        if (userMessage.startsWith("[단서 제시:") || userMessage.startsWith("[단서 ID")) {
            return userMessage;
        }

        // 첫 대화이거나 너무 짧은 메시지는 재작성하지 않음
        List<ChatMessage> history = chatMessageRepository
                .findBySessionIdAndSuspectIdOrderByCreatedAtAsc(sessionId, suspectId);
        if (history.isEmpty() || userMessage.length() < 5) {
            return userMessage;
        }

        // 맥락 의존적인 표현 패턴 확인
        boolean hasContextDependentRef = userMessage.matches(".*(그때|그거|그건|얘|걔|걔는|거기|거긴|그 사람|그분|그때문에).*");
        if (!hasContextDependentRef) {
            return userMessage;
        }

        // 이전 대화 기록을 텍스트로 변환
        StringBuilder contextBuilder = new StringBuilder();
        int recentCount = Math.min(5, history.size());
        int startIndex = Math.max(0, history.size() - recentCount);

        for (int i = startIndex; i < history.size(); i++) {
            ChatMessage msg = history.get(i);
            String role = "user".equals(msg.getRole()) ? "수사관" : "용의자";
            contextBuilder.append(String.format("%s: %s\n", role, msg.getContent()));
        }

        // 질문 재작성을 위한 프롬프트
        String rewritePrompt = String.format("""
                당신은 용의자 심문 게임에서 질문을 명확하게 재작성하는 역할을 합니다.

                ## 이전 대화 기록
                %s

                ## 현재 질문
                %s

                ## 작업 지침
                1. 현재 질문에 "그때", "그거", "얘", "걔", "거기" 등 맥락 의존적인 표현이 포함되어 있습니다.
                2. 이전 대화 기록을 참조하여 이러한 표현을 **구체적인 정보로 명확하게 변환**하세요.
                3. 질문의 의도와 어조는 그대로 유지하면서, 맥락 의존적인 부분만 명확하게 만드세요.
                4. 단서 제시 관련 내용은 수정하지 마세요.
                5. 재작성된 질문만 출력하고, 다른 설명은 포함하지 마세요.

                ## 예시
                이전 대화: "사건 시간에 어디 있었어요?" → "22:00에는 클럽에 있었어요"
                현재 질문: "그때 누구와 함께 있었나요?"
                → "22:00에 클럽에 있을 때 누구와 함께 있었나요?"
                """,
                contextBuilder.toString(),
                userMessage
        );

        try {
            // AI로 질문 재작성
            String rewritten = gmsChatClient.prompt()
                    .user(rewritePrompt)
                    .call()
                    .content();

            if (rewritten != null && !rewritten.isBlank()) {
                String trimmed = rewritten.trim();
                log.info("[질문 재작성] 원본: {} → 재작성: {}", userMessage, trimmed);
                return trimmed;
            }
        } catch (Exception e) {
            log.warn("[질문 재작성 실패] 재작성 없이 원본 질문 사용: {}", e.getMessage());
        }

        return userMessage;
    }

    private record AiResult(boolean success, String reply, boolean keyTalk) {
    }
}

