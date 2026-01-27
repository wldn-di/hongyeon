package com.ssafy.s14p11a707.game.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.game.dto.*;
import com.ssafy.s14p11a707.game.service.GameSessionService;
import com.ssafy.s14p11a707.scenario.entity.Clue;
import com.ssafy.s14p11a707.scenario.entity.Suspect;
import com.ssafy.s14p11a707.scenario.repository.ClueRepository;
import com.ssafy.s14p11a707.scenario.repository.SuspectRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.ChatMemoryRepository;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.ai.chat.client.advisor.api.Advisor;

import org.springframework.context.annotation.Primary;

@Primary
@Service
public class GameSessionServiceImpl implements GameSessionService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final ChatMemory chatMemory;
    private final SuspectRepository suspectRepository;
    private final ClueRepository clueRepository;

    public GameSessionServiceImpl(@Qualifier("genAiChatClient") ChatClient chatClient,
                                  ChatMemoryRepository chatMemoryRepository,
                                  VectorStore vectorStore,
                                  SuspectRepository suspectRepository,
                                  ClueRepository clueRepository) {
        this.chatClient = chatClient;
        this.vectorStore = vectorStore;
        this.suspectRepository = suspectRepository;
        this.clueRepository = clueRepository;
        this.chatMemory = MessageWindowChatMemory.builder()
                .maxMessages(20) // 최근 20개 대화 기억
                .chatMemoryRepository(chatMemoryRepository) // PostgreSQL 저장소 사용
                .build();
    }

    @Override
    public GameStartResponse startGame(long scenarioId) {
        return null;
    }

    @Override
    public InvestigationReportResponse getInvestigationReport(long sessionId) {
        return null;
    }

    @Override
    public ChatHistoryResponse getChatHistory(long sessionId, long suspectId) {
        return null;
    }

    @Override
    public SuspectInterrogationStateResponse getSuspectInterrogationState(long sessionId, long suspectId) {
        return null;
    }

    @Override
    public SuspectChatResponse chatWithSuspect(long sessionId, long suspectId, SuspectChatRequest request) {
        // 용의자 정보 조회
        Suspect suspect = suspectRepository.findById(suspectId)
                .orElseThrow(() -> new IllegalArgumentException("Suspect not found: " + suspectId));

        // aiConfigJson에서 성격/말투 추출
        JsonNode aiConfig = suspect.getAiConfigJson();
        String personality = aiConfig != null && aiConfig.has("personality")
                ? aiConfig.get("personality").asText()
                : "내성적이고 감정 기복이 심함";

        String speechStyle = aiConfig != null && aiConfig.has("speechStyle")
                ? aiConfig.get("speechStyle").asText()
                : "정중하지만 불안한 말투";

        // 범인 여부에 따른 행동 지침 구성
        String behaviorGuideline;
        if (suspect.isCulprit()) {
            behaviorGuideline = """
                    - 당신은 범인입니다. 이 사실을 절대 인정하지 마세요.
                    - 불안해하고 긴장된 상태를 보이지만, 최대한 평정심을 유지하세요.
                    - 알리바이를 강하게 주장하고 모순이 드러나지 않도록 주의하세요.
                    - 흉기나 범행 당시 상황에 대해 묻으면 회피하거나 거짓말을 하세요.
                    """;
        } else {
            behaviorGuideline = """
                    - 당신은 무고합니다. 당황하거나 공포스러워할 수 있지만 사실만 말하세요.
                    - 범행과 무관함을 명확히 하고, 자신의 알리바이를 솔직하게 말하세요.
                    - 진실을 말하므로 모순이 없어야 합니다.
                    - 다른 용의자에 대한 추측은 신중하게 하세요.
                    """;
        }

        // 용의자별 페르소나 생성
        String systemMessage = String.format("""
                당신은 용의자 '%s'입니다.

                ## 인적 사항
                - 나이: %d세
                - 성별: %s
                - 직업: %s
                - 한 줄 소개: %s
                - 성격: %s
                - 말투: %s

                ## 동기
                %s

                ## 행동 지침
                %s
                1. VectorStore에 저장된 시나리오 정보를 참고하여 심문에 응답하세요.
                2. 자신과 직접 관련된 사실만 말하세요.
                3. 이전 대화 내용을 기억하고 일관성 있게 답변하세요.
                4. 범인이나 흉기를 직접적으로 말하지 말고, 알리바이를 주장하세요.
                5. 당신의 직업과 성격에 맞는 말투를 사용하세요.
                """,
                suspect.getName(),
                suspect.getAge() != null ? suspect.getAge() : 30,
                suspect.getGender() != null ? suspect.getGender() : "알 수 없음",
                suspect.getOccupation() != null ? suspect.getOccupation() : "무직",
                suspect.getOneLiner() != null ? suspect.getOneLiner() : "없음",
                personality,
                speechStyle,
                suspect.getMotive() != null ? suspect.getMotive() : "없음",
                behaviorGuideline
        );

        String userMessage = request.message() == null ? "" : request.message().trim();
        Long usedClueId = request.usedClueId();

        // 단서를 사용한 경우 단서 정보 조회 후 AI에게 전달
        if (usedClueId != null) {
            Clue clue = clueRepository.findById(usedClueId)
                    .orElse(null);
            if (clue != null) {
                userMessage = String.format(
                        "[단서 제시: %s - %s] %s",
                        clue.getName(),
                        clue.getDescription(),
                        userMessage
                );
            } else {
                userMessage = String.format("[단서 ID %d를 제시하며] %s", usedClueId, userMessage);
            }
        }

        // RAG Advisor (시나리오/타임라인 기반 검색)
//        Advisor ragAdvisor = QuestionAnswerAdvisor.builder(vectorStore)
//                .searchRequest(SearchRequest.builder()
//                        .similarityThreshold(0.8d)
//                        .topK(6)
//                        .build())
//                .build();

        // Memory Advisor (대화 맥락 유지)
        Advisor memoryAdvisor = MessageChatMemoryAdvisor.builder(chatMemory)
                .conversationId("session-" + sessionId + "-suspect-" + suspectId)
                .order(10)
                .build();

        // AI 응답 생성
        StringBuilder sb = new StringBuilder();
        chatClient.prompt()
                .system(systemMessage)
                .user(userMessage)
                .advisors(memoryAdvisor)
                .stream()
                .content()
                .doOnNext(sb::append)
                .blockLast();

        String reply = sb.toString();

        // DB에 대화 내역 저장은 ChatMemoryRepository가 자동 처리

        int responseLevel = usedClueId == null ? 1 : 2;
        int health = 100 - (usedClueId == null ? 5 : 3);
        Long revealedClueId = null;

        return new SuspectChatResponse(
                sessionId,
                suspectId,
                reply,
                responseLevel,
                health,
                revealedClueId
        );

    }

    @Override
    public DiscoveredClueResponse discoverClue(long sessionId, long clueId) {
        return null;
    }

    @Override
    public ClueListResponse getClues(long sessionId) {
        return null;
    }

    @Override
    public EventLogListResponse getLogs(long sessionId) {
        return null;
    }

    @Override
    public GameSaveResponse saveGame(long sessionId, GameSaveRequest request) {
        return null;
    }

    @Override
    public GameResumeResponse resumeGame(long sessionId) {
        return null;
    }

    @Override
    public FloorMoveResponse moveFloor(long sessionId) {
        return null;
    }

    @Override
    public BoardResponse getBoard(long sessionId) {
        return null;
    }

    @Override
    public BoardResponse addBoardNode(long sessionId, BoardNodeAddRequest request) {
        return null;
    }

    @Override
    public BoardResponse moveBoardNode(long sessionId, BoardItemMoveRequest request) {
        return null;
    }

    @Override
    public BoardResponse updateBoardMemo(long sessionId, long nodeId, BoardMemoUpdateRequest request) {
        return null;
    }

    @Override
    public BoardResponse addBoardConnection(long sessionId, BoardConnectionAddRequest request) {
        return null;
    }

    @Override
    public BoardResponse deleteBoard(long sessionId, BoardDeleteRequest request) {
        return null;
    }

    @Override
    public SubmitValidateResponse validateSubmit(long sessionId) {
        return null;
    }

    @Override
    public SubmitResponse submit(long sessionId, SubmitRequest request) {
        return null;
    }

    @Override
    public GameEndResponse endGame(long sessionId) {
        return null;
    }
}
