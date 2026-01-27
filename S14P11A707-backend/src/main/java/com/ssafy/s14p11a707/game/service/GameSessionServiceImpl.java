package com.ssafy.s14p11a707.game.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.game.dto.BoardConnectionAddRequest;
import com.ssafy.s14p11a707.game.dto.BoardDeleteRequest;
import com.ssafy.s14p11a707.game.dto.BoardItemMoveRequest;
import com.ssafy.s14p11a707.game.dto.BoardMemoUpdateRequest;
import com.ssafy.s14p11a707.game.dto.BoardNodeAddRequest;
import com.ssafy.s14p11a707.game.dto.BoardResponse;
import com.ssafy.s14p11a707.game.dto.ClueDetailResponse;
import com.ssafy.s14p11a707.game.dto.ClueListResponse;
import com.ssafy.s14p11a707.game.dto.DiscoveredClueResponse;
import com.ssafy.s14p11a707.game.dto.EventLogListResponse;
import com.ssafy.s14p11a707.game.dto.FloorMoveResponse;
import com.ssafy.s14p11a707.game.dto.GameEndResponse;
import com.ssafy.s14p11a707.game.dto.GameResumeResponse;
import com.ssafy.s14p11a707.game.dto.GameSaveRequest;
import com.ssafy.s14p11a707.game.dto.GameSaveResponse;
import com.ssafy.s14p11a707.game.dto.GameStartResponse;
import com.ssafy.s14p11a707.game.dto.InvestigationReportResponse;
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
import com.ssafy.s14p11a707.scenario.entity.Clue;
import com.ssafy.s14p11a707.scenario.entity.Room;
import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.scenario.entity.Victim;
import com.ssafy.s14p11a707.scenario.repository.ClueRepository;
import com.ssafy.s14p11a707.scenario.repository.RoomRepository;
import com.ssafy.s14p11a707.scenario.repository.ScenarioRepository;
import com.ssafy.s14p11a707.scenario.repository.VictimRepository;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.repository.UserRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GameSessionServiceImpl implements GameSessionService {

    private final GameSessionRepository gameSessionRepository;
    private final ScenarioRepository scenarioRepository;
    private final UserRepository userRepository;
    private final VictimRepository victimRepository;
    private final RoomRepository roomRepository;
    private final EventLogRepository eventLogRepository;
    private final DiscoveredClueRepository discoveredClueRepository;
    private final ClueRepository clueRepository;
    private final BoardNodeRepository boardNodeRepository;
    private final BoardConnectionRepository boardConnectionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper;

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
}
