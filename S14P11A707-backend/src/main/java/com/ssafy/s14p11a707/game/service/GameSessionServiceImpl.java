package com.ssafy.s14p11a707.game.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import com.ssafy.s14p11a707.game.entity.GameSession.RankGrade;
import com.ssafy.s14p11a707.game.entity.GameSession.Status;
import com.ssafy.s14p11a707.game.repository.BoardConnectionRepository;
import com.ssafy.s14p11a707.game.repository.BoardNodeRepository;
import com.ssafy.s14p11a707.game.repository.ChatMessageRepository;
import com.ssafy.s14p11a707.game.repository.DiscoveredClueRepository;
import com.ssafy.s14p11a707.game.repository.EventLogRepository;
import com.ssafy.s14p11a707.game.repository.GameSessionRepository;
import com.ssafy.s14p11a707.scenario.entity.*;
import com.ssafy.s14p11a707.scenario.repository.*;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.repository.UserRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.api.Advisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.ChatMemoryRepository;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class GameSessionServiceImpl implements GameSessionService {

    private final GameSessionRepository gameSessionRepository;
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
    private final ObjectMapper objectMapper;
    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final EmbeddingModel embeddingModel;
    private final ChatMemory chatMemory;

    public GameSessionServiceImpl(GameSessionRepository gameSessionRepository, ScenarioRepository scenarioRepository, UserRepository userRepository, VictimRepository victimRepository, RoomRepository roomRepository, SuspectRepository suspectRepository, EventLogRepository eventLogRepository, DiscoveredClueRepository discoveredClueRepository, ClueRepository clueRepository, BoardNodeRepository boardNodeRepository, BoardConnectionRepository boardConnectionRepository, ChatMessageRepository chatMessageRepository, ObjectMapper objectMapper, ChatClient chatClient, VectorStore vectorStore, EmbeddingModel embeddingModel, ChatMemoryRepository chatMemoryRepository) {
        this.gameSessionRepository = gameSessionRepository;
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
        this.objectMapper = objectMapper;
        this.chatClient = chatClient;
        this.vectorStore = vectorStore;
        this.embeddingModel = embeddingModel;
        this.chatMemory = MessageWindowChatMemory.builder()
                .maxMessages(20) // 최근 20개 대화 기억
                .chatMemoryRepository(chatMemoryRepository) // PostgreSQL 저장소 사용
                .build();    }

    @Override
    @Transactional
    public GameStartResponse startGame(long scenarioId, OidcUser oidcUser) {
        User user = getUser(oidcUser);

        Scenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new BaseException(ErrorCode.SCENARIO_NOT_FOUND));

        if (scenario.getGenerationStatus() != Scenario.GenerationStatus.COMPLETED) {
            throw new BaseException(ErrorCode.SCENARIO_NOT_READY);
        }

        if (gameSessionRepository.existsByScenarioIdAndUserIdAndStatus(scenarioId, user.getId(), Status.PLAYING)) {
            throw new BaseException(ErrorCode.SESSION_ALREADY_PLAYING);
        }

        GameSession session = GameSession.builder()
                .scenario(scenario)
                .user(user)
                .status(Status.PLAYING)
                .currentFloor(1)
                .visitedFloorsJson(objectMapper.valueToTree(List.of(1)))
                .health(100)
                .submitAttempts(0)
                .firstPlay(true)
                .startedAt(Instant.now())
                .playTime(0L)
                .build();
        gameSessionRepository.save(session);

        EventLog startLog = EventLog.builder()
                .session(session)
                .eventType(EventLog.EventType.GAME_START)
                .eventName("게임 시작")
                .displayMessage("사건 파일이 열렸습니다.")
                .build();
        eventLogRepository.save(startLog);

        session.markSaved();

        Victim victim = victimRepository.findByScenarioId(scenarioId).orElse(null);
        Room room = roomRepository.findByScenarioIdAndFloorNumber(scenarioId, 1).orElse(null);

        return GameStartResponse.from(session, scenario, victim, room, startLog);
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
    public InvestigationReportResponse getInvestigationReport(long sessionId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        int cluesCollected = discoveredClueRepository.countBySession(session);
        int totalInterrogations = chatMessageRepository.countBySessionAndRole(session, "user");

        // TODO: keyTalk은 용의자 심문 API에서 설정됨. 심문 API 담당자가 ChatMessage.keyTalk 플래그 설정 필요
        List<ChatMessage> keyTalks = chatMessageRepository.findBySessionAndKeyTalkTrueOrderByCreatedAtDesc(session);

        return InvestigationReportResponse.from(session, totalInterrogations, cluesCollected, keyTalks);
    }

    @Override
    public InvestigationReportResponse getOtherInvestigationReport(long sessionId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSession(sessionId);

        // 타인 수사보고서 열람: COMPLETED 세션을 가진 유저만 열람 가능
        if (session.getStatus() != Status.COMPLETED) {
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }

        boolean hasCompletedSession = gameSessionRepository.existsByScenarioIdAndUserIdAndStatus(
                session.getScenario().getId(), user.getId(), Status.COMPLETED
        );

        if (!hasCompletedSession) {
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }

        int cluesCollected = discoveredClueRepository.countBySession(session);
        int totalInterrogations = chatMessageRepository.countBySessionAndRole(session, "user");
        List<ChatMessage> keyTalks = chatMessageRepository.findBySessionAndKeyTalkTrueOrderByCreatedAtDesc(session);

        return InvestigationReportResponse.from(session, totalInterrogations, cluesCollected, keyTalks);
    }

    @Override
    @Transactional
    public DiscoveredClueResponse discoverClue(long sessionId, long clueId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        Clue clue = clueRepository.findById(clueId)
                .orElseThrow(() -> new BaseException(ErrorCode.CLUE_NOT_FOUND));

        if (discoveredClueRepository.existsBySessionIdAndClueId(sessionId, clueId)) {
            throw new BaseException(ErrorCode.CLUE_ALREADY_DISCOVERED);
        }

        Instant now = Instant.now();
        DiscoveredClue discoveredClue = DiscoveredClue.builder()
                .session(session)
                .clue(clue)
                .discoveredAt(now)
                .build();
        discoveredClueRepository.save(discoveredClue);

        EventLog log = EventLog.builder()
                .session(session)
                .eventType(EventLog.EventType.CLUE_FOUND)
                .eventName("단서 발견")
                .displayMessage(clue.getName() + " 단서를 발견했습니다.")
                .build();
        eventLogRepository.save(log);

        session.markSaved();

        return DiscoveredClueResponse.from(sessionId, clue, now);
    }

    @Override
    public ClueListResponse getClues(long sessionId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);
        long scenarioId = session.getScenario().getId();

        List<Clue> allClues = clueRepository.findByScenarioIdOrderByRoomFloorNumberAsc(scenarioId);
        Map<Long, DiscoveredClue> discoveredMap = discoveredClueRepository.findBySessionOrderByDiscoveredAtAsc(session)
                .stream()
                .collect(Collectors.toMap(dc -> dc.getClue().getId(), dc -> dc));

        return ClueListResponse.from(sessionId, scenarioId, allClues, discoveredMap);
    }

    @Override
    public ClueDetailResponse getClue(long sessionId, long clueId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        Clue clue = clueRepository.findById(clueId)
                .orElseThrow(() -> new BaseException(ErrorCode.CLUE_NOT_FOUND));

        DiscoveredClue discoveredClue = discoveredClueRepository
                .findBySessionIdAndClueId(sessionId, clueId)
                .orElse(null);

        return ClueDetailResponse.from(clue, discoveredClue);
    }

    @Override
    public EventLogListResponse getLogs(long sessionId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);
        List<EventLog> logs = eventLogRepository.findBySessionOrderByCreatedAtAsc(session);
        return EventLogListResponse.from(sessionId, logs);
    }

    @Override
    @Transactional
    public GameSaveResponse saveGame(long sessionId, GameSaveRequest request, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        JsonNode visitedFloorsJson = objectMapper.valueToTree(
                request.visitedFloors() != null ? request.visitedFloors() : List.of()
        );

        session.updateProgress(request.currentFloor(), visitedFloorsJson, request.health(), request.playTime());

        return GameSaveResponse.from(session);
    }

    @Override
    public GameResumeResponse resumeGame(long sessionId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        List<DiscoveredClue> discoveredClues = discoveredClueRepository.findBySessionOrderByDiscoveredAtAsc(session);
        List<BoardNode> nodes = boardNodeRepository.findBySession(session);
        List<BoardConnection> connections = boardConnectionRepository.findBySession(session);
        int redCount = boardConnectionRepository.countBySessionAndConnectionType(session, ConnectionType.RED);
        List<Integer> visitedFloors = parseVisitedFloors(session.getVisitedFloorsJson());
        List<EventLog> eventLogs = eventLogRepository.findBySessionOrderByCreatedAtAsc(session);

        return GameResumeResponse.from(session, visitedFloors, discoveredClues, nodes, connections, redCount, eventLogs);
    }

    @Override
    @Transactional
    public FloorMoveResponse moveFloor(long sessionId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);
        Scenario scenario = session.getScenario();

        int currentFloor = session.getCurrentFloor() != null ? session.getCurrentFloor() : 1;
        int maxFloor = 6;
        int nextFloor = currentFloor >= maxFloor ? 1 : currentFloor + 1;

        List<Integer> visitedFloors = parseVisitedFloors(session.getVisitedFloorsJson());
        boolean isFirstVisit = !visitedFloors.contains(nextFloor);

        if (isFirstVisit) {
            visitedFloors = new ArrayList<>(visitedFloors);
            visitedFloors.add(nextFloor);
        }

        session.moveFloor(nextFloor, objectMapper.valueToTree(visitedFloors));
        session.markSaved();

        Room room = roomRepository.findByScenarioIdAndFloorNumber(scenario.getId(), nextFloor)
                .orElseThrow(() -> new BaseException(ErrorCode.ROOM_NOT_FOUND));

        EventLog newLog = null;
        if (isFirstVisit) {
            newLog = EventLog.builder()
                    .session(session)
                    .eventType(EventLog.EventType.FLOOR_MOVED)
                    .eventName("층 이동")
                    .displayMessage(nextFloor + "층으로 이동했습니다.")
                    .build();
            eventLogRepository.save(newLog);
        }

        return FloorMoveResponse.from(sessionId, nextFloor, isFirstVisit, room, newLog);
    }

    @Override
    public BoardResponse getBoard(long sessionId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        List<BoardNode> nodes = boardNodeRepository.findBySession(session);
        List<BoardConnection> connections = boardConnectionRepository.findBySession(session);
        int redCount = boardConnectionRepository.countBySessionAndConnectionType(session, ConnectionType.RED);

        return BoardResponse.from(sessionId, nodes, connections, redCount);
    }

    @Override
    @Transactional
    public BoardResponse addBoardNode(long sessionId, BoardNodeAddRequest request, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        ItemType itemType = ItemType.MEMO;
        if (request.type() != null && !request.type().isBlank()) {
            try {
                itemType = ItemType.valueOf(request.type().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ignored) {
            }
        }

        BoardNode node = BoardNode.builder()
                .session(session)
                .itemType(itemType)
                .targetId(request.targetId())
                .memoContent(request.memoContent())
                .positionX(request.x())
                .positionY(request.y())
                .build();
        boardNodeRepository.save(node);

        session.markSaved();

        return getBoard(sessionId, oidcUser);
    }

    @Override
    @Transactional
    public BoardResponse moveBoardNode(long sessionId, BoardItemMoveRequest request, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        BoardNode node = boardNodeRepository.findById(request.nodeId())
                .orElseThrow(() -> new BaseException(ErrorCode.BOARD_NODE_NOT_FOUND));

        if (node.getSession().getId() != session.getId()) {
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }

        node.updatePosition(request.x(), request.y());
        session.markSaved();

        return getBoard(sessionId, oidcUser);
    }

    @Override
    @Transactional
    public BoardResponse updateBoardMemo(long sessionId, long nodeId, BoardMemoUpdateRequest request, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        BoardNode node = boardNodeRepository.findById(nodeId)
                .orElseThrow(() -> new BaseException(ErrorCode.BOARD_NODE_NOT_FOUND));

        if (node.getSession().getId() != session.getId()) {
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }

        node.updateMemoContent(request.memoContent());
        session.markSaved();

        return getBoard(sessionId, oidcUser);
    }

    @Override
    @Transactional
    public BoardResponse addBoardConnection(long sessionId, BoardConnectionAddRequest request, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        BoardNode fromNode = boardNodeRepository.findById(request.fromNodeId())
                .orElseThrow(() -> new BaseException(ErrorCode.BOARD_NODE_NOT_FOUND));
        BoardNode toNode = boardNodeRepository.findById(request.toNodeId())
                .orElseThrow(() -> new BaseException(ErrorCode.BOARD_NODE_NOT_FOUND));

        if (fromNode.getSession().getId() != session.getId() || toNode.getSession().getId() != session.getId()) {
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }

        if (boardConnectionRepository.existsBySessionAndFromNodeAndToNode(session, fromNode, toNode) ||
            boardConnectionRepository.existsBySessionAndFromNodeAndToNode(session, toNode, fromNode)) {
            throw new BaseException(ErrorCode.BOARD_CONNECTION_ALREADY_EXISTS);
        }

        ConnectionType connectionType = ConnectionType.RED;
        if (request.type() != null && !request.type().isBlank()) {
            try {
                connectionType = ConnectionType.valueOf(request.type().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ignored) {
            }
        }

        BoardConnection connection = BoardConnection.builder()
                .session(session)
                .fromNode(fromNode)
                .toNode(toNode)
                .connectionType(connectionType)
                .build();
        boardConnectionRepository.save(connection);

        session.markSaved();

        return getBoard(sessionId, oidcUser);
    }

    @Override
    @Transactional
    public BoardResponse deleteBoard(long sessionId, BoardDeleteRequest request, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        if (request.connectionIds() != null && !request.connectionIds().isEmpty()) {
            boardConnectionRepository.deleteBySessionAndIdIn(session, request.connectionIds());
        }

        if (request.nodeIds() != null && !request.nodeIds().isEmpty()) {
            boardNodeRepository.deleteBySessionAndIdIn(session, request.nodeIds());
        }

        session.markSaved();

        return getBoard(sessionId, oidcUser);
    }

    @Override
    @Transactional
    public GameEndResponse endGame(long sessionId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        if (session.getStatus() != Status.COMPLETED && session.getStatus() != Status.FAILED) {
            int score = calculateScore(session);
            RankGrade rankGrade = calculateRankGrade(score);
            session.endGame(Status.ABANDONED, false, score, rankGrade);
        }

        return GameEndResponse.from(session);
    }

    private User getUser(OidcUser oidcUser) {
        if (oidcUser == null) {
            throw new BaseException(ErrorCode.UNAUTHORIZED);
        }
        String googleId = oidcUser.getSubject();
        return userRepository.findByGoogleId(googleId)
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));
    }

    private GameSession getSession(long sessionId) {
        return gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new BaseException(ErrorCode.SESSION_NOT_FOUND));
    }

    private GameSession getSessionWithOwnershipValidation(long sessionId, User user) {
        GameSession session = getSession(sessionId);
        if (session.getUser().getId() != user.getId()) {
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }
        return session;
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

    // TODO: 점수 계산 로직 다시 짤 필요 있음
    private int calculateScore(GameSession session) {
        // 100점 만점 기준
        int base = 50;
        int healthScore = (session.getHealth() != null ? session.getHealth() : 0) / 5; // 최대 20점
        int clueScore = Math.min(20, discoveredClueRepository.countBySession(session) * 2); // 최대 20점
        int redCount = boardConnectionRepository.countBySessionAndConnectionType(session, ConnectionType.RED);
        int redScore = Math.min(10, redCount); // 최대 10점
        int attemptPenalty = (session.getSubmitAttempts() != null ? session.getSubmitAttempts() : 0) * 10;
        long playTime = session.getPlayTime() != null ? session.getPlayTime() : 0;
        int timePenalty = (int) Math.min(10, playTime / 300); // 5분마다 1점 감점, 최대 10점

        int score = base + healthScore + clueScore + redScore - attemptPenalty - timePenalty;
        return Math.max(0, Math.min(100, score));
    }

    private RankGrade calculateRankGrade(int score) {
        if (score >= 95) return RankGrade.S;
        if (score >= 85) return RankGrade.A;
        if (score >= 70) return RankGrade.B;
        if (score >= 50) return RankGrade.C;
        return RankGrade.F;
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
            // TODO 오류 수정 필요
            var embeddingResult = embeddingModel.embed(request.motive());
            // motiveEmbedding = embeddingResult.getResult().getOutput();

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

}
