package com.ssafy.s14p11a707.game.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.game.dto.*;
import com.ssafy.s14p11a707.game.entity.BoardConnection;
import com.ssafy.s14p11a707.game.entity.BoardConnection.ConnectionType;
import com.ssafy.s14p11a707.game.entity.BoardNode;
import com.ssafy.s14p11a707.game.entity.BoardNode.ItemType;
import com.ssafy.s14p11a707.game.entity.ChatMessage;
import com.ssafy.s14p11a707.game.entity.DiscoveredClue;
import com.ssafy.s14p11a707.game.entity.EventLog;
import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.game.entity.SessionSuspectState;
import com.ssafy.s14p11a707.game.entity.SessionSuspectStateId;
import com.ssafy.s14p11a707.game.entity.GameSession.RankGrade;
import com.ssafy.s14p11a707.game.repository.BoardConnectionRepository;
import com.ssafy.s14p11a707.game.repository.BoardNodeRepository;
import com.ssafy.s14p11a707.game.repository.ChatMessageRepository;
import com.ssafy.s14p11a707.game.repository.DiscoveredClueRepository;
import com.ssafy.s14p11a707.game.repository.EventLogRepository;
import com.ssafy.s14p11a707.game.repository.GameSessionRepository;
import com.ssafy.s14p11a707.game.repository.SessionSuspectStateRepository;
import com.ssafy.s14p11a707.game.repository.ScenarioRankingRepository;
import com.ssafy.s14p11a707.game.entity.ScenarioRanking;
import com.ssafy.s14p11a707.scenario.entity.*;
import com.ssafy.s14p11a707.scenario.repository.*;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.repository.UserRepository;

import com.google.common.util.concurrent.RateLimiter;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;
import java.util.stream.Collectors;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.api.Advisor;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.ChatMemoryRepository;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DataIntegrityViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import static com.ssafy.s14p11a707.game.entity.BoardNode.ItemType.MEMO;
import static com.ssafy.s14p11a707.game.entity.EventLog.EventType.*;
import static com.ssafy.s14p11a707.game.entity.GameSession.Status.PLAYING;

@Slf4j
@Service
@Transactional(readOnly = true)
public class GameSessionServiceImpl implements GameSessionService {

    private final GameSessionRepository gameSessionRepository;
    private final SessionSuspectStateRepository sessionSuspectStateRepository;
    private final ScenarioRepository scenarioRepository;
    private final UserRepository userRepository;
    private final VictimRepository victimRepository;
    private final RoomRepository roomRepository;
    private final SuspectRepository suspectRepository;
    private final EventLogRepository eventLogRepository;
    private final DiscoveredClueRepository discoveredClueRepository;
    private final ClueRepository clueRepository;
    private final BoardNodeRepository boardNodeRepository;
    private final BoardConnectionRepository boardConnectionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ScenarioRankingRepository scenarioRankingRepository;
    private final ObjectMapper objectMapper;
    private final ChatClient chatClient;
    private final ChatClient chatChatClient;
    private final ChatMemoryRepository chatMemoryRepository;
    private final ChatMemory chatMemory;
    private final EmbeddingModel embeddingModel;
    private final TransactionTemplate txTemplate;
    private final RateLimiter chatRateLimiter;
    private final Semaphore chatSemaphore;
    private final ConcurrentHashMap<String, String> systemPromptCache = new ConcurrentHashMap<>();
    @PersistenceContext
    private EntityManager entityManager;

    public GameSessionServiceImpl(
            GameSessionRepository gameSessionRepository,
            SessionSuspectStateRepository sessionSuspectStateRepository,
            ScenarioRepository scenarioRepository,
            UserRepository userRepository,
            VictimRepository victimRepository,
            RoomRepository roomRepository,
            SuspectRepository suspectRepository,
            EventLogRepository eventLogRepository,
            DiscoveredClueRepository discoveredClueRepository,
            ClueRepository clueRepository,
            BoardNodeRepository boardNodeRepository,
            BoardConnectionRepository boardConnectionRepository,
            ChatMessageRepository chatMessageRepository,
            ScenarioRankingRepository scenarioRankingRepository,
            ObjectMapper objectMapper,
            ChatClient chatClient,
            @Qualifier("chatChatClient") ChatClient chatChatClient,
            ChatMemoryRepository chatMemoryRepository,
            EmbeddingModel embeddingModel,
            PlatformTransactionManager txManager,
            @Qualifier("chatRateLimiter") RateLimiter chatRateLimiter,
            @Qualifier("chatConcurrencySemaphore") Semaphore chatSemaphore) {
        this.gameSessionRepository = gameSessionRepository;
        this.sessionSuspectStateRepository = sessionSuspectStateRepository;
        this.scenarioRepository = scenarioRepository;
        this.userRepository = userRepository;
        this.victimRepository = victimRepository;
        this.roomRepository = roomRepository;
        this.suspectRepository = suspectRepository;
        this.eventLogRepository = eventLogRepository;
        this.discoveredClueRepository = discoveredClueRepository;
        this.clueRepository = clueRepository;
        this.boardNodeRepository = boardNodeRepository;
        this.boardConnectionRepository = boardConnectionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.scenarioRankingRepository = scenarioRankingRepository;
        this.objectMapper = objectMapper;
        this.chatClient = chatClient;
        this.chatChatClient = chatChatClient;
        this.chatMemoryRepository = chatMemoryRepository;
        this.chatMemory = MessageWindowChatMemory.builder()
                .maxMessages(10)
                .chatMemoryRepository(chatMemoryRepository)
                .build();
        this.embeddingModel = embeddingModel;
        this.txTemplate = new TransactionTemplate(txManager);
        this.chatRateLimiter = chatRateLimiter;
        this.chatSemaphore = chatSemaphore;
    }

    /**
     * 게임 시작 및 관리 섹션
     * 세션 없음 : createSession()
     * Playing : resumeGame API 호출
     * Completed/Failed : 세션 데이터 삭제 후 해당 세션 재사용(세션 연관 테이블은 sumbit()에서 세션 실패/성공 시점에 이미 삭제됨)
     *
     */
    @Override
    @Transactional
    public GameStartResponse startGame(long scenarioId, long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));
        Scenario scenario = getValidScenario(scenarioId);

        Optional<GameSession> existingSession = gameSessionRepository
                .findByUserIdAndScenarioId(user.getId(), scenarioId);

        if (existingSession.isPresent()) {
            GameSession session = existingSession.get();

            if (session.getStatus() == PLAYING) {
                // TODO: 프론트에서 resumeGame API 호출
                return GameStartResponse.alreadyPlaying(session);
            } else {
                // COMPLETED | FAILED -> 세션 연관테이블은 이미 성공,실패시 초기화됨(submit)
                // 체력, 상태 등 초기화
                session.reset(objectMapper.valueToTree(List.of(1)));

                EventLog startLog = saveEventLog(session, GAME_START, null);
                return buildStartResponse(session, scenario, startLog);
            }
        }

        // 첫 플레이 - 새 세션 생성
        GameSession session = createNewSession(user, scenario);
        EventLog startLog = saveEventLog(session, GAME_START, null);
        scenario.incrementPlayCount();
        user.incrementTotalAttempts();

        return buildStartResponse(session, scenario, startLog);
    }

    /**
     *  사용 X(프론트 API 호출 삭제)
     */
    @Override
    @Transactional
    public GameStartResponse restartGame(long scenarioId, long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));
        Scenario scenario = getValidScenario(scenarioId);

        Optional<GameSession> existingSession = gameSessionRepository
                .findByUserIdAndScenarioId(user.getId(), scenarioId);

        GameSession session;
        if (existingSession.isPresent()) {
            session = existingSession.get();
            if(session.getStatus() == PLAYING) {
                resetSession(session);
                session = getSession(session.getId());
            }
            session.reset(objectMapper.valueToTree(List.of(1)));

        } else {
            session = createNewSession(user, scenario);
            scenario.incrementPlayCount();
            user.incrementTotalAttempts();
        }

        EventLog startLog = saveEventLog(session, GAME_START, null);
        return buildStartResponse(session, scenario, startLog);
    }

    private GameSession createNewSession(User user, Scenario scenario) {
        GameSession session = GameSession.builder()
                .scenario(scenario)
                .user(user)
                .status(PLAYING)
                .currentFloor(1)
                .visitedFloorsJson(objectMapper.valueToTree(List.of(1)))
                .health(100)
                .submitAttempts(0)
                .hasCleared(false)
                .startedAt(Instant.now())
                .playTime(0L)
                .lastSavedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(7 * 24 * 60 * 60))
                .build();
        gameSessionRepository.save(session);
        return session;
    }

    /**
     *  세션 연관 테이블 삭제 cf)세션테이블 데이터 삭제 : session.reset(@Param 방문 층수)
     */
    private void resetSession(GameSession session) {
        boardConnectionRepository.deleteBySessionId(session.getId());
        boardNodeRepository.deleteBySessionId(session.getId());
        discoveredClueRepository.deleteBySessionId(session.getId());
        chatMessageRepository.deleteBySessionId(session.getId());
        eventLogRepository.deleteBySessionId(session.getId());
        sessionSuspectStateRepository.deleteBySessionId(session.getId());

        gameSessionRepository.save(session);
    }

    private GameStartResponse buildStartResponse(GameSession session, Scenario scenario, EventLog startLog) {
        Victim victim = victimRepository.findByScenarioId(scenario.getId()).orElse(null);
        Room room = roomRepository.findByScenarioIdAndFloorNumber(scenario.getId(), 1).orElse(null);
        return GameStartResponse.from(session, scenario, victim, room, startLog);
    }

    /**
     *
     * PLAYING 세션 이어하기 : 현 세션 정보
     * 프론트 추가 API 호출 필요
     * - getClues API : 발견한 단서 정보
     * - getBoard API : 추리보드 정보
     * - getLogs API : 수사로그 정보
     * - getChatLogs API : 용의자 심문 내역
     */
    @Override
    @Transactional
    public GameResumeResponse resumeGame(long sessionId) {
        GameSession session = getSession(sessionId);

        // PLAYING이 아니라면 예외
        if (session.getStatus() != PLAYING) {
            throw new BaseException(ErrorCode.INVALID_SESSION_STATUS);
        }

        List<Integer> visitedFloors = parseVisitedFloors(session.getVisitedFloorsJson());

        return GameResumeResponse.from(session, visitedFloors);
    }

    /**
     * 단서 섹션
     */
    @Override
    @Transactional
    public DiscoveredClueResponse discoverClue(long sessionId, long clueId) {
        GameSession session = getSession(sessionId);
        validatePlaying(session);

        Clue clue = clueRepository.findById(clueId)
                .orElseThrow(() -> new BaseException(ErrorCode.CLUE_NOT_FOUND));

        if (clue.getScenario().getId() != session.getScenario().getId()) {
            throw new BaseException(ErrorCode.INVALID_INPUT_VALUE);
        }

        if (clue.getRoom() != null) {
            int currentFloor = session.getCurrentFloor() != null ? session.getCurrentFloor() : 1;
            if (clue.getRoom().getFloorNumber() != currentFloor) {
                throw new BaseException(ErrorCode.INVALID_INPUT_VALUE);
            }
        }
        // 이미 발견된 단서면 기존 정보 반환
        Optional<DiscoveredClue> existing = discoveredClueRepository.findBySessionIdAndClueId(sessionId, clueId);
        if (existing.isPresent()) {
            return DiscoveredClueResponse.from(sessionId, clue, existing.get().getDiscoveredAt());
        }

        Instant now = Instant.now();
        saveDiscoveredClue(session,clue,now);
        saveEventLog(session,CLUE_FOUND, clue.getName());

        long delta = session.updateProgress();
        if (delta > 0) {
            userRepository.incrementTotalPlayTime(session.getUser().getId(), delta);
        }

        return DiscoveredClueResponse.from(sessionId, clue, now);
    }

    private void saveDiscoveredClue(GameSession session, Clue clue, Instant now) {
        DiscoveredClue discoveredClue = DiscoveredClue.builder()
                .session(session)
                .clue(clue)
                .discoveredAt(now)
                .build();
        try {
            discoveredClueRepository.save(discoveredClue);
        } catch (DataIntegrityViolationException ex) {
            // 동시 요청으로 이미 저장됐으면 무시
            if (discoveredClueRepository.findBySessionIdAndClueId(session.getId(), clue.getId()).isEmpty()) {
                throw ex;
            }
        }
    }

    @Override
    public ClueListResponse getDiscoveredClues(long sessionId) {
        GameSession session = getSession(sessionId);

        List<DiscoveredClue> discoveredClues = discoveredClueRepository
                .findBySessionIdWithClue(sessionId);
        Map<Long, DiscoveredClue> discoveredByClueId = discoveredClues.stream()
                .collect(Collectors.toMap(dc -> dc.getClue().getId(), dc -> dc));
        long scenarioId = session.getScenario().getId();
        List<Clue> allClues = clueRepository.findByScenarioIdWithRoom(scenarioId);
        if (allClues.isEmpty()) {
            // Defensive fallback: in case fetch-join query behaves unexpectedly (e.g., nullable room),
            // still return clues rather than an empty list.
            allClues = clueRepository.findByScenarioId(scenarioId);
            allClues = allClues.stream()
                    .sorted(Comparator
                            .comparingInt((Clue clue) -> clue.getRoom() != null ? clue.getRoom().getFloorNumber() : Integer.MAX_VALUE)
                            .thenComparingLong(Clue::getId))
                    .toList();
        }

        return ClueListResponse.from(
                sessionId,
                scenarioId,
                allClues,
                discoveredByClueId
        );
    }

    @Override
    public ClueDetailResponse getDiscoveredClue(long sessionId, long clueId) {
        getSession(sessionId);

        DiscoveredClue discoveredClue = discoveredClueRepository
                .findBySessionIdAndClueIdWithClue(sessionId, clueId)
                .orElseThrow(() -> new BaseException(ErrorCode.CLUE_NOT_FOUND));

        return ClueDetailResponse.from(discoveredClue);
    }

    /**
     * 채팅/심문 섹션
     */
    // TODO : session.updateProgress(), saveEventLog() 필요
    // ── 채팅 Phase 간 데이터 전달 레코드 ──
    private record ChatContext(
            long sessionId,
            long suspectId,
            String suspectName,
            String systemMessage,
            String userMessage,
            String conversationId,
            boolean shouldUpgradeLevel,
            boolean stateExists,
            int responseLevel,
            Long usedClueId) {}

    private record AiChatResult(
            String reply,
            boolean keyTalk) {}

    /**
     * 용의자 채팅 - 트랜잭션 3단계 분리.
     * <p>
     * Phase 1 (Read TX ~50ms): DB 로드 + 프롬프트 구성<br>
     * Phase 2 (No TX): AI API 호출 (DB 커넥션 미점유)<br>
     * Phase 3 (Write TX ~30ms): 결과 저장
     */
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public SuspectChatResponse chatWithSuspect(long sessionId, long suspectId, SuspectChatRequest request) {

        // ── Phase 1: 데이터 로드 + 프롬프트 구성 (짧은 트랜잭션) ──
        ChatContext ctx = txTemplate.execute(status -> {
            GameSession session = getSession(sessionId);
            validatePlaying(session);

            int currentHealth = session.getHealth() != null ? session.getHealth() : 100;
            if (currentHealth <= 0) {
                throw new BaseException(ErrorCode.HEALTH_DEPLETED);
            }

            Suspect suspect = suspectRepository.findById(suspectId)
                    .orElseThrow(() -> new BaseException(ErrorCode.SUSPECT_NOT_FOUND));

            // aiConfigJson 파싱
            JsonNode aiConfig = suspect.getAiConfigJson();
            String personality = aiConfig != null && aiConfig.has("personality")
                    ? aiConfig.get("personality").asText() : "내성적이고 감정 기복이 심함";
            String speechStyle = aiConfig != null && aiConfig.has("speechStyle")
                    ? aiConfig.get("speechStyle").asText() : "정중하지만 불안한 말투";

            String level1_lie = "알리바이: 사건 시간에 다른 장소에 있었습니다.";
            String level2_weak = "알리바이가 깨지며 당황하는 상태입니다.";
            Long weaknessClueId = null;
            if (aiConfig != null && aiConfig.has("secret")) {
                JsonNode secret = aiConfig.get("secret");
                if (secret.has("alibi_progression")) {
                    JsonNode ap = secret.get("alibi_progression");
                    if (ap.has("level1_lie")) level1_lie = ap.get("level1_lie").asText();
                    if (ap.has("level2_partial")) level2_weak = ap.get("level2_partial").asText();
                }
                if (secret.has("weakness_clue") && secret.get("weakness_clue").has("id")) {
                    weaknessClueId = secret.get("weakness_clue").get("id").asLong();
                }
            }

            // SessionSuspectState 조회 (없으면 기본값 사용, 생성은 Phase 3에서)
            SessionSuspectStateId stateId = new SessionSuspectStateId(session.getId(), suspect.getId());
            Optional<SessionSuspectState> stateOpt = sessionSuspectStateRepository.findById(stateId);
            boolean stateExists = stateOpt.isPresent();
            int currentLevel = stateOpt.map(SessionSuspectState::getCurrentInterrogationLevel).orElse(1);

            Long usedClueId = request.usedClueId();
            boolean isWeaknessClueUsed = currentLevel >= 2;
            boolean shouldUpgradeLevel = false;

            if (!isWeaknessClueUsed && usedClueId != null && weaknessClueId != null) {
                if (usedClueId.equals(weaknessClueId)) {
                    isWeaknessClueUsed = true;
                    shouldUpgradeLevel = true;
                }
            }

            int effectiveLevel = shouldUpgradeLevel ? 2 : currentLevel;

            // computeIfAbsent 람다에서 캡처할 수 있도록 effectively final 복사본 사용
            final String fLevel1Lie = level1_lie;
            final String fLevel2Weak = level2_weak;
            final boolean fIsWeaknessClueUsed = isWeaknessClueUsed;

            // 시스템 프롬프트 캐싱 (scenarioId + suspectId + level 조합)
            String cacheKey = session.getScenario().getId() + ":" + suspectId + ":" + effectiveLevel + ":" + suspect.isCulprit();
            String systemMessage = systemPromptCache.computeIfAbsent(cacheKey, k -> {
                String scenarioContext = buildScenarioContext(session.getScenario(), suspect);
                return buildSystemMessage(suspect, scenarioContext, personality, speechStyle,
                        fLevel1Lie, fLevel2Weak, fIsWeaknessClueUsed);
            });

            // 사용자 메시지 구성
            String userMessage = request.message() == null ? "" : request.message().trim();
            if (userMessage.isEmpty()) {
                userMessage = "(대화를 시작합니다)";
            }
            if (usedClueId != null) {
                Clue clue = clueRepository.findById(usedClueId).orElse(null);
                if (clue != null) {
                    userMessage = String.format("[단서 제시: %s - %s] %s", clue.getName(), clue.getDescription(), userMessage);
                } else {
                    userMessage = String.format("[단서 ID %d를 제시하며] %s", usedClueId, userMessage);
                }
            }

            String conversationId = "session-" + sessionId + "-suspect-" + suspectId;

            return new ChatContext(sessionId, suspectId, suspect.getName(), systemMessage, userMessage,
                    conversationId, shouldUpgradeLevel, stateExists, effectiveLevel, usedClueId);
        });

        // ── Phase 2: AI API 호출 (트랜잭션 없음, DB 커넥션 미점유) ──
        AiChatResult aiResult;
        chatSemaphore.acquireUninterruptibly();
        try {
            chatRateLimiter.acquire();
            aiResult = callAi(ctx);
        } finally {
            chatSemaphore.release();
        }

        // ── Phase 3: 결과 저장 (짧은 트랜잭션) ──
        return txTemplate.execute(status -> {
            GameSession session = gameSessionRepository.findById(ctx.sessionId())
                    .orElseThrow(() -> new BaseException(ErrorCode.SESSION_NOT_FOUND));
            Suspect suspect = suspectRepository.findById(ctx.suspectId())
                    .orElseThrow(() -> new BaseException(ErrorCode.SUSPECT_NOT_FOUND));

            // SessionSuspectState 생성 또는 레벨 업그레이드
            SessionSuspectStateId stateId = new SessionSuspectStateId(ctx.sessionId(), ctx.suspectId());
            if (!ctx.stateExists()) {
                sessionSuspectStateRepository.save(SessionSuspectState.builder()
                        .session(session)
                        .suspect(suspect)
                        .currentInterrogationLevel(ctx.shouldUpgradeLevel() ? 2 : 1)
                        .secretRevealed(false)
                        .build());
            } else if (ctx.shouldUpgradeLevel()) {
                SessionSuspectState state = sessionSuspectStateRepository.findById(stateId).orElseThrow();
                state.setCurrentInterrogationLevel(2);
                sessionSuspectStateRepository.save(state);
            }

            // 채팅 메시지 저장
            chatMessageRepository.save(ChatMessage.builder()
                    .session(session).suspect(suspect)
                    .role("user").content(ctx.userMessage())
                    .usedClueId(ctx.usedClueId()).responseLevel(null).keyTalk(false)
                    .build());
            chatMessageRepository.save(ChatMessage.builder()
                    .session(session).suspect(suspect)
                    .role("suspect").content(aiResult.reply())
                    .usedClueId(null).responseLevel(ctx.responseLevel()).keyTalk(aiResult.keyTalk())
                    .build());

            // 원자적 Health 감소 (동시성 안전)
            gameSessionRepository.decrementHealth(ctx.sessionId(), 5);
            Integer updatedHealth = gameSessionRepository.findHealthById(ctx.sessionId());

            long delta = session.updateProgress();
            if (delta > 0) {
                userRepository.incrementTotalPlayTime(session.getUser().getId(), delta);
            }
            saveEventLog(session, CHAT_STARTED, ctx.suspectName());

            return new SuspectChatResponse(
                    ctx.sessionId(), ctx.suspectId(),
                    aiResult.reply(), ctx.responseLevel(),
                    updatedHealth != null ? updatedHealth : 0, null);
        });
    }

    /**
     * AI API 호출 (트랜잭션 외부에서 실행)
     */
    private AiChatResult callAi(ChatContext ctx) {
        Advisor memoryAdvisor = MessageChatMemoryAdvisor.builder(chatMemory)
                .conversationId(ctx.conversationId())
                .order(10)
                .build();

        StringBuilder sb = new StringBuilder();
        chatChatClient.prompt()
                .system(ctx.systemMessage())
                .user(ctx.userMessage())
                .advisors(memoryAdvisor)
                .stream()
                .content()
                .doOnNext(sb::append)
                .blockLast();

        String fullResponse = sb.toString().trim();
        if (fullResponse.isEmpty()) {
            log.warn("AI가 빈 응답을 반환했습니다. conversationId={}", ctx.conversationId());
            return new AiChatResult("(응답을 생성하지 못했습니다. 다시 시도해 주세요.)", false);
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
            log.warn("KEY_TALK 메타데이터가 없습니다. 기본값 false 사용.");
        }

        return new AiChatResult(reply, keyTalk);
    }

    /**
     * 시스템 프롬프트 빌드 (캐싱 대상)
     */
    private String buildSystemMessage(Suspect suspect, String scenarioContext, String personality,
                                      String speechStyle, String level1_lie, String level2_weak, boolean isWeaknessClueUsed) {
        String behaviorGuideline = suspect.isCulprit()
                ? """
                    - 당신은 범인입니다. 절대 인정하지 마세요.
                    - 흉기/살해 증거가 연결되면 음모론을 제기하거나 가짜 알리바이를 고수하세요.
                    - 부정할 수 없는 증거만 인정하고, 역으로 무죄를 주장하세요.
                    - 궁지에 몰릴수록 더 논리적으로 반박하세요.
                    """
                : """
                    - 당신은 무고하지만 치명적인 사생활(비리, 추문 등)이 있습니다.
                    - 비밀 관련 단서에는 당황하거나 거짓말로 비밀을 보호하세요.
                    - 흉기에 대해서는 결백을 주장하세요.
                    - 의심받으면 다른 수상한 인물에 대해 실토할 수 있습니다.
                    """;

        String interrogationProtocol = isWeaknessClueUsed
                ? String.format("""
                    ## 현재 심문 상태: Level 2 (심리적 균열)
                    약점 단서가 제시되어 논리가 깨지기 시작했습니다.
                    **알리바이 응답 지침:** %s
                    - 비밀 관련 단어가 언급되면 부분적으로 실토하세요.
                    - 당황하고 동요하는 태도를 보이세요.
                    """, level2_weak)
                : String.format("""
                    ## 현재 심문 상태: Level 1 (알리바이 고수)
                    약점 단서가 아직 없습니다. 비밀을 절대 직접 언급하지 마세요.
                    **알리바이 응답 지침:** %s
                    - 차분하게 의심을 회피하세요.
                    """, level1_lie);

        return String.format("""
                당신은 용의자 '%s'입니다.

                ## 시나리오 배경 정보
                %s

                ## 인적 사항
                - 나이: %d세 / 성별: %s / 직업: %s
                - 특징: %s / 성격: %s / 말투: %s

                ## 당신의 은밀한 동기
                %s

                ## 행동 지침
                %s

                ## 단서 대응 규칙
                - 현재 질문에만 답변하세요. 질문 범위를 벗어나는 정보를 제공하지 마세요.
                - 본인 소유 물건이면 인정하되 사건과 무관한 서사를 만드세요.
                - 특정인을 범인으로 단정짓거나 흉기를 확정하지 마세요.
                - 단서로 결론 내리지 말고 논리적으로 방어하세요.
                - 모순 지적이나 핵심 키워드 언급 시 점진적으로 실토하세요.

                %s

                ## 심문 규칙
                1. 이전 대화 모순을 기억하고, 지적당하면 당황하며 말을 바꾸세요.
                2. 철저히 용의자 본인으로서만 대화하세요.
                3. 답변은 간결하되, 다음 질문을 유도하는 의문점을 남기세요.
                4. 시나리오 외부 정보(날씨, 뉴스 등) 질문은 거부하세요.

                주의: 유저가 충분한 논리적 근거를 제시하기 전까지 정보를 쉽게 내어주지 마세요.

                ## 응답 형식
                답변 후 반드시 줄바꿈하고 [KEY_TALK: true 또는 false]를 표시하세요.
                - [KEY_TALK: true]: 중요 정보 포함 (단서 관련, 범행 시인, 비밀 실토)
                - [KEY_TALK: false]: 일반적인 부인, 회피, 무관한 대화
                """,
                suspect.getName(),
                scenarioContext,
                suspect.getAge() != null ? suspect.getAge() : 30,
                suspect.getGender() != null ? suspect.getGender() : "알 수 없음",
                suspect.getOccupation() != null ? suspect.getOccupation() : "없음",
                suspect.getOneLiner() != null ? suspect.getOneLiner() : "없음",
                personality, speechStyle,
                suspect.getMotive() != null ? suspect.getMotive() : "없음",
                behaviorGuideline,
                interrogationProtocol);
    }


    /**
     * 시나리오 정보를 문자열로 빌드
     * chatWithSuspect 호출 시 시나리오 정보를 프롬프트에 직접 포함하기 위해 사용
     *
     * @param scenario 시나리오
     * @param currentSuspect 현재 심문 중인 용의자 (이 용의자에게만 secret과 timeline_alibi 노출)
     */
    /**
     * 시나리오 컨텍스트를 슬림하게 빌드 (현재 심문 용의자 정보만 포함).
     * <p>다른 용의자 목록 조회를 생략하여 DB 조회 1회 절감, 토큰 사용량 ~40% 감소.</p>
     */
    private String buildScenarioContext(Scenario scenario, Suspect currentSuspect) {
        StringBuilder ctx = new StringBuilder();

        // 1. 상세 줄거리
        ctx.append("## 상세 줄거리\n");
        if (scenario.getSynopsisDetail() != null && !scenario.getSynopsisDetail().isBlank()) {
            ctx.append(scenario.getSynopsisDetail()).append("\n");
        }

        // 2. 현재 용의자 상세 정보만 포함 (다른 용의자 조회 생략)
        ctx.append("## 당신의 정보\n");
        ctx.append(String.format("- %s (나이: %d, 성별: %s, 직업: %s)\n",
                currentSuspect.getName(),
                currentSuspect.getAge() != null ? currentSuspect.getAge() : 0,
                currentSuspect.getGender() != null ? currentSuspect.getGender() : "알 수 없음",
                currentSuspect.getOccupation() != null ? currentSuspect.getOccupation() : "알 수 없음"));

        JsonNode aiConfig = currentSuspect.getAiConfigJson();
        if (aiConfig != null) {
            if (aiConfig.has("relationship")) {
                ctx.append("  관계: ").append(aiConfig.get("relationship").asText()).append("\n");
            }
            if (aiConfig.has("secret")) {
                JsonNode secret = aiConfig.get("secret");
                if (secret.has("title")) ctx.append("  비밀: ").append(secret.get("title").asText()).append("\n");
                if (secret.has("content")) ctx.append("    ").append(secret.get("content").asText()).append("\n");
            }
            if (aiConfig.has("timeline_alibi")) {
                JsonNode timelineAlibi = aiConfig.get("timeline_alibi");
                if (timelineAlibi.isArray() && !timelineAlibi.isEmpty()) {
                    ctx.append("  알리바이 타임라인 (내부 참고용):\n");
                    for (JsonNode alibi : timelineAlibi) {
                        ctx.append(String.format("    - %s: %s (활동: %s)\n",
                                alibi.has("time") ? alibi.get("time").asText() : "",
                                alibi.has("location") ? alibi.get("location").asText() : "",
                                alibi.has("activity") ? alibi.get("activity").asText() : ""));
                    }
                }
            }
        }

        // 3. 피해자 정보
        Victim victim = victimRepository.findByScenarioId(scenario.getId()).orElse(null);
        if (victim != null) {
            ctx.append("\n## 피해자 정보\n");
            ctx.append(String.format("- %s (%d세, %s, %s)\n- 발견: %s / 사인: %s\n",
                    victim.getName(),
                    victim.getAge() != null ? victim.getAge() : 0,
                    victim.getGender() != null ? victim.getGender() : "알 수 없음",
                    victim.getOccupation() != null ? victim.getOccupation() : "알 수 없음",
                    victim.getDiscoveryLocation() != null ? victim.getDiscoveryLocation() : "",
                    victim.getCauseOfDeath() != null ? victim.getCauseOfDeath() : ""));
        }

        return ctx.toString();
    }


    // TODO : 테스트 필요
    @Override
    public ChatHistoryResponse getChatHistory(long sessionId, long suspectId) {
        GameSession session = getSession(sessionId);

        Suspect suspect = suspectRepository.findById(suspectId)
                .orElseThrow(() -> new BaseException(ErrorCode.SUSPECT_NOT_FOUND));

        if (suspect.getScenario().getId() != session.getScenario().getId()) {
            throw new BaseException(ErrorCode.INVALID_INPUT_VALUE);
        }

        List<ChatMessage> messages = chatMessageRepository
                .findBySessionIdAndSuspectIdOrderByCreatedAtAsc(sessionId, suspectId);

        return ChatHistoryResponse.from(sessionId, suspectId, messages);
    }

    /**
     * 수사로그 섹션
     */
    // TODO : 테스트 필요
    @Override
    public EventLogListResponse getLogs(long sessionId) {
        getSession(sessionId);

        List<EventLog> logs = eventLogRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        return EventLogListResponse.from(sessionId, logs);
    }

    /**
     * 층 이동 섹션
     */
    @Override
    @Transactional
    public FloorMoveResponse moveFloor(long sessionId, FloorMoveRequest request) {
        GameSession session = getSession(sessionId);
        validatePlaying(session);
        Scenario scenario = session.getScenario();

        if (request == null) {
            throw new BaseException(ErrorCode.INVALID_INPUT_VALUE);
        }

        int targetFloor = request.targetFloor();
        int minFloor = 1;
        int maxFloor = 6;

        if (targetFloor < minFloor || targetFloor > maxFloor) {
            throw new BaseException(ErrorCode.INVALID_INPUT_VALUE);
        }

        List<Integer> visitedFloors = parseVisitedFloors(session.getVisitedFloorsJson());
        boolean isFirstVisit = !visitedFloors.contains(targetFloor);

        if (isFirstVisit) {
            visitedFloors = new ArrayList<>(visitedFloors);
            visitedFloors.add(targetFloor);
        }

        session.moveFloor(targetFloor, objectMapper.valueToTree(visitedFloors));

        Room room = roomRepository.findByScenarioIdAndFloorNumber(scenario.getId(), targetFloor)
                .orElseThrow(() -> new BaseException(ErrorCode.ROOM_NOT_FOUND));

        EventLog newLog = null;
        if (isFirstVisit) {
            saveEventLog(session,FLOOR_MOVED, String.valueOf(targetFloor));
        }
        long delta = session.updateProgress();
        if (delta > 0) {
            userRepository.incrementTotalPlayTime(session.getUser().getId(), delta);
        }

        return FloorMoveResponse.from(sessionId, targetFloor, isFirstVisit, room, newLog);
    }

    /**
     * 추리보드 섹션
     */
    @Override
    public BoardResponse getBoard(long sessionId) {
        getSession(sessionId);

        return buildBoardResponse(sessionId);
    }

    @Override
    @Transactional
    public BoardResponse saveBoard(long sessionId, BoardSaveRequest request) {
        GameSession session = getSession(sessionId);

        // 1. 기존 연결선 전체 삭제
        boardConnectionRepository.deleteBySessionId(sessionId);

        // 2. 기존 노드 전체 삭제
        boardNodeRepository.deleteBySessionId(sessionId);

        // 3. 새 노드 저장
        List<BoardNode> savedNodes = new ArrayList<>();

        if (request.nodes() != null) {
            for (var nodeReq : request.nodes()) {
                BoardNode node = BoardNode.builder()
                        .session(session)
                        .itemType(parseItemType(nodeReq.type()))
                        .targetId(nodeReq.targetId())
                        .memoContent(nodeReq.memoContent())
                        .positionX(nodeReq.x())
                        .positionY(nodeReq.y())
                        .build();
                savedNodes.add(boardNodeRepository.save(node));
            }
        }

        // 4. 새 연결선 저장 (fromIndex/toIndex -> 실제 노드 매핑)
        if (request.connections() != null) {
            for (var connReq : request.connections()) {
                if (connReq.fromIndex() < 0 || connReq.fromIndex() >= savedNodes.size() ||
                        connReq.toIndex() < 0 || connReq.toIndex() >= savedNodes.size()) {
                    continue; // 잘못된 인덱스 무시
                }

                BoardNode fromNode = savedNodes.get(connReq.fromIndex());
                BoardNode toNode = savedNodes.get(connReq.toIndex());

                BoardConnection connection = BoardConnection.builder()
                        .session(session)
                        .fromNode(fromNode)
                        .toNode(toNode)
                        .connectionType(parseConnectionType(connReq.type()))
                        .build();
                boardConnectionRepository.save(connection);
            }
        }

        long delta = session.updateProgress();
        if (delta > 0) {
            userRepository.incrementTotalPlayTime(session.getUser().getId(), delta);
        }

        return buildBoardResponse(sessionId);
    }


    private BoardResponse buildBoardResponse(long sessionId) {
        List<BoardNode> nodes = boardNodeRepository.findBySessionId(sessionId);
        List<BoardConnection> connections = boardConnectionRepository.findBySessionIdWithNodes(sessionId);

        int redCount = (int) connections.stream()
                .filter(c -> c.getConnectionType() == ConnectionType.RED)
                .count();

        return BoardResponse.from(sessionId, nodes, connections, redCount);
    }

    private ItemType parseItemType(String type) {
        if (type == null || type.isBlank()) {
            return MEMO;
        }
        try {
            return ItemType.valueOf(type.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return MEMO;
        }
    }

    private ConnectionType parseConnectionType(String type) {
        if (type == null || type.isBlank()) {
            return ConnectionType.RED;
        }
        try {
            return ConnectionType.valueOf(type.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return ConnectionType.RED;
        }
    }

    /**
     * 수사보고서 섹션
     */
    @Override
    @Transactional
    public InvestigationReportResponse getInvestigationReport(long sessionId) {
        GameSession session = getSession(sessionId);

        JsonNode report = session.getResultReportJson();
        if (report == null) {
            throw new BaseException(ErrorCode.REPORT_NOT_FOUND);
        }
        return InvestigationReportResponse.from(session, report);
    }

    // TODO: 테스트 필요
    @Override
    public InvestigationReportResponse getOtherInvestigationReport(long sessionId) {
        GameSession session = getSession(sessionId);

        JsonNode report = session.getResultReportJson();
        if (report == null) {
            throw new BaseException(ErrorCode.REPORT_NOT_FOUND);
        }

        return InvestigationReportResponse.from(session, report);
    }

    /**
     * 제출 세션
     */

    @Override
    @Transactional
    public SubmitResponse submit(long sessionId, SubmitRequest request) {

        GameSession session = getSession(sessionId);
        User user = session.getUser();

        // 마지막 플레이타임 delta 누적
        long lastDelta = session.updateProgress();
        if (lastDelta > 0) {
            userRepository.incrementTotalPlayTime(user.getId(), lastDelta);
        }

        int attempts = session.getSubmitAttempts();

        // 1. 게임 상태 확인
        if (session.getStatus() != PLAYING) {
            return SubmitResponse.boardInvalid(sessionId, "NOT_PLAYING",
                    "진행 중인 게임이 아닙니다.", attempts);
        }

        // 3. 보드 검증: RED 연결 개수 확인 (정확히 3개)
        int redCount = boardConnectionRepository.countBySessionAndConnectionType(session, ConnectionType.RED);
        if (redCount != 3) {
            return SubmitResponse.boardInvalid(sessionId, "INVALID_RED_COUNT",
                    "붉은 실 연결이 3개여야 합니다. (현재: " + redCount + "개)", attempts);
        }

        // 4. 보드 검증: 4가지 타입 모두 RED로 연결되어 있는지 확인
        List<BoardConnection> redConnections = boardConnectionRepository
                .findBySessionAndConnectionType(session, ConnectionType.RED);

        Set<ItemType> connectedTypes = new HashSet<>();
        for (BoardConnection conn : redConnections) {
            connectedTypes.add(conn.getFromNode().getItemType());
            connectedTypes.add(conn.getToNode().getItemType());
        }

        Set<ItemType> requiredTypes = EnumSet.of(
                ItemType.VICTIM, ItemType.SUSPECT, ItemType.LOCATION, ItemType.CLUE
        );

        if (!connectedTypes.containsAll(requiredTypes)) {
            Set<ItemType> missingTypes = EnumSet.copyOf(requiredTypes);
            missingTypes.removeAll(connectedTypes);
            return SubmitResponse.boardInvalid(sessionId, "INCOMPLETE_BOARD",
                    "모든 타입이 연결되어야 합니다. (미연결: " + missingTypes + ")", attempts);
        }

        //  Scenario 조회
        Scenario scenario = session.getScenario();

        // 3. truthConfigJson에서 정답 확인
        JsonNode truthConfig = scenario.getTruthConfigJson();
        boolean culpritCorrect = false;
        boolean weaponCorrect = false;
        boolean locationCorrect = false;

        if (truthConfig != null) {
            // 수정 (DB 스키마에 맞춤)
            long correctCulpritId = truthConfig.has("culprit_id")
                    ? truthConfig.get("culprit_id").asLong() : 0;
            long correctWeaponClueId = truthConfig.has("weapon_clue_id")
                    ? truthConfig.get("weapon_clue_id").asLong() : 0;
            int correctLocationFloor = truthConfig.has("location_floor")
                    ? truthConfig.get("location_floor").asInt() : 0;

            culpritCorrect = (request.culpritId() == correctCulpritId);
            weaponCorrect = (request.weaponClueId() == correctWeaponClueId);
            locationCorrect = (request.locationFloor() == correctLocationFloor);
        }

            // 범인 틀림 → 횟수 증가 + 게임화면으로
            if (!culpritCorrect) {
                session.incrementSubmitAttempts();
                attempts = session.getSubmitAttempts();

                // 3회 다 썼으면 FAILED
                if (attempts >= 3) {
                    session.failGame();
                    entityManager.flush();

                    resetSession(session);
                    session = getSession(sessionId);

                    // storyConfigJson에서 unsolved_monologue 추출
                    String unsolvedMonologue = extractNarration(scenario, "unsolved_monologue");
                    return SubmitResponse.failed(sessionId, session.getCompletedAt(),
                            "범인이 틀렸습니다. 최대 제출 횟수를 초과하여 게임이 종료되었습니다.",
                            unsolvedMonologue);
                }

                return SubmitResponse.wrongAnswer(sessionId, attempts,
                        "범인이 틀렸습니다. (남은 기회: " + (3 - attempts) + ")");
            }

        // 4. 범인 맞음 - motive 임베딩
        float[] motiveEmbedding=null;
        float motiveSimilarity = 0.0f;

        if (request.motive() != null && !request.motive().isBlank()) {
            // EmbeddingModel로 텍스트 임베딩
            motiveEmbedding = embeddingModel.embed(request.motive());

            // Scenario의 correctMotiveEmbedding과 유사도 계산
            String correctMotiveEmbeddingStr = scenario.getCorrectMotiveEmbedding();
            if (correctMotiveEmbeddingStr != null) {
                float[] correctMotiveEmbedding = parseVectorString(correctMotiveEmbeddingStr);
                motiveSimilarity = cosineSimilarity(motiveEmbedding, correctMotiveEmbedding);
            }
        }

        // GameSession에 제출한 동기 임베딩 저장
        //session.setSubmittedMotiveEmbedding(vectorToString(motiveEmbedding));}
        int motiveSimilarityPercent = Math.round(motiveSimilarity * 100);

        session.incrementSubmitAttempts();
        int newAttempts = session.getSubmitAttempts();

        // 점수 계산 및 게임 완료 처리
        int finalScore = calculateScore(session, motiveSimilarityPercent);
        RankGrade rankGrade = calculateRankGrade(finalScore);

        long clearTime = session.getPlayTime() != null ? session.getPlayTime() : 0;

        boolean hasCleared = session.getHasCleared();

        String aiComment = "";
        // 첫 클리어 시 랭킹 & 유저 통계 & 수사보고서 저장
        if (!hasCleared) {
            ScenarioRanking ranking = ScenarioRanking.builder()
                    .scenario(scenario)
                    .user(user)
                    .session(session)
                    .score(finalScore)
                    .clearTime(clearTime)
                    .rankGrade(ScenarioRanking.RankGrade.valueOf(rankGrade.name()))
                    .build();
            scenarioRankingRepository.save(ranking);

            user.addFirstClearStats(finalScore);

            aiComment = buildAiComment(culpritCorrect, weaponCorrect, locationCorrect, motiveSimilarity);
            int cluesCollected = discoveredClueRepository.countBySession(session);
            int totalInterrogations = chatMessageRepository.countBySessionAndRole(session, "user");
            // TODO: 추후 추가
            List<ChatMessage> keyTalkMessages =
                    chatMessageRepository.findBySessionIdAndKeyTalkTrueOrderByCreatedAtDesc(sessionId);

            ObjectNode report
                    = buildInvestigationReport(rankGrade.name(), finalScore, aiComment,totalInterrogations,cluesCollected,keyTalkMessages);

            session.saveReport(report);
        }
        // 재 클리어시 랭킹 및 유저 클리어타임과 등급, 클리어 횟수 반영X

        // 게임 성공 처리
        session.completeGame(finalScore, rankGrade);
        entityManager.flush();
        resetSession(session);

        // storyConfigJson에서 epilogue, culprit_monologue 추출
        String epilogue = extractNarration(scenario, "epilogue");
        String culpritMonologue = extractNarration(scenario, "culprit_monologue");

        // 성공 응답 반환
        return SubmitResponse.success(
                sessionId,
                newAttempts,
                session.getCompletedAt(),
                finalScore,
                rankGrade.name(),
                hasCleared,
                new SubmitResponse.Evaluation(culpritCorrect, weaponCorrect, locationCorrect, motiveSimilarityPercent, aiComment),
                epilogue,
                culpritMonologue
        );
    }

    /*
     * private 헬프 메서드 섹션
     */

    /**
     * 시나리오의 storyConfigJson에서 narration 필드 추출
     */
    private String extractNarration(Scenario scenario, String field) {
        try {
            JsonNode storyConfig = scenario.getStoryConfigJson();
            if (storyConfig == null) return null;

            JsonNode narration = storyConfig.path("narration");
            if (narration.isMissingNode()) return null;

            JsonNode value = narration.path(field);
            return value.isMissingNode() ? null : value.asText();
        } catch (Exception e) {
            log.warn("Failed to extract narration field '{}': {}", field, e.getMessage());
            return null;
        }
    }

    private ObjectNode buildInvestigationReport(
            String rankGrade, int finalScore,
            String aiComment,
            int totalInterrogations,
            int cluesCollected,
            List<ChatMessage> keyTalkMessages
    ) {
        ObjectNode report = objectMapper.createObjectNode();

        ObjectNode result = report.putObject("result");
        result.put("rank_grade", rankGrade);
        result.put("final_score",finalScore);
        result.put("ai_comment", aiComment);

        ObjectNode stats = report.putObject("stats");
        stats.put("total_interrogations", totalInterrogations);
        stats.put("clues_collected", cluesCollected);

        ArrayNode keyTalks = report.putArray("key_talks");
        for (ChatMessage msg : keyTalkMessages) {
            ObjectNode kt = keyTalks.addObject();
            kt.put("suspect_id", msg.getSuspect().getId());
            kt.put("suspect_name", msg.getSuspect().getName());
            kt.put("content", msg.getContent());
            kt.put("created_at", msg.getCreatedAt().toString());
        }
        return report;
    }

    private GameSession getSession(long sessionId) {
        return gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new BaseException(ErrorCode.SESSION_NOT_FOUND));
    }

    private void validatePlaying(GameSession session) {
        if (session.getStatus() != PLAYING) {
            throw new BaseException(ErrorCode.INVALID_INPUT_VALUE);
        }
    }

    private List<Integer> parseVisitedFloors(JsonNode json) {
        if (json == null || json.isNull()) {
            return new ArrayList<>();
        }
        List<Integer> floors = new ArrayList<>();
        if (json.isArray()) {
            for (JsonNode node : json) {
                floors.add(node.asInt());
            }
        }
        return floors;
    }

    private EventLog saveEventLog(GameSession session, EventLog.EventType type, String targetName) {
        String eventName;
        String displayMessage;

        switch (type) {
            case GAME_START -> {
                eventName = "게임 시작";
                displayMessage = "사건 파일이 열렸습니다.";
            }
            case GAME_END -> {
                eventName = "게임 종료";
                displayMessage = "수사를 종료합니다.";
            }
            case FLOOR_MOVED -> {
                eventName = "층 이동";
                displayMessage = targetName + "층으로 이동했습니다.";
            }
            case CLUE_FOUND -> {
                eventName = "단서 발견";
                displayMessage = targetName + " 단서를 발견했습니다.";
            }
            case CHAT_STARTED -> {
                eventName = "용의자 심문";
                displayMessage = targetName + "에 대한 심문을 시작합니다.";
            }
            case SUBMIT_ATTEMPT -> {
                eventName = "최종 제출";
                displayMessage = targetName + "번째 최종 결과를 제출합니다.";
            }

            default -> {
                eventName = type.name();
                displayMessage = "";
            }
        }

        EventLog eventLog = EventLog.builder()
                .session(session)
                .eventType(type)
                .eventName(eventName)
                .displayMessage(displayMessage)
                .build();
        eventLogRepository.save(eventLog);

        return eventLog;
    }

    // TODO: 점수 계산 로직 다시 짤 필요 있음
    private int calculateScore(GameSession session, int motiveSimilarityPercent) {
        // 100점 만점 기준
        int base = 50;
        int healthScore = (session.getHealth() != null ? session.getHealth() : 0) / 10; // 최대 10점
        int clueFound = discoveredClueRepository.countBySession(session);
        int clueScore = Math.min(30 - clueFound * 2, 20); // 최대 20점
        // 틀릴 때마다 5점 감점
        int attemptCount = session.getSubmitAttempts() != null ? session.getSubmitAttempts() : 1;
        if(attemptCount <= 1) attemptCount = 1;
        int attemptPenalty = (attemptCount-1) * 3;
        long playTime = session.getPlayTime() != null ? session.getPlayTime() : 0;
        int timePenalty = (int) Math.min(10, playTime / 600); // 10분마다 5점 감점, 최대 10점
        int similarity = motiveSimilarityPercent / 5; // 최대 20점

        int score = base + healthScore + clueScore + similarity - attemptPenalty - timePenalty;
        int finalScore = Math.max(0, Math.min(100, score));

        log.info("[점수 계산] base={}, healthScore={}, clueScore={}, similarity={}, attemptPenalty={}, timePenalty={}, finalScore={}",
                base, healthScore, clueScore, similarity, attemptPenalty, timePenalty, finalScore);

        return finalScore;
    }

    private RankGrade calculateRankGrade(int score) {
        if (score >= 90) return RankGrade.S;
        if (score >= 85) return RankGrade.A;
        if (score >= 80) return RankGrade.B;
        if (score >= 70) return RankGrade.C;
        if (score >= 50) return RankGrade.D;
        return RankGrade.F;
    }

    private Scenario getValidScenario(long scenarioId) {
        Scenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new BaseException(ErrorCode.SCENARIO_NOT_FOUND));

        if (scenario.getGenerationStatus() != Scenario.GenerationStatus.COMPLETED) {
            throw new BaseException(ErrorCode.SCENARIO_NOT_READY);
        }
        return scenario;
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

    /**
     * pgvector 문자열 형식을 float[] 배열로 변환
     *
     * @param vectorString "[0.1,0.2,0.3]" 형식의 문자열
     * @return float[] 배열
     */
    private float[] parseVectorString(String vectorString) {
        if (vectorString == null || vectorString.isBlank()) {
            return null;
        }

        String trimmed = vectorString.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1).trim();
        }

        if (trimmed.isEmpty()) {
            return new float[0];
        }

        String[] parts = trimmed.split(",");
        float[] result = new float[parts.length];
        for (int i = 0; i < parts.length; i++) {
            result[i] = Float.parseFloat(parts[i].trim());
        }
        return result;
    }

    /**
     * float[] 배열을 문자열로 변환
     *
     * @param vector float[] 배열
     * @return "[0.1,0.2,0.3]" 형식의 문자열
     */
    private String vectorToString(float[] vector) {
        if (vector == null || vector.length == 0) {
            return null;
        }

        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) {
                sb.append(",");
            }
            sb.append(vector[i]);
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * 코사인 유사도 계산
     *
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

}
