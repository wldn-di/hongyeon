package com.ssafy.s14p11a707.game.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.game.dto.*;
import com.ssafy.s14p11a707.game.service.GameSessionService;
import com.ssafy.s14p11a707.scenario.entity.Clue;
import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.scenario.entity.Suspect;
import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.scenario.repository.ClueRepository;
import com.ssafy.s14p11a707.scenario.repository.ScenarioRepository;
import com.ssafy.s14p11a707.scenario.repository.SuspectRepository;
import com.ssafy.s14p11a707.game.repository.GameSessionRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.ChatMemoryRepository;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.document.Document;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.ai.chat.client.advisor.api.Advisor;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.context.annotation.Primary;

@Primary
@Service
public class GameSessionServiceImpl implements GameSessionService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final ChatMemory chatMemory;
    private final SuspectRepository suspectRepository;
    private final ClueRepository clueRepository;
    private final ScenarioRepository scenarioRepository;
    private final GameSessionRepository gameSessionRepository;
    private final EmbeddingModel embeddingModel;

    public GameSessionServiceImpl(@Qualifier("genAiChatClient") ChatClient chatClient,
                                  ChatMemoryRepository chatMemoryRepository,
                                  VectorStore vectorStore,
                                  SuspectRepository suspectRepository,
                                  ClueRepository clueRepository,
                                  ScenarioRepository scenarioRepository,
                                  GameSessionRepository gameSessionRepository,
                                  EmbeddingModel embeddingModel) {
        this.chatClient = chatClient;
        this.vectorStore = vectorStore;
        this.suspectRepository = suspectRepository;
        this.clueRepository = clueRepository;
        this.scenarioRepository = scenarioRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.embeddingModel = embeddingModel;
        this.chatMemory = MessageWindowChatMemory.builder()
                .maxMessages(20) // 최근 20개 대화 기억
                .chatMemoryRepository(chatMemoryRepository) // PostgreSQL 저장소 사용
                .build();
    }

    /**
     * 코사인 유사도 계산
     * @param vec1 첫 번째 벡터
     * @param vec2 두 번째 벡터
     * @return 유사도 (0~1, 1이 가장 유사)
     */
    private float cosineSimilarity(float[] vec1, float[] vec2) {
        if (vec1 == null || vec2 == null || vec1.length != vec2.length) {
            return 0.0f;
        }

        float dotProduct = 0.0f;
        float norm1 = 0.0f;
        float norm2 = 0.0f;

        for (int i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        if (norm1 == 0.0f || norm2 == 0.0f) {
            return 0.0f;
        }

        return (float) (dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)));
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
                    - 하지만 당신에게 밝혀지면 안 되는 비밀이 있다면, 이를 숨기기 위해 거짓말을 할 수 있습니다.
                    - 진실을 말하되, 비밀과 관련된 내용은 회피하거나 거짓으로 말해도 됩니다.
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
        // 1. GameSession 조회
        GameSession gameSession = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("GameSession not found: " + sessionId));

        // 2. Scenario 조회
        Scenario scenario = gameSession.getScenario();

        // 3. motive 임베딩
        float[] motiveEmbedding = null;
        float motiveSimilarity = 0.0f;

        if (request.motive() != null && !request.motive().isBlank()) {
            // EmbeddingModel로 텍스트 임베딩
            var embeddingResult = embeddingModel.embed(request.motive());
            motiveEmbedding = embeddingResult.getResult().getOutput();

            // Scenario의 correctMotiveEmbedding과 유사도 계산
            float[] correctMotiveEmbedding = scenario.getCorrectMotiveEmbedding();
            if (correctMotiveEmbedding != null) {
                motiveSimilarity = cosineSimilarity(motiveEmbedding, correctMotiveEmbedding);
            }
        }


        // 5. GameSession에 임베딩 저장
        gameSession.setSubmittedMotiveEmbedding(motiveEmbedding);
        gameSessionRepository.save(gameSession);

        // 6. truthConfigJson에서 정답 확인
        JsonNode truthConfig = scenario.getTruthConfigJson();
        boolean culpritCorrect = false;
        boolean weaponCorrect = false;
        boolean locationCorrect = false;

        if (truthConfig != null) {
            long correctCulpritId = truthConfig.has("culpritSuspectId")
                    ? truthConfig.get("culpritSuspectId").asLong() : 0;
            long correctWeaponClueId = truthConfig.has("weaponClueId")
                    ? truthConfig.get("weaponClueId").asLong() : 0;
            int correctLocationFloor = truthConfig.has("locationFloor")
                    ? truthConfig.get("locationFloor").asInt() : 0;

            culpritCorrect = (request.culpritId() == correctCulpritId);
            weaponCorrect = (request.weaponClueId() == correctWeaponClueId);
            locationCorrect = (request.locationFloor() == correctLocationFloor);
        }

        // 7. AI 코멘트 생성
        String aiComment = buildAiComment(culpritCorrect, weaponCorrect, locationCorrect,
                motiveSimilarity);

        // 8. 결과 반환
        return new SubmitResponse(
                sessionId,
                "COMPLETED",
                gameSession.getSubmitAttempts() != null ? gameSession.getSubmitAttempts() + 1 : 1,
                Instant.now(),
                0, // finalScore - 추후 계산 필요
                "C", // rankGrade - 추후 계산 필요
                new SubmitResponse.Evaluation(
                        culpritCorrect,
                        weaponCorrect,
                        locationCorrect,
                        motiveSimilarity,
                        aiComment
                )
        );
    }

    private String buildAiComment(boolean culpritCorrect, boolean weaponCorrect,
                                   boolean locationCorrect, float motiveSimilarity) {
        List<String> comments = new ArrayList<>();

        if (culpritCorrect && weaponCorrect && locationCorrect) {
            comments.add("범인, 흉기, 범행 장소를 정확히 맞혔습니다!");
        } else {
            if (!culpritCorrect) comments.add("범인 추리가 다릅니다.");
            if (!weaponCorrect) comments.add("흉기 추리가 다릅니다.");
            if (!locationCorrect) comments.add("범행 장소 추리가 다릅니다.");
        }

        if (motiveSimilarity >= 0.8f) {
            comments.add("동기 분석이 매우 정확합니다.");
        } else if (motiveSimilarity >= 0.5f) {
            comments.add("동기 분석이 부분적으로 맞습니다.");
        } else if (motiveSimilarity > 0.0f) {
            comments.add("동기 분석이 부정확합니다.");
        }

        return String.join(" ", comments);
    }

    @Override
    public GameEndResponse endGame(long sessionId) {
        return null;
    }
}
