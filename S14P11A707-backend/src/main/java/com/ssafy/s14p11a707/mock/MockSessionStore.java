package com.ssafy.s14p11a707.mock;

import com.ssafy.s14p11a707.game.dto.BoardConnectionDto;
import com.ssafy.s14p11a707.game.dto.BoardNodeDto;
import com.ssafy.s14p11a707.game.dto.ChatHistoryResponse;
import com.ssafy.s14p11a707.game.dto.EventLogListResponse;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Component;

@Component
public class MockSessionStore {

    private final AtomicLong sessionIdSequence = new AtomicLong(1000L);
    private final AtomicLong nodeIdSequence = new AtomicLong(10_000L);
    private final AtomicLong connectionIdSequence = new AtomicLong(20_000L);

    private final ConcurrentMap<Long, SessionState> sessions = new ConcurrentHashMap<>();

    public MockSessionStore() {
        seedActiveSessions();
    }

    public SessionState createSession(long scenarioId, long userId) {
        long sessionId = sessionIdSequence.incrementAndGet();
        SessionState state = SessionState.create(
                sessionId,
                scenarioId,
                userId,
                nextNodeId(),
                Instant.now()
        );
        sessions.put(sessionId, state);
        return state;
    }

    public SessionState getOrCreate(long sessionId) {
        return sessions.computeIfAbsent(sessionId, id -> {
            bumpSequenceIfNeeded(id);
            return SessionState.create(
                    id,
                    1L,
                    MockFixtures.meUserId(),
                    nextNodeId(),
                    Instant.now()
            );
        });
    }

    public Optional<SessionState> find(long sessionId) {
        return Optional.ofNullable(sessions.get(sessionId));
    }

    public List<SessionState> listActiveSessions(long userId) {
        return sessions.values().stream()
                .filter(s -> s.userId() == userId)
                .filter(s -> "PLAYING".equalsIgnoreCase(s.status()))
                .sorted((a, b) -> b.lastSavedAt().compareTo(a.lastSavedAt()))
                .toList();
    }

    public long nextNodeId() {
        return nodeIdSequence.incrementAndGet();
    }

    public long nextConnectionId() {
        return connectionIdSequence.incrementAndGet();
    }

    private void bumpSequenceIfNeeded(long sessionId) {
        sessionIdSequence.accumulateAndGet(sessionId, Math::max);
    }

    private void seedActiveSessions() {
        long userId = MockFixtures.meUserId();
        for (MockFixtures.ScenarioFixture scenario : MockFixtures.scenarios()) {
            SessionState state = createSession(scenario.id(), userId);
            state.applySave(1, List.of(1), 100, 60L * scenario.id());
        }
    }

    public static final class SessionState {

        private final long sessionId;
        private final long scenarioId;
        private final long userId;

        private String status;
        private boolean success;
        private int finalScore;
        private String rankGrade;

        private final Instant startedAt;
        private Instant completedAt;
        private Instant lastSavedAt;
        private Instant expiresAt;

        private int currentFloor;
        private final LinkedHashSet<Integer> visitedFloors = new LinkedHashSet<>();
        private int health;
        private int submitAttempts;
        private long playTime;

        private final Map<Long, List<ChatHistoryResponse.Message>> chatBySuspectId = new HashMap<>();
        private final Map<Long, SuspectState> suspectStates = new HashMap<>();
        private final Map<Long, Instant> discoveredClues = new HashMap<>();
        private final List<EventLogListResponse.Log> logs = new ArrayList<>();

        private final List<BoardNodeDto> boardNodes = new ArrayList<>();
        private final List<BoardConnectionDto> boardConnections = new ArrayList<>();

        private SessionState(long sessionId, long scenarioId, long userId, Instant startedAt) {
            this.sessionId = sessionId;
            this.scenarioId = scenarioId;
            this.userId = userId;
            this.startedAt = startedAt;
            this.status = "PLAYING";
            this.health = 100;
            this.currentFloor = 1;
            this.visitedFloors.add(1);
            this.lastSavedAt = startedAt;
            this.expiresAt = startedAt.plusSeconds(60L * 60L * 3L);
        }

        public static SessionState create(
                long sessionId,
                long scenarioId,
                long userId,
                long victimNodeId,
                Instant now
        ) {
            SessionState state = new SessionState(sessionId, scenarioId, userId, now);
            state.boardNodes.add(new BoardNodeDto(victimNodeId, "VICTIM", MockFixtures.scenario(scenarioId).victim().id(), null, 120, 80));
            state.logs.add(new EventLogListResponse.Log("SYSTEM", "SESSION", "사건 파일이 열렸습니다.", now));
            return state;
        }

        public long sessionId() {
            return sessionId;
        }

        public long scenarioId() {
            return scenarioId;
        }

        public long userId() {
            return userId;
        }

        public synchronized String status() {
            return status;
        }

        public synchronized boolean success() {
            return success;
        }

        public synchronized int finalScore() {
            return finalScore;
        }

        public synchronized String rankGrade() {
            return rankGrade;
        }

        public Instant startedAt() {
            return startedAt;
        }

        public synchronized Instant completedAt() {
            return completedAt;
        }

        public synchronized Instant lastSavedAt() {
            return lastSavedAt;
        }

        public synchronized Instant expiresAt() {
            return expiresAt;
        }

        public synchronized int currentFloor() {
            return currentFloor;
        }

        public synchronized List<Integer> visitedFloors() {
            return List.copyOf(visitedFloors);
        }

        public synchronized int health() {
            return health;
        }

        public synchronized int submitAttempts() {
            return submitAttempts;
        }

        public synchronized long playTime() {
            return playTime;
        }

        public synchronized Map<Long, Instant> discoveredClues() {
            return Map.copyOf(discoveredClues);
        }

        public synchronized List<EventLogListResponse.Log> logs() {
            return List.copyOf(logs);
        }

        public synchronized List<BoardNodeDto> boardNodes() {
            return List.copyOf(boardNodes);
        }

        public synchronized List<BoardConnectionDto> boardConnections() {
            return List.copyOf(boardConnections);
        }

        public synchronized List<ChatHistoryResponse.Message> chatHistory(long suspectId) {
            return List.copyOf(chatBySuspectId.getOrDefault(suspectId, List.of()));
        }

        public synchronized void addChat(
                long suspectId,
                String role,
                String content,
                boolean isKeyTalk,
                Instant now,
                Long usedClueId,
                Integer responseLevel
        ) {
            chatBySuspectId.computeIfAbsent(suspectId, ignored -> new ArrayList<>())
                    .add(new ChatHistoryResponse.Message(role, content, now, isKeyTalk, usedClueId, responseLevel));
            logs.add(new EventLogListResponse.Log("CHAT", "INTERROGATION", "용의자 심문이 진행됐다.", now));

            if (responseLevel != null && "assistant".equalsIgnoreCase(role)) {
                SuspectState current = suspectStates.getOrDefault(suspectId, new SuspectState(1, false));
                int nextLevel = Math.max(current.currentInterrogationLevel(), responseLevel);
                boolean nextSecretRevealed = current.isSecretRevealed() || responseLevel >= 3;
                suspectStates.put(suspectId, new SuspectState(nextLevel, nextSecretRevealed));
            }
        }

        public synchronized SuspectState suspectState(long suspectId) {
            return suspectStates.getOrDefault(suspectId, new SuspectState(1, false));
        }

        public synchronized boolean discoverClue(long clueId, Instant now) {
            if (discoveredClues.containsKey(clueId)) {
                return false;
            }
            discoveredClues.put(clueId, now);
            logs.add(new EventLogListResponse.Log("GAME", "CLUE", "단서를 획득했다.", now));
            return true;
        }

        public synchronized void moveFloor(int newFloor, Instant now) {
            this.currentFloor = newFloor;
            this.visitedFloors.add(newFloor);
            logs.add(new EventLogListResponse.Log("GAME", "MOVE", newFloor + "층으로 이동했다.", now));
        }

        public synchronized void applySave(int currentFloor, List<Integer> visitedFloors, int health, long playTime) {
            this.currentFloor = currentFloor;
            this.visitedFloors.clear();
            this.visitedFloors.addAll(visitedFloors);
            this.health = health;
            this.playTime = playTime;
            this.lastSavedAt = Instant.now();
            this.expiresAt = this.lastSavedAt.plusSeconds(60L * 60L * 3L);
        }

        public synchronized BoardNodeDto addBoardNode(BoardNodeDto node) {
            boardNodes.add(node);
            logs.add(new EventLogListResponse.Log("GAME", "BOARD", "보드에 노드를 추가했다.", Instant.now()));
            return node;
        }

        public synchronized void moveBoardNode(long nodeId, int x, int y) {
            for (int i = 0; i < boardNodes.size(); i++) {
                BoardNodeDto n = boardNodes.get(i);
                if (n.nodeId() == nodeId) {
                    boardNodes.set(i, new BoardNodeDto(n.nodeId(), n.type(), n.targetId(), n.memoContent(), x, y));
                    logs.add(new EventLogListResponse.Log("GAME", "BOARD", "보드 노드 위치를 이동했다.", Instant.now()));
                    return;
                }
            }
        }

        public synchronized void updateBoardMemo(long nodeId, String memoContent) {
            for (int i = 0; i < boardNodes.size(); i++) {
                BoardNodeDto n = boardNodes.get(i);
                if (n.nodeId() == nodeId) {
                    boardNodes.set(i, new BoardNodeDto(n.nodeId(), n.type(), n.targetId(), memoContent, n.x(), n.y()));
                    logs.add(new EventLogListResponse.Log("GAME", "BOARD", "보드 메모를 수정했다.", Instant.now()));
                    return;
                }
            }
        }

        public synchronized Optional<BoardConnectionDto> addBoardConnection(BoardConnectionDto connection) {
            boardConnections.add(connection);
            logs.add(new EventLogListResponse.Log("GAME", "BOARD", "보드에 연결선을 추가했다.", Instant.now()));
            return Optional.of(connection);
        }

        public synchronized void deleteBoard(List<Long> nodeIds, List<Long> connectionIds) {
            if (nodeIds != null && !nodeIds.isEmpty()) {
                boardNodes.removeIf(n -> nodeIds.contains(n.nodeId()));
                boardConnections.removeIf(c -> nodeIds.contains(c.fromNodeId()) || nodeIds.contains(c.toNodeId()));
            }
            if (connectionIds != null && !connectionIds.isEmpty()) {
                boardConnections.removeIf(c -> connectionIds.contains(c.connectionId()));
            }
            logs.add(new EventLogListResponse.Log("GAME", "BOARD", "보드 항목을 삭제했다.", Instant.now()));
        }

        public synchronized void markSubmitted(String status, boolean success, int finalScore, String rankGrade, Instant now) {
            this.status = status;
            this.success = success;
            this.finalScore = finalScore;
            this.rankGrade = rankGrade;
            this.completedAt = now;
            logs.add(new EventLogListResponse.Log("GAME", "SUBMIT", "추리 결과를 제출했다.", now));
        }

        public synchronized int increaseSubmitAttempts() {
            this.submitAttempts += 1;
            return this.submitAttempts;
        }

        public synchronized void consumeHealth(int amount) {
            this.health = Math.max(0, this.health - Math.max(0, amount));
        }

        public synchronized int redConnectionCount() {
            int count = 0;
            for (BoardConnectionDto c : boardConnections) {
                if ("RED".equalsIgnoreCase(c.type())) {
                    count++;
                }
            }
            return count;
        }

        public synchronized boolean hasRedConnectionBetweenTypes(String typeA, String typeB) {
            if (boardConnections.isEmpty()) return false;

            Map<Long, String> nodeTypeById = new HashMap<>();
            for (BoardNodeDto node : boardNodes) {
                nodeTypeById.put(node.nodeId(), node.type());
            }

            for (BoardConnectionDto c : boardConnections) {
                if (!"RED".equalsIgnoreCase(c.type())) continue;
                String fromType = nodeTypeById.get(c.fromNodeId());
                String toType = nodeTypeById.get(c.toNodeId());
                if (fromType == null || toType == null) continue;

                String a = fromType.toUpperCase();
                String b = toType.toUpperCase();
                String typeAUpper = typeA.toUpperCase(Locale.ROOT);
                String typeBUpper = typeB.toUpperCase(Locale.ROOT);

                if ((a.equals(typeAUpper) && b.equals(typeBUpper)) || (a.equals(typeBUpper) && b.equals(typeAUpper))) {
                    return true;
                }
            }

            return false;
        }

        public record SuspectState(
                int currentInterrogationLevel,
                boolean isSecretRevealed
        ) {
        }
    }
}
