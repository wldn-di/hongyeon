package com.ssafy.s14p11a707.game.service.impl;

import com.ssafy.s14p11a707.game.dto.BoardConnection;
import com.ssafy.s14p11a707.game.dto.BoardConnectionAddRequest;
import com.ssafy.s14p11a707.game.dto.BoardDeleteRequest;
import com.ssafy.s14p11a707.game.dto.BoardItemMoveRequest;
import com.ssafy.s14p11a707.game.dto.BoardMemoUpdateRequest;
import com.ssafy.s14p11a707.game.dto.BoardNode;
import com.ssafy.s14p11a707.game.dto.BoardNodeAddRequest;
import com.ssafy.s14p11a707.game.dto.BoardResponse;
import com.ssafy.s14p11a707.game.dto.ChatHistoryResponse;
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
import com.ssafy.s14p11a707.game.dto.SubmitRequest;
import com.ssafy.s14p11a707.game.dto.SubmitResponse;
import com.ssafy.s14p11a707.game.dto.SubmitValidateResponse;
import com.ssafy.s14p11a707.game.dto.SuspectChatRequest;
import com.ssafy.s14p11a707.game.dto.SuspectChatResponse;
import com.ssafy.s14p11a707.game.dto.SuspectInterrogationStateResponse;
import com.ssafy.s14p11a707.game.service.GameSessionService;
import com.ssafy.s14p11a707.mock.MockFixtures;
import com.ssafy.s14p11a707.mock.MockSessionStore;
import java.util.ArrayList;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class GameSessionServiceMockImpl implements GameSessionService {

    private static final int MAX_SUBMIT_ATTEMPTS = 3;

    private final MockSessionStore sessionStore;

    @Override
    public GameStartResponse startGame(long scenarioId) {
        long userId = MockFixtures.meUserId();
        MockSessionStore.SessionState session = sessionStore.createSession(scenarioId, userId);

        MockFixtures.ScenarioFixture scenario = MockFixtures.scenario(session.scenarioId());
        MockFixtures.VictimFixture victim = scenario.victim();

        MockFixtures.RoomFixture room = MockFixtures.findRoomByFloor(scenario.id(), 1)
                .orElse(scenario.rooms().getFirst());

        List<GameStartResponse.EventLog> eventLogs = session.logs().stream()
                .limit(3)
                .map(l -> new GameStartResponse.EventLog(l.type(), l.message(), l.createdAt()))
                .toList();

        return new GameStartResponse(
                session.sessionId(),
                scenario.id(),
                userId,
                session.status(),
                session.startedAt(),
                new GameStartResponse.Scenario(scenario.title(), scenario.opening()),
                new GameStartResponse.Victim(
                        victim.name(),
                        victim.age(),
                        victim.gender(),
                        victim.occupation(),
                        victim.discoveryLocation(),
                        victim.estimatedDeathTime(),
                        victim.causeOfDeath(),
                        victim.portraitUrl()
                ),
                new GameStartResponse.CurrentRoom(
                        room.floorNumber(),
                        room.roomName(),
                        room.roomType(),
                        room.objects()
                ),
                eventLogs.isEmpty()
                        ? List.of(new GameStartResponse.EventLog("SYSTEM", "사건 파일이 열렸습니다.", session.startedAt()))
                        : eventLogs
        );
    }

    @Override
    public InvestigationReportResponse getInvestigationReport(long sessionId) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);
        long scenarioId = session.scenarioId();
        long userId = session.userId();

        MockFixtures.ScenarioFixture scenario = MockFixtures.scenario(scenarioId);

        int cluesCollected = session.discoveredClues().size();
        int totalInterrogations = estimateInterrogations(session);

        int score = session.finalScore() > 0 ? session.finalScore() : estimateScore(session);
        String rankGrade = StringUtils.hasText(session.rankGrade()) ? session.rankGrade() : gradeByScore(score);

        List<InvestigationReportResponse.KeyTalk> keyTalks = collectKeyTalks(session);

        String summary = session.success()
                ? "사건 해결: " + scenario.title() + " — 결정적 단서들을 연결해 진실에 도달했습니다."
                : "사건 진행 중: " + scenario.title() + " — 아직 풀리지 않은 연결고리가 남아 있습니다.";

        String aiComment = session.success()
                ? "단서의 중요도를 잘 구분했고, 보드 연결이 명확했습니다. 제출 답변도 핵심을 짚었어요."
                : "결정적 단서를 더 확보하거나, 보드에서 ‘빨간선 연결’을 정리하면 추리가 한층 쉬워질 거예요.";

        return new InvestigationReportResponse(
                sessionId,
                scenarioId,
                userId,
                rankGrade,
                score,
                summary,
                aiComment,
                new InvestigationReportResponse.Stats(totalInterrogations, cluesCollected),
                keyTalks
        );
    }

    @Override
    public ChatHistoryResponse getChatHistory(long sessionId, long suspectId) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);
        long scenarioId = session.scenarioId();

        ensureChatGreeting(session, scenarioId, suspectId);

        return new ChatHistoryResponse(
                sessionId,
                suspectId,
                session.chatHistory(suspectId)
        );
    }

    @Override
    public SuspectInterrogationStateResponse getSuspectInterrogationState(long sessionId, long suspectId) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);
        MockSessionStore.SessionState.SuspectState state = session.suspectState(suspectId);
        return new SuspectInterrogationStateResponse(
                sessionId,
                suspectId,
                state.currentInterrogationLevel(),
                state.isSecretRevealed()
        );
    }

    @Override
    public SuspectChatResponse chatWithSuspect(long sessionId, long suspectId, SuspectChatRequest request) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);
        long scenarioId = session.scenarioId();

        ensureChatGreeting(session, scenarioId, suspectId);

        Instant now = Instant.now();

        String userMessage = request == null || request.message() == null ? "" : request.message().trim();
        Long usedClueId = request == null ? null : request.usedClueId();

        if (StringUtils.hasText(userMessage)) {
            session.addChat(suspectId, "user", userMessage, false, now, usedClueId, null);
        }

        MockFixtures.SuspectFixture suspect = MockFixtures.findSuspect(scenarioId, suspectId)
                .orElse(MockFixtures.scenario(scenarioId).suspects().getFirst());

        MockFixtures.TruthFixture truth = MockFixtures.truth(scenarioId);

        String reply = buildSuspectReply(suspect, truth, userMessage, usedClueId);
        Long revealedClueId = maybeRevealClue(session, scenarioId, usedClueId);

        boolean isKeyTalk = revealedClueId != null || (usedClueId != null && usedClueId == truth.weaponClueId());
        session.consumeHealth(usedClueId == null ? 5 : 3);

        int responseLevel = isKeyTalk ? 3 : (usedClueId == null ? 1 : 2);
        session.addChat(suspectId, "assistant", reply, isKeyTalk, now, usedClueId, responseLevel);

        return new SuspectChatResponse(
                sessionId,
                suspectId,
                reply,
                responseLevel,
                session.health(),
                revealedClueId
        );
    }

    @Override
    public DiscoveredClueResponse discoverClue(long sessionId, long clueId) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);
        long scenarioId = session.scenarioId();

        Instant now = Instant.now();
        session.discoverClue(clueId, now);

        MockFixtures.ClueFixture clue = MockFixtures.findClue(scenarioId, clueId)
                .orElse(MockFixtures.scenario(scenarioId).clues().getFirst());

        Instant discoveredAt = session.discoveredClues().getOrDefault(clueId, now);

        return new DiscoveredClueResponse(
                sessionId,
                new DiscoveredClueResponse.Clue(
                        clue.id(),
                        clue.name(),
                        clue.description(),
                        clue.importance(),
                        clue.detailImageUrl(),
                        clue.assistantComment()
                ),
                discoveredAt
        );
    }

    @Override
    public ClueListResponse getClues(long sessionId) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);
        long scenarioId = session.scenarioId();

        Map<Long, Instant> discovered = session.discoveredClues();

        List<ClueListResponse.Clue> clues = MockFixtures.scenario(scenarioId).clues().stream()
                .sorted(Comparator.comparingInt(MockFixtures.ClueFixture::floorNumber))
                .map(c -> new ClueListResponse.Clue(
                        c.id(),
                        c.roomId(),
                        c.floorNumber(),
                        c.name(),
                        c.importance(),
                        discovered.containsKey(c.id()),
                        discovered.get(c.id())
                ))
                .toList();

        return new ClueListResponse(sessionId, scenarioId, clues);
    }

    @Override
    public EventLogListResponse getLogs(long sessionId) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);
        List<EventLogListResponse.Log> logs = session.logs();
        return new EventLogListResponse(sessionId, logs);
    }

    @Override
    public GameSaveResponse saveGame(long sessionId, GameSaveRequest request) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);

        int currentFloor = request == null ? session.currentFloor() : request.currentFloor();
        List<Integer> visitedFloors = request == null || request.visitedFloors() == null || request.visitedFloors().isEmpty()
                ? session.visitedFloors()
                : request.visitedFloors();
        int health = request == null ? session.health() : request.health();
        long playTime = request == null ? session.playTime() : request.playTime();

        session.applySave(currentFloor, visitedFloors, health, playTime);

        return new GameSaveResponse(sessionId, session.status(), session.lastSavedAt(), session.expiresAt());
    }

    @Override
    public GameResumeResponse resumeGame(long sessionId) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);

        long scenarioId = session.scenarioId();
        long userId = session.userId();

        Map<Long, Instant> discovered = session.discoveredClues();

        List<GameResumeResponse.InventoryClue> inventoryClues = discovered.entrySet().stream()
                .sorted(Map.Entry.comparingByValue())
                .map(e -> {
                    long clueId = e.getKey();
                    Instant discoveredAt = e.getValue();
                    MockFixtures.ClueFixture clue = MockFixtures.findClue(scenarioId, clueId)
                            .orElse(null);
                    if (clue == null) {
                        return new GameResumeResponse.InventoryClue(clueId, "알 수 없는 단서", "LOW", discoveredAt);
                    }
                    return new GameResumeResponse.InventoryClue(clueId, clue.name(), clue.importance(), discoveredAt);
                })
                .toList();

        return new GameResumeResponse(
                sessionId,
                scenarioId,
                userId,
                session.status(),
                session.currentFloor(),
                session.visitedFloors(),
                session.health(),
                session.submitAttempts(),
                session.playTime(),
                session.lastSavedAt(),
                session.expiresAt(),
                new GameResumeResponse.Inventory(inventoryClues),
                new GameResumeResponse.Board(
                        session.boardNodes(),
                        session.boardConnections(),
                        session.redConnectionCount()
                )
        );
    }

    @Override
    public FloorMoveResponse moveFloor(long sessionId) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);
        long scenarioId = session.scenarioId();

        int maxFloor = MockFixtures.maxFloor(scenarioId);
        int nextFloor = session.currentFloor() >= maxFloor ? 1 : (session.currentFloor() + 1);

        Instant now = Instant.now();
        boolean isFirstVisit = !session.visitedFloors().contains(nextFloor);
        session.moveFloor(nextFloor, now);

        MockFixtures.RoomFixture room = MockFixtures.findRoomByFloor(scenarioId, nextFloor)
                .orElse(MockFixtures.scenario(scenarioId).rooms().getFirst());

        List<FloorMoveResponse.EventLog> eventLogs = session.logs().stream()
                .sorted(Comparator.comparing(EventLogListResponse.Log::createdAt).reversed())
                .limit(3)
                .map(l -> new FloorMoveResponse.EventLog(l.type(), l.message(), l.createdAt()))
                .toList();

        return new FloorMoveResponse(
                sessionId,
                nextFloor,
                isFirstVisit,
                new FloorMoveResponse.Room(
                        room.id(),
                        room.floorNumber(),
                        room.roomName(),
                        room.roomType(),
                        room.description(),
                        isFirstVisit ? room.assistantComment() : null,
                        room.objects()
                ),
                eventLogs
        );
    }

    @Override
    public BoardResponse getBoard(long sessionId) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);
        return new BoardResponse(
                sessionId,
                session.boardNodes(),
                session.boardConnections(),
                session.redConnectionCount()
        );
    }

    @Override
    public BoardResponse addBoardNode(long sessionId, BoardNodeAddRequest request) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);

        String type = request == null || request.type() == null || request.type().isBlank()
                ? "MEMO"
                : request.type().trim().toUpperCase(Locale.ROOT);
        Long targetId = request == null ? null : request.targetId();
        String memoContent = request == null ? null : request.memoContent();
        int x = request == null ? 160 : request.x();
        int y = request == null ? 120 : request.y();

        BoardNode node = new BoardNode(sessionStore.nextNodeId(), type, targetId, memoContent, x, y);
        session.addBoardNode(node);

        return getBoard(sessionId);
    }

    @Override
    public BoardResponse moveBoardNode(long sessionId, BoardItemMoveRequest request) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);
        if (request != null) {
            session.moveBoardNode(request.nodeId(), request.x(), request.y());
        }
        return getBoard(sessionId);
    }

    @Override
    public BoardResponse updateBoardMemo(long sessionId, long nodeId, BoardMemoUpdateRequest request) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);
        String memoContent = request == null ? null : request.memoContent();
        session.updateBoardMemo(nodeId, memoContent);
        return getBoard(sessionId);
    }

    @Override
    public BoardResponse addBoardConnection(long sessionId, BoardConnectionAddRequest request) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);
        if (request == null) {
            return getBoard(sessionId);
        }

        long fromNodeId = request.fromNodeId();
        long toNodeId = request.toNodeId();

        boolean exists = session.boardConnections().stream()
                .anyMatch(c -> (c.fromNodeId() == fromNodeId && c.toNodeId() == toNodeId)
                        || (c.fromNodeId() == toNodeId && c.toNodeId() == fromNodeId));
        if (exists) {
            return getBoard(sessionId);
        }

        String type = request.type() == null ? "RED" : request.type().trim().toUpperCase(Locale.ROOT);
        session.addBoardConnection(new BoardConnection(sessionStore.nextConnectionId(), fromNodeId, toNodeId, type));
        return getBoard(sessionId);
    }

    @Override
    public BoardResponse deleteBoard(long sessionId, BoardDeleteRequest request) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);
        if (request != null) {
            session.deleteBoard(request.nodeIds(), request.connectionIds());
        }
        return getBoard(sessionId);
    }

    @Override
    public SubmitValidateResponse validateSubmit(long sessionId) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);
        long scenarioId = session.scenarioId();

        MockFixtures.TruthFixture truth = MockFixtures.truth(scenarioId);

        List<String> missing = new ArrayList<>();
        List<SubmitValidateResponse.RequiredRedConnection> required = new ArrayList<>();

        boolean hasWeaponClue = session.discoveredClues().containsKey(truth.weaponClueId());
        if (!hasWeaponClue) {
            missing.add("흉기/결정적 단서를 아직 획득하지 않았습니다.");
        }

        boolean victimSuspect = session.hasRedConnectionBetweenTypes("VICTIM", "SUSPECT");
        if (!victimSuspect) {
            required.add(new SubmitValidateResponse.RequiredRedConnection("VICTIM", "SUSPECT", "피해자와 용의자를 빨간선으로 연결하세요."));
        }

        boolean suspectClue = session.hasRedConnectionBetweenTypes("SUSPECT", "CLUE");
        if (!suspectClue) {
            required.add(new SubmitValidateResponse.RequiredRedConnection("SUSPECT", "CLUE", "용의자와 단서를 빨간선으로 연결해 근거를 정리하세요."));
        }

        if (session.submitAttempts() >= MAX_SUBMIT_ATTEMPTS) {
            missing.add("제출 가능 횟수를 모두 사용했습니다.");
        }

        boolean submittable = missing.isEmpty() && required.isEmpty() && session.health() > 0;

        return new SubmitValidateResponse(sessionId, submittable, missing, required);
    }

    @Override
    public SubmitResponse submit(long sessionId, SubmitRequest request) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);
        long scenarioId = session.scenarioId();

        int attemptsUsed = session.increaseSubmitAttempts();

        MockFixtures.TruthFixture truth = MockFixtures.truth(scenarioId);

        long culpritId = request == null ? 0 : request.culpritId();
        long weaponClueId = request == null ? 0 : request.weaponClueId();
        int locationFloor = request == null ? 0 : request.locationFloor();
        String motive = request == null ? null : request.motive();
        String causeOfDeath = request == null ? null : request.causeOfDeath();

        boolean culpritCorrect = culpritId == truth.culpritSuspectId();
        boolean weaponCorrect = weaponClueId == truth.weaponClueId();
        boolean locationCorrect = locationFloor == truth.locationFloor();

        float motiveSimilarity = similarityByKeywords(motive, truth.motiveKeywords());
        float causeSimilarity = similarityByKeywords(causeOfDeath, truth.causeOfDeathKeywords());

        boolean success = culpritCorrect && weaponCorrect && locationCorrect;

        int score = computeFinalScore(session, success, attemptsUsed);
        String rankGrade = gradeByScore(score);

        String aiComment = buildSubmitComment(success, culpritCorrect, weaponCorrect, locationCorrect, motiveSimilarity, causeSimilarity);

        Instant now = Instant.now();
        String status = success
                ? "COMPLETED"
                : (attemptsUsed >= MAX_SUBMIT_ATTEMPTS ? "FAILED" : "PLAYING");
        session.markSubmitted(status, success, score, rankGrade, now);

        return new SubmitResponse(
                sessionId,
                status,
                attemptsUsed,
                now,
                score,
                rankGrade,
                new SubmitResponse.Evaluation(
                        culpritCorrect,
                        weaponCorrect,
                        locationCorrect,
                        motiveSimilarity,
                        causeSimilarity,
                        aiComment
                )
        );
    }

    @Override
    public GameEndResponse endGame(long sessionId) {
        MockSessionStore.SessionState session = sessionStore.getOrCreate(sessionId);

        if (!"COMPLETED".equalsIgnoreCase(session.status()) && !"FAILED".equalsIgnoreCase(session.status())) {
            int score = computeFinalScore(session, false, session.submitAttempts());
            String rankGrade = gradeByScore(score);
            session.markSubmitted("ABANDONED", false, score, rankGrade, Instant.now());
        }

        return new GameEndResponse(
                sessionId,
                session.status(),
                session.success(),
                session.completedAt(),
                session.finalScore(),
                session.rankGrade()
        );
    }

    private static void ensureChatGreeting(MockSessionStore.SessionState session, long scenarioId, long suspectId) {
        if (!session.chatHistory(suspectId).isEmpty()) {
            return;
        }

        MockFixtures.SuspectFixture suspect = MockFixtures.findSuspect(scenarioId, suspectId)
                .orElse(MockFixtures.scenario(scenarioId).suspects().getFirst());

        String greeting = "저는 " + suspect.name() + "입니다. 무엇을 알고 싶으신가요?";
        session.addChat(suspectId, "assistant", greeting, false, Instant.now(), null, 1);
    }

    private static String buildSuspectReply(
            MockFixtures.SuspectFixture suspect,
            MockFixtures.TruthFixture truth,
            String userMessage,
            Long usedClueId
    ) {
        String base = suspect.replyFor(usedClueId);

        if (userMessage == null) {
            return base;
        }

        String normalized = userMessage.toLowerCase(Locale.ROOT);
        if (normalized.contains("알리바이") || normalized.contains("어디")) {
            return base + " …그 시간엔 제가 혼자 있었던 게 맞습니다. 누가 증명해줄지는 모르겠지만요.";
        }
        if (normalized.contains("동기") || normalized.contains("왜")) {
            return base + " 동기라… 사람은 누구나 숨기고 싶은 게 있죠.";
        }
        if (usedClueId != null && usedClueId == truth.weaponClueId()) {
            return base + " …그 단서는 위험한 얘길 하고 있어요. 더 캐묻지 마요.";
        }
        return base;
    }

    private static Long maybeRevealClue(MockSessionStore.SessionState session, long scenarioId, Long usedClueId) {
        if (usedClueId == null) {
            return null;
        }

        List<MockFixtures.ClueFixture> candidates = MockFixtures.scenario(scenarioId).clues().stream()
                .filter(c -> !session.discoveredClues().containsKey(c.id()))
                .filter(c -> "HIGH".equalsIgnoreCase(c.importance()) || "CRITICAL".equalsIgnoreCase(c.importance()))
                .toList();
        if (candidates.isEmpty()) {
            return null;
        }

        return candidates.getFirst().id();
    }

    private static int estimateInterrogations(MockSessionStore.SessionState session) {
        int total = 0;
        for (MockFixtures.SuspectFixture suspect : MockFixtures.scenario(session.scenarioId()).suspects()) {
            total += (int) session.chatHistory(suspect.id()).stream()
                    .filter(m -> "user".equalsIgnoreCase(m.role()))
                    .count();
        }
        return total;
    }

    private static List<InvestigationReportResponse.KeyTalk> collectKeyTalks(MockSessionStore.SessionState session) {
        List<InvestigationReportResponse.KeyTalk> talks = new ArrayList<>();
        for (MockFixtures.SuspectFixture s : MockFixtures.scenario(session.scenarioId()).suspects()) {
            for (ChatHistoryResponse.Message m : session.chatHistory(s.id())) {
                if (!m.isKeyTalk()) continue;
                if (!"assistant".equalsIgnoreCase(m.role())) continue;
                talks.add(new InvestigationReportResponse.KeyTalk(s.id(), m.content(), m.createdAt()));
            }
        }

        return talks.stream()
                .sorted(Comparator.comparing(InvestigationReportResponse.KeyTalk::createdAt).reversed())
                .limit(5)
                .toList();
    }

    private static int estimateScore(MockSessionStore.SessionState session) {
        int base = 700;
        int healthScore = session.health() * 2;
        int clueScore = session.discoveredClues().size() * 30;
        int redScore = session.redConnectionCount() * 15;
        int attemptPenalty = session.submitAttempts() * 120;
        int timePenalty = (int) Math.min(200, session.playTime() / 30);

        int score = base + healthScore + clueScore + redScore - attemptPenalty - timePenalty;
        return clamp(score, 0, 1000);
    }

    private static int computeFinalScore(MockSessionStore.SessionState session, boolean success, int attemptsUsed) {
        int base = success ? 820 : 650;
        int healthScore = session.health() * 2;
        int clueScore = session.discoveredClues().size() * 35;
        int attemptPenalty = Math.max(0, attemptsUsed - 1) * 140;
        int timePenalty = (int) Math.min(250, session.playTime() / 20);

        int score = base + healthScore + clueScore - attemptPenalty - timePenalty;
        return clamp(score, 0, 1000);
    }

    private static String gradeByScore(int score) {
        if (score >= 950) return "S";
        if (score >= 900) return "A";
        if (score >= 850) return "B";
        if (score >= 800) return "C";
        if (score >= 750) return "D";
        return "F";
    }

    private static float similarityByKeywords(String input, List<String> keywords) {
        if (keywords == null || keywords.isEmpty()) {
            return 0.0f;
        }
        if (!StringUtils.hasText(input)) {
            return 0.0f;
        }

        String normalized = normalizeText(input);
        int hit = 0;
        for (String keyword : keywords) {
            if (!StringUtils.hasText(keyword)) continue;
            if (normalized.contains(normalizeText(keyword))) {
                hit++;
            }
        }

        return Math.min(1.0f, hit / (float) keywords.size());
    }

    private static String normalizeText(String value) {
        return value.toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", "");
    }

    private static String buildSubmitComment(
            boolean success,
            boolean culpritCorrect,
            boolean weaponCorrect,
            boolean locationCorrect,
            float motiveSimilarity,
            float causeSimilarity
    ) {
        if (success) {
            return "추리가 정확합니다. 범인/흉기/장소가 논리적으로 연결됐어요.";
        }

        List<String> hints = new ArrayList<>();
        if (!culpritCorrect) hints.add("범인 추리가 어긋났습니다.");
        if (!weaponCorrect) hints.add("흉기 단서 선택이 다릅니다.");
        if (!locationCorrect) hints.add("발생 장소(층) 추리가 다릅니다.");
        if (motiveSimilarity < 0.4f) hints.add("동기 설명이 사건의 핵심과 거리가 있어요.");
        if (causeSimilarity < 0.4f) hints.add("사인 설명이 단서와 덜 맞습니다.");

        if (hints.isEmpty()) {
            return "조금만 더 단서를 정리하면 정답에 가까워질 거예요.";
        }

        return String.join(" ", hints);
    }

    private static int clamp(int value, int min, int max) {
        if (value < min) return min;
        return Math.min(value, max);
    }
}
