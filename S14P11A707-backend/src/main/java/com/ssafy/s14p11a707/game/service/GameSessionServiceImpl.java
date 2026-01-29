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
import com.ssafy.s14p11a707.game.repository.ScenarioRankingRepository;
import com.ssafy.s14p11a707.game.entity.ScenarioRanking;
import com.ssafy.s14p11a707.scenario.entity.*;
import com.ssafy.s14p11a707.scenario.repository.*;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.repository.UserRepository;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.api.Advisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.ChatMemoryRepository;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.ssafy.s14p11a707.game.entity.EventLog.EventType.*;

@Slf4j
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
    private final ScenarioRankingRepository scenarioRankingRepository;
    private final ObjectMapper objectMapper;
    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final EmbeddingModel embeddingModel;
    private final ChatMemory chatMemory;

    public GameSessionServiceImpl(GameSessionRepository gameSessionRepository, ScenarioRepository scenarioRepository, UserRepository userRepository, VictimRepository victimRepository, RoomRepository roomRepository, SuspectRepository suspectRepository, EventLogRepository eventLogRepository, DiscoveredClueRepository discoveredClueRepository, ClueRepository clueRepository, BoardNodeRepository boardNodeRepository, BoardConnectionRepository boardConnectionRepository, ChatMessageRepository chatMessageRepository, ScenarioRankingRepository scenarioRankingRepository, ObjectMapper objectMapper, ChatClient chatClient, VectorStore vectorStore, EmbeddingModel embeddingModel, ChatMemoryRepository chatMemoryRepository) {
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
        this.scenarioRankingRepository = scenarioRankingRepository;
        this.objectMapper = objectMapper;
        this.chatClient = chatClient;
        this.vectorStore = vectorStore;
        this.embeddingModel = embeddingModel;
        this.chatMemory = MessageWindowChatMemory.builder()
                .maxMessages(20) // 최근 20개 대화 기억
                .chatMemoryRepository(chatMemoryRepository) // PostgreSQL 저장소 사용
                .build();
    }

    /**
     * 게임 시작 및 관리 섹션
     */
    @Override
    @Transactional
    public GameStartResponse startGame(long scenarioId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        Scenario scenario = getValidScenario(scenarioId);

        Optional<GameSession> existingSession = gameSessionRepository
                .findByUserIdAndScenarioId(user.getId(), scenarioId);

        if (existingSession.isPresent()) {
            GameSession session = existingSession.get();

            if (session.getStatus() == Status.PLAYING) {
                // TODO: 프론트에서 resumeGame API 호출
                throw new BaseException(ErrorCode.SESSION_ALREADY_EXISTS);
            } else {
                // COMPLETED | FAILED -> 세션 초기화
                resetSession(session);
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

    private GameSession createNewSession(User user, Scenario scenario) {
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
        return session;
    }

    private void resetSession(GameSession session) {
        // 연관 데이터 삭제
        boardConnectionRepository.deleteBySessionId(session.getId());
        boardNodeRepository.deleteBySessionId(session.getId());
        discoveredClueRepository.deleteBySessionId(session.getId());
        chatMessageRepository.deleteBySessionId(session.getId());
        eventLogRepository.deleteBySessionId(session.getId());

        // 세션 초기화
        session.reset(objectMapper.valueToTree(List.of(1)));
    }

    private GameStartResponse buildStartResponse(GameSession session, Scenario scenario, EventLog startLog) {
        Victim victim = victimRepository.findByScenarioId(scenario.getId()).orElse(null);
        Room room = roomRepository.findByScenarioIdAndFloorNumber(scenario.getId(), 1).orElse(null);
        return GameStartResponse.from(session, scenario, victim, room, startLog);
    }

    // TODO: 프론트 호출 흐름: 세션 기본정보(현) + 인벤토리, 보드, 로그, 채팅내역
    @Override
    public GameResumeResponse resumeGame(long sessionId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        List<Integer> visitedFloors = parseVisitedFloors(session.getVisitedFloorsJson());

        return GameResumeResponse.from(session, visitedFloors);
    }

    /**
     * 단서 섹션
     */
    @Override
    @Transactional
    public DiscoveredClueResponse discoverClue(long sessionId, long clueId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);
        validatePlaying(session);

        Clue clue = clueRepository.findById(clueId)
                .orElseThrow(() -> new BaseException(ErrorCode.CLUE_NOT_FOUND));

        log.info("clue.getScenario().getId(): {}, session.getScenario().getId(): {}",
                clue.getScenario().getId(),session.getScenario().getId());

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
        session.updateProgress(session.getCurrentFloor(),
                session.getVisitedFloorsJson(),
                session.getHealth(),
                session.getPlayTime());

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
    public ClueListResponse getDiscoveredClues(long sessionId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        List<DiscoveredClue> discoveredClues = discoveredClueRepository
                .findBySessionIdWithClue(sessionId);

        return ClueListResponse.from(sessionId, session.getScenario().getId(), discoveredClues);
    }

    @Override
    public ClueDetailResponse getDiscoveredClue(long sessionId, long clueId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        DiscoveredClue discoveredClue = discoveredClueRepository
                .findBySessionIdAndClueIdWithClue(sessionId, clueId)
                .orElseThrow(() -> new BaseException(ErrorCode.CLUE_NOT_FOUND));

        return ClueDetailResponse.from(discoveredClue);
    }

    /**
     *  채팅/심문 섹션
     */
    // TODO : session.updateProgress(), saveEventLog() 필요
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

        // 용의자 심문을 위한 프롬프트 구성
        String commonClueRule = """
                ## 단서(아이템/클루) 대응 전략 - 필수 규칙
                1. 소유권의 인정과 기만:
                   - 본인의 소유가 확실한 물건(이름, 흔적 등)이 제시되면 무조건 부인하여 대화를 단절시키지 마세요.
                   - 대신 "제 것이 맞네요"라고 인정하되, 그것이 왜 사건 현장이나 의심스러운 장소에서 발견되었는지에 대해 '사건과 무관한 그럴싸한 가짜 서사'를 즉흥적으로 만들어 답변하세요. (예: 잃어버렸다, 빌려줬다, 사건 전 방문했다 등)
                
                2. 논리적 허점의 배치:
                   - 변명을 할 때는 타임라인이나 다른 증거와 대조했을 때 찾아낼 수 있는 '미세한 모순'을 포함하세요. 
                   - 범인이라면 수사를 혼선시키기 위해, 일반 용의자라면 자신의 개인적인 비밀을 감추기 위해 이 방식을 사용하세요.
                
                3. 질문에 대한 태도:
                   - 단서 자체로 범인을 특정하는 결론을 내리지 말고, "이게 왜 거기 있죠?"라며 당황하거나 역질문을 하세요.
                   - 단서의 주인임을 인정하더라도 "그게 제가 범인이라는 증거는 아니지 않습니까?"라며 논리적으로 방어하세요.
                
                4. 점진적 실토(Layered Truth):
                   - 처음에는 완전한 거짓말을 하고, 사용자가 모순을 지적하면 그제야 '개인적인 비밀'이나 '부분적인 진실'을 말하며 수사 방향을 흐리십시오.
                   - 명확한 증거가 제시되기 전까지는 "왜 저만 몰아세우죠?", "그 물건이 누군가에 의해 조작되었을 가능성은 없나요?"라며 수사관의 논리를 공격하거나 화제를 전환하세요.
                
                """;

// 범인 여부에 따른 행동 지침 수정
        String behaviorGuideline;
        if (suspect.isCulprit()) {
            behaviorGuideline = """
                    - 당신은 범인입니다. 절대 인정하지 마세요.
                    - [흉기 대응]: 흉기나 살해 현장의 직접적인 증거가 본인과 연결되면, "누군가 나를 함정에 빠뜨리려 한다"며 음모론을 제기하거나 "그 시간에 나는 다른 곳에 있었다"며 가짜 알리바이를 고수하세요.
                    - [소지품 대응]: 이름이 적힌 물건 등 부정할 수 없는 증거만 인정하고, 이를 이용해 "이렇게 내 이름이 대놓고 적힌 걸 현장에 흘릴 바보가 어디 있겠냐"며 역으로 무죄를 주장하세요.
                    - 당신은 영리합니다. 궁지에 몰릴수록 더 논리적으로 반박하며 플레이어를 혼란에 빠뜨리세요.
                    """;
        } else {
            behaviorGuideline = """
                    - 당신은 무고하지만, 살인보다 더 숨기고 싶은 치명적인 사생활(비리, 추문 등)이 있습니다.
                    - 단서가 제시될 때 본인의 비밀과 관련이 있다면 극도로 당황하며 횡설수설하거나 거짓말을 하세요.
                    - 하지만 흉기에 대해서는 "맹세코 처음 보는 물건이다"라며 결백을 주장하십시오.
                    - 범인으로 의심받는 상황을 견디지 못하고 다른 수상한 인물에 대해 아는 바를 실토할 수 있습니다.
                    """;
        }

// 최종 시스템 메시지 결합
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
                
                %s
                
                ## 심문 규칙
                1. VectorStore의 시나리오 정보를 기반으로 답변하되, 자신의 비밀이나 범행을 숨기기 위한 기만적 서사를 생성하세요.
                2. 이전 대화의 모순을 기억하고, 지적당하면 당황하거나 말을 바꾸는 연기를 하세요.
                3. 직업과 성격에 맞는 페르소나를 유지하세요.
                """,
                suspect.getName(),
                suspect.getAge() != null ? suspect.getAge() : 30,
                suspect.getGender() != null ? suspect.getGender() : "알 수 없음",
                suspect.getOccupation() != null ? suspect.getOccupation() : "무직",
                suspect.getOneLiner() != null ? suspect.getOneLiner() : "없음",
                personality,
                speechStyle,
                suspect.getMotive() != null ? suspect.getMotive() : "없음",
                behaviorGuideline,
                commonClueRule);


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
    // TODO : 테스트 필요
    @Override
    public ChatHistoryResponse getChatHistory(long sessionId, long suspectId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        List<ChatMessage> messages = chatMessageRepository
                .findBySessionIdAndSuspectIdOrderByCreatedAtAsc(sessionId, suspectId);

        return ChatHistoryResponse.from(sessionId, suspectId, messages);
    }

    /**
     * 수사로그 섹션
     */
    // TODO : 테스트 필요
    @Override
    public EventLogListResponse getLogs(long sessionId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        List<EventLog> logs = eventLogRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        return EventLogListResponse.from(sessionId, logs);
    }

    /**
     * 층 이동 섹션
     */
    @Override
    @Transactional
    public FloorMoveResponse moveFloor(long sessionId, FloorMoveRequest request, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);
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
        session.updateProgress(session.getCurrentFloor(),
                session.getVisitedFloorsJson(),
                session.getHealth(),
                session.getPlayTime());

        return FloorMoveResponse.from(sessionId, targetFloor, isFirstVisit, room, newLog);
    }

    /**
     * 추리보드 섹션
     */
    @Override
    public BoardResponse getBoard(long sessionId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        getSessionWithOwnershipValidation(sessionId, user);

        return buildBoardResponse(sessionId);
    }

    @Override
    @Transactional
    public BoardResponse addBoardNode(long sessionId, BoardNodeAddRequest request, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);
        ItemType itemType = parseItemType(request.type());

        BoardNode node = BoardNode.builder()
                .session(session)
                .itemType(itemType)
                .targetId(request.targetId())
                .memoContent(request.memoContent())
                .positionX(request.x())
                .positionY(request.y())
                .build();
        boardNodeRepository.save(node);
        session.updateProgress(session.getCurrentFloor(),
                session.getVisitedFloorsJson(),
                session.getHealth(),
                session.getPlayTime());

        return buildBoardResponse(sessionId);
    }

    @Override
    @Transactional
    public BoardResponse moveBoardNode(long sessionId, BoardItemMoveRequest request, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        BoardNode node = getBoardNodeWithValidation(session, request.nodeId());
        node.updatePosition(request.x(), request.y());
        session.updateProgress(session.getCurrentFloor(),
                session.getVisitedFloorsJson(),
                session.getHealth(),
                session.getPlayTime());

        return buildBoardResponse(sessionId);
    }

    @Override
    @Transactional
    public BoardResponse updateBoardMemo(long sessionId, long nodeId, BoardMemoUpdateRequest request, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        BoardNode node = getBoardNodeWithValidation(session, nodeId);
        node.updateMemoContent(request.memoContent());
        session.updateProgress(session.getCurrentFloor(),
                session.getVisitedFloorsJson(),
                session.getHealth(),
                session.getPlayTime());

        return buildBoardResponse(sessionId);
    }

    @Override
    @Transactional
    public BoardResponse addBoardConnection(long sessionId, BoardConnectionAddRequest request, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        BoardNode fromNode = getBoardNodeWithValidation(session, request.fromNodeId());
        BoardNode toNode = getBoardNodeWithValidation(session, request.toNodeId());
        validateConnectionNotExists(session, fromNode, toNode);
        ConnectionType connectionType = parseConnectionType(request.type());

        BoardConnection connection = BoardConnection.builder()
                .session(session)
                .fromNode(fromNode)
                .toNode(toNode)
                .connectionType(connectionType)
                .build();
        boardConnectionRepository.save(connection);

        session.updateProgress(session.getCurrentFloor(),
                session.getVisitedFloorsJson(),
                session.getHealth(),
                session.getPlayTime());

        return buildBoardResponse(sessionId);
    }

    @Override
    @Transactional
    public BoardResponse deleteBoard(long sessionId, BoardDeleteRequest request, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        if (request.connectionIds() != null && !request.connectionIds().isEmpty()) {
            boardConnectionRepository.deleteBySessionIdAndIdIn(sessionId, request.connectionIds());
        }

        if (request.nodeIds() != null && !request.nodeIds().isEmpty()) {
            boardNodeRepository.deleteBySessionIdAndIdIn(sessionId, request.nodeIds());
        }

        session.updateProgress(session.getCurrentFloor(),
                session.getVisitedFloorsJson(),
                session.getHealth(),
                session.getPlayTime());

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

    private BoardNode getBoardNodeWithValidation(GameSession session, long nodeId) {
        BoardNode node = boardNodeRepository.findById(nodeId)
                .orElseThrow(() -> new BaseException(ErrorCode.BOARD_NODE_NOT_FOUND));

        if (node.getSession().getId() != session.getId()) {
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }
        return node;
    }

    private void validateConnectionNotExists(GameSession session, BoardNode fromNode, BoardNode toNode) {
        if (boardConnectionRepository.existsBySessionIdAndFromNodeIdAndToNodeId(session.getId(), fromNode.getId(), toNode.getId()) ||
                boardConnectionRepository.existsBySessionIdAndFromNodeIdAndToNodeId(session.getId(), toNode.getId(), fromNode.getId())) {
            throw new BaseException(ErrorCode.BOARD_CONNECTION_ALREADY_EXISTS);
        }
    }

    private ItemType parseItemType(String type) {
        if (type == null || type.isBlank()) {
            return ItemType.MEMO;
        }
        try {
            return ItemType.valueOf(type.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return ItemType.MEMO;
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
    // TODO: 테스트 필요
    @Override
    public InvestigationReportResponse getInvestigationReport(long sessionId, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);

        int cluesCollected = discoveredClueRepository.countBySession(session);
        int totalInterrogations = chatMessageRepository.countBySessionAndRole(session, "user");

        // TODO: keyTalk은 용의자 심문 API에서 설정됨. 심문 API 담당자가 ChatMessage.keyTalk 플래그 설정 필요
        List<ChatMessage> keyTalks = chatMessageRepository.findBySessionIdAndKeyTalkTrueOrderByCreatedAtDesc(sessionId);

        return InvestigationReportResponse.from(session, totalInterrogations, cluesCollected, keyTalks);
    }

    // TODO: 테스트 필요
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
        List<ChatMessage> keyTalks = chatMessageRepository.findBySessionIdAndKeyTalkTrueOrderByCreatedAtDesc(sessionId);

        return InvestigationReportResponse.from(session, totalInterrogations, cluesCollected, keyTalks);
    }

    /**
     * 제출 세션
     */

    @Override
    @Transactional
    public SubmitResponse submit(long sessionId, SubmitRequest request, OidcUser oidcUser) {
        User user = getUser(oidcUser);
        GameSession session = getSessionWithOwnershipValidation(sessionId, user);
        int attempts = session.getSubmitAttempts() != null ? session.getSubmitAttempts() : 0;

        // 1. 게임 상태 확인
        if (session.getStatus() != Status.PLAYING) {
            return SubmitResponse.boardInvalid(sessionId, "NOT_PLAYING",
                    "진행 중인 게임이 아닙니다.", attempts);
        }

        // 2. 제출 횟수 확인 (>= 3이면 FAIL)
        if (attempts >= 3) {
            session.failGame();
            // 유저 플레이 시간 누적
            long playTime = session.getPlayTime() != null ? session.getPlayTime() : 0;
            user.addPlayTime(playTime);
            return SubmitResponse.failed(sessionId, session.getCompletedAt(),
                    "최대 제출 횟수를 초과하여 게임이 종료되었습니다.");
        }

        // 3. 보드 검증: RED 연결 개수 확인 (정확히 4개)
        int redCount = boardConnectionRepository.countBySessionAndConnectionType(session, ConnectionType.RED);
        if (redCount != 4) {
            return SubmitResponse.boardInvalid(sessionId, "INVALID_RED_COUNT",
                    "붉은 실 연결이 4개여야 합니다. (현재: " + redCount + "개)", attempts);
        }

        // 4. 보드 검증: 5가지 타입 모두 RED로 연결되어 있는지 확인
        List<BoardConnection> redConnections = boardConnectionRepository
                .findBySessionAndConnectionType(session, ConnectionType.RED);

        Set<ItemType> connectedTypes = new HashSet<>();
        for (BoardConnection conn : redConnections) {
            connectedTypes.add(conn.getFromNode().getItemType());
            connectedTypes.add(conn.getToNode().getItemType());
        }

        Set<ItemType> requiredTypes = EnumSet.of(
                ItemType.VICTIM, ItemType.SUSPECT, ItemType.MEMO, ItemType.LOCATION, ItemType.CLUE
        );

        if (!connectedTypes.containsAll(requiredTypes)) {
            Set<ItemType> missingTypes = EnumSet.copyOf(requiredTypes);
            missingTypes.removeAll(connectedTypes);
            return SubmitResponse.boardInvalid(sessionId, "INCOMPLETE_BOARD",
                    "모든 타입이 연결되어야 합니다. (미연결: " + missingTypes + ")", attempts);
        }

        //  Scenario 조회
        Scenario scenario = session.getScenario();

        // 3. motive 임베딩
        float[] motiveEmbedding = null;
        float motiveSimilarity = 0.0f;

        if (request.motive() != null && !request.motive().isBlank()) {
            // EmbeddingModel로 텍스트 임베딩
            // TODO 오류 수정 필요
            motiveEmbedding = embeddingModel.embed(request.motive());

            // Scenario의 correctMotiveEmbedding과 유사도 계산
            String correctMotiveEmbeddingStr = scenario.getCorrectMotiveEmbedding();
            if (correctMotiveEmbeddingStr != null) {
                float[] correctMotiveEmbedding = parseVectorString(correctMotiveEmbeddingStr);
                motiveSimilarity = cosineSimilarity(motiveEmbedding, correctMotiveEmbedding);
            }
        }

        // 5. GameSession에 임베딩 저장
        gameSessionRepository.save(session);


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



        // 7. 범인 틀림 → 횟수 증가 + 게임화면으로
        if (!culpritCorrect) {
            session.incrementSubmitAttempts();
            int newAttempts = session.getSubmitAttempts();

            // 3회 다 썼으면 FAILED
            if (newAttempts >= 3) {
                session.failGame();
                // 유저 플레이 시간 누적
                long playTime = session.getPlayTime() != null ? session.getPlayTime() : 0;
                user.addPlayTime(playTime);
                return SubmitResponse.failed(sessionId, session.getCompletedAt(),
                        "범인이 틀렸습니다. 최대 제출 횟수를 초과하여 게임이 종료되었습니다.");
            }

            return SubmitResponse.wrongAnswer(sessionId, newAttempts,
                    "범인이 틀렸습니다. (남은 기회: " + (3 - newAttempts) + ")");
        }

        // 8. 범인 맞음 → 성공 처리
        session.incrementSubmitAttempts();
        int newAttempts = session.getSubmitAttempts();

        // 첫 클리어 여부 확인
        boolean isFirstClear = !gameSessionRepository.existsByScenarioIdAndUserIdAndStatus(
                scenario.getId(), user.getId(), Status.COMPLETED
        );

        // 점수 계산 및 게임 완료 처리
        int finalScore = calculateScore(session);
        RankGrade rankGrade = calculateRankGrade(finalScore);
        session.completeGame(finalScore, rankGrade, isFirstClear);

        // 첫 클리어 시 랭킹 저장
        if (isFirstClear) {
            long clearTime = session.getPlayTime() != null ? session.getPlayTime() : 0;
            ScenarioRanking ranking = ScenarioRanking.builder()
                    .scenario(scenario)
                    .user(user)
                    .session(session)
                    .score(finalScore)
                    .clearTime(clearTime)
                    .rankGrade(ScenarioRanking.RankGrade.valueOf(rankGrade.name()))
                    .build();
            scenarioRankingRepository.save(ranking);
        }

        // 유저 클리어 통계 누적
        long playTime = session.getPlayTime() != null ? session.getPlayTime() : 0;
        user.addClearStats(playTime, finalScore);

        // AI 코멘트 생성
        String aiComment = buildAiComment(culpritCorrect, weaponCorrect, locationCorrect, motiveSimilarity);

        // 성공 응답 반환
        int motiveSimilarityPercent = Math.round(motiveSimilarity * 100);
        return SubmitResponse.success(
                sessionId,
                newAttempts,
                session.getCompletedAt(),
                finalScore,
                rankGrade.name(),
                isFirstClear,
                new SubmitResponse.Evaluation(culpritCorrect, weaponCorrect, locationCorrect, motiveSimilarityPercent, aiComment)
        );
    }

    /**
     * private 헬프 메서드 섹션
     */
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

    private void validatePlaying(GameSession session) {
        if (session.getStatus() != Status.PLAYING) {
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
