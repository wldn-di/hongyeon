package com.ssafy.s14p11a707.game.v2.service;

import com.ssafy.s14p11a707.game.dto.SuspectChatRequest;
import com.ssafy.s14p11a707.game.dto.SuspectChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class SuspectChatV2Service {

    private static final String AI_FAILURE_MESSAGE = "용의자가 잠시 침묵합니다... 다시 한 번 말을 걸어보세요.";
    private static final Pattern OWNERSHIP_QUESTION_PATTERN = Pattern.compile(
            ".*(너꺼|네꺼|니꺼|당신\\s*것|당신\\s*소유|네\\s*물건|니\\s*물건|주인|소유|누구\\s*거|누구꺼|누구\\s*것|your\\s*(item|thing|property)|is\\s*it\\s*yours|who\\s*owns).*",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern USAGE_QUESTION_PATTERN = Pattern.compile(
            ".*(이걸로|그걸로|뭐했|무엇을 했|왜 썼|왜 사용|용도|무슨 용도|어디에 썼|어떻게 썼|used it|what did you do with|what is it for).*",
            Pattern.CASE_INSENSITIVE
    );

    private final SuspectChatV2ContextService contextService;
    private final SuspectChatV2PromptBuilder promptBuilder;
    private final SuspectChatV2AiClient aiClient;
    private final SuspectChatV2PersistService persistService;
    private final SuspectChatV2HistoryService historyService;
    @Qualifier("gmsChatClient")
    private final ChatClient gmsChatClient;
    private final ChatConcurrencyGate chatGate;

    public SuspectChatResponse chatWithSuspect(long sessionId, long suspectId, SuspectChatRequest request) {
        String reqId = "CHAT-" + System.nanoTime();
        log.info("[CHAT][{}] 요청 도착 sessionId={} suspectId={}", reqId, sessionId, suspectId);

        if (!chatGate.tryAcquire()) {
            log.warn("[CHAT][{}] Gate 타임아웃 - fallback 응답", reqId);
            return new SuspectChatResponse(
                    sessionId,
                    suspectId,
                    "용의자가 잠시 침묵합니다... 다시 한 번 말을 걸어보세요.",
                    0,
                    0,
                    null
            );
        }

        log.info("[CHAT][{}] Gate 획득 (available={}/{})", reqId, chatGate.availablePermits(), chatGate.maxPermits());
        long startNs = System.nanoTime();
        try {
            return doChat(sessionId, suspectId, request, reqId, startNs);
        } finally {
            chatGate.release();
            long totalMs = toMsSince(startNs);
            log.info("[CHAT][{}] Gate 반납 (elapsed={}ms)", reqId, totalMs);
        }
    }

    private SuspectChatResponse doChat(long sessionId, long suspectId, SuspectChatRequest request, String reqId, long startNs) {
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
                    context.userMessage(),
                    context.sessionId(),
                    context.suspectId()
            );

            String fullResponse = aiClient.generate(context.conversationId(), systemMessage, rewrittenUserMessage);
            AiResult aiResult = parseAiResponse(fullResponse);
            return enforceClueConsistencyGuard(context, aiResult);
        } catch (Exception ex) {
            WebClientResponseException webEx = findWebClientResponseException(ex);
            if (webEx != null) {
                log.warn(
                        "suspectChatV2 AI 4xx/5xx sessionId={} suspectId={} status={} body={}",
                        context.sessionId(),
                        context.suspectId(),
                        webEx.getStatusCode(),
                        webEx.getResponseBodyAsString()
                );
            }
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
        if (fullResponse == null || fullResponse.isBlank()) {
            return new AiResult(false, AI_FAILURE_MESSAGE, false);
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

        if (reply.isBlank()) {
            return new AiResult(false, AI_FAILURE_MESSAGE, false);
        }

        return new AiResult(true, reply, keyTalk);
    }

    private AiResult enforceClueConsistencyGuard(SuspectChatV2Context context, AiResult aiResult) {
        if (!aiResult.success() || context.usedClueId() == null) {
            return aiResult;
        }

        String ownershipStatus = context.usedClueOwnershipStatus();
        if ("OWNED_BY_CURRENT_SUSPECT".equals(ownershipStatus)
                && isUsageQuestion(context.userMessage())
                && containsUnfamiliarDenial(aiResult.reply())) {
            String correctedReply = "그 물건이 제 것인 건 맞습니다. 하지만 그걸 범행에 썼다는 뜻은 아닙니다.";
            log.warn(
                    "suspectChatV2 owned-clue consistency guard applied. sessionId={} suspectId={} clueId={} originalReply={}",
                    context.sessionId(),
                    context.suspectId(),
                    context.usedClueId(),
                    aiResult.reply()
            );
            return new AiResult(aiResult.success(), correctedReply, aiResult.keyTalk());
        }

        if (!"NOT_OWNED_BY_CURRENT_SUSPECT".equals(ownershipStatus) && !"UNKNOWN".equals(ownershipStatus)) {
            return aiResult;
        }

        if (!isOwnershipQuestion(context.userMessage()) || !containsOwnershipAdmission(aiResult.reply())) {
            return aiResult;
        }

        String correctedReply = "NOT_OWNED_BY_CURRENT_SUSPECT".equals(ownershipStatus)
                ? "그건 제 물건이 아닙니다. 누가 거기에 뒀는지는 저도 모릅니다."
                : "그 물건이 제 것이라고 단정할 수는 없습니다. 최소한 제 소유라고는 말할 수 없어요.";

        log.warn(
                "suspectChatV2 ownership guard applied. sessionId={} suspectId={} clueId={} status={} originalReply={}",
                context.sessionId(),
                context.suspectId(),
                context.usedClueId(),
                ownershipStatus,
                aiResult.reply()
        );
        return new AiResult(aiResult.success(), correctedReply, aiResult.keyTalk());
    }

    private boolean isUsageQuestion(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return false;
        }
        return USAGE_QUESTION_PATTERN.matcher(userMessage).matches();
    }

    private boolean isOwnershipQuestion(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return false;
        }
        return OWNERSHIP_QUESTION_PATTERN.matcher(userMessage).matches();
    }

    private boolean containsOwnershipAdmission(String reply) {
        if (reply == null || reply.isBlank()) {
            return false;
        }
        String normalized = reply.toLowerCase(Locale.ROOT);
        return normalized.contains("제 것")
                || normalized.contains("제꺼")
                || normalized.contains("내 것")
                || normalized.contains("내꺼")
                || normalized.contains("제 거예요")
                || normalized.contains("내 거예요")
                || normalized.contains("제 물건")
                || normalized.contains("내 물건")
                || normalized.contains("제 소유")
                || normalized.contains("제 태블릿")
                || normalized.contains("맞아요 제")
                || normalized.contains("맞습니다 제")
                || normalized.contains("맞아요, 제")
                || normalized.contains("맞습니다, 제")
                || normalized.contains("yes, it's mine")
                || normalized.contains("it's mine");
    }

    private boolean containsUnfamiliarDenial(String reply) {
        if (reply == null || reply.isBlank()) {
            return false;
        }
        String normalized = reply.toLowerCase(Locale.ROOT);
        return normalized.contains("처음 보는")
                || normalized.contains("처음 본")
                || normalized.contains("모릅니다")
                || normalized.contains("모른다")
                || normalized.contains("쓴 적 없습니다")
                || normalized.contains("쓴 적 없")
                || normalized.contains("사용한 적 없습니다")
                || normalized.contains("사용한 적 없")
                || normalized.contains("무슨 용도인지도 모릅니다")
                || normalized.contains("never used")
                || normalized.contains("don't know what it is");
    }

    private long toMsSince(long startNs) {
        return (System.nanoTime() - startNs) / 1_000_000;
    }

    private WebClientResponseException findWebClientResponseException(Throwable throwable) {
        for (Throwable t = throwable; t != null; t = t.getCause()) {
            if (t instanceof WebClientResponseException webClientResponseException) {
                return webClientResponseException;
            }
        }
        return null;
    }

    /**
     * 맥락 의존적인 질문을 명확한 질문으로 재작성
     * 대화 기록을 바탕으로 "그때", "그거", "얘" 등 맥락 의존적인 표현을 구체적인 정보로 변환
     */
    private String rewriteQuestionWithContext(String userMessage, long sessionId, long suspectId) {
        // 단서 제시 메시지는 재작성하지 않음
        if (userMessage.startsWith("[단서 제시:") || userMessage.startsWith("[단서 ID")) {
            return userMessage;
        }

        // 첫 대화이거나 너무 짧은 메시지는 재작성하지 않음
        if (userMessage.length() < 5) {
            return userMessage;
        }

        List<SuspectChatV2HistoryService.HistoryMessage> history;
        try {
            history = historyService.findRecentMessages(sessionId, suspectId);
        } catch (Exception e) {
            log.warn(
                    "suspectChatV2 rewrite history load failed sessionId={} suspectId={} cause={}",
                    sessionId,
                    suspectId,
                    e.getMessage()
            );
            return userMessage;
        }
        if (history.isEmpty()) {
            return userMessage;
        }

        // 맥락 의존적인 표현 패턴 확인
        boolean hasContextDependentRef = userMessage.matches(".*(그때|그거|그건|얘|걔|걔는|거기|거긴|그 사람|그분|그때문에).*");
        if (!hasContextDependentRef) {
            return userMessage;
        }

        // 이전 대화 기록을 텍스트로 변환
        StringBuilder contextBuilder = new StringBuilder();
        for (SuspectChatV2HistoryService.HistoryMessage msg : history) {
            String role = "user".equals(msg.role()) ? "수사관" : "용의자";
            contextBuilder.append(String.format("%s: %s\n", role, msg.content()));
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

