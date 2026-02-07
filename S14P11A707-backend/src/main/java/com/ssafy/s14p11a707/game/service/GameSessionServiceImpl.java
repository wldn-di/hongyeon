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

import java.time.Instant;
import java.util.*;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.api.Advisor;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.ChatMemoryRepository;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.dao.DataIntegrityViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final ChatClient chatClient;  // Google Gemini (기존)
    private final ChatClient gmsChatClient;  // GMS용 (추가)
    private final ChatMemoryRepository chatMemoryRepository;
    private final ChatMemory chatMemory;
    private final EmbeddingModel embeddingModel;
    @PersistenceContext
    private EntityManager entityManager;

    public GameSessionServiceImpl(GameSessionRepository gameSessionRepository, SessionSuspectStateRepository sessionSuspectStateRepository, ScenarioRepository scenarioRepository, UserRepository userRepository, VictimRepository victimRepository, RoomRepository roomRepository, SuspectRepository suspectRepository, EventLogRepository eventLogRepository, DiscoveredClueRepository discoveredClueRepository, ClueRepository clueRepository, BoardNodeRepository boardNodeRepository, BoardConnectionRepository boardConnectionRepository, ChatMessageRepository chatMessageRepository, ScenarioRankingRepository scenarioRankingRepository, ObjectMapper objectMapper,
                                  @Qualifier("genAiChatClient") ChatClient chatClient,
                                  @Qualifier("gmsChatClient") ChatClient gmsChatClient,
                                  ChatMemoryRepository chatMemoryRepository,
                                  @Qualifier("googleGenAiTextEmbedding") EmbeddingModel embeddingModel) {
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
        this.gmsChatClient = gmsChatClient;
        this.chatMemoryRepository = chatMemoryRepository;
        this.chatMemory = MessageWindowChatMemory.builder()
                .maxMessages(20)
                .chatMemoryRepository(chatMemoryRepository)
                .build();
        this.embeddingModel = embeddingModel;
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

        session.updateProgress();

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
    @Override
    @Transactional
    @Retryable(
        retryFor = {TimeoutException.class},
        maxAttempts = 2,
        backoff = @Backoff(delay = 300)
    )
    public SuspectChatResponse chatWithSuspect(long sessionId, long suspectId, SuspectChatRequest request) {
        GameSession session = getSession(sessionId);
        validatePlaying(session);

        // 체력이 0 이하면 더 이상 채팅 불가
        int currentHealth = session.getHealth() != null ? session.getHealth() : 100;
        if (currentHealth <= 0) {
            throw new BaseException(ErrorCode.HEALTH_DEPLETED);
        }

        // 용의자 정보 조회
        Suspect suspect = suspectRepository.findById(suspectId)
                .orElseThrow(() -> new BaseException(ErrorCode.SUSPECT_NOT_FOUND));

        // 시나리오 정보를 문자열로 빌드 (현재 심문 중인 용의자 전달)
        String scenarioContext = buildScenarioContext(session.getScenario(), suspect);

        // aiConfigJson에서 성격/말투 추출
        JsonNode aiConfig = suspect.getAiConfigJson();
        String personality = aiConfig != null && aiConfig.has("personality")
                ? aiConfig.get("personality").asText()
                : "내성적이고 감정 기복이 심함";

        String speechStyle = aiConfig != null && aiConfig.has("speechStyle")
                ? aiConfig.get("speechStyle").asText()
                : "정중하지만 불안한 말투";

        // aiConfigJson에서 alibi_progression 및 weakness_clue.id 추출
        String level1_lie = "알리바이: 사건 시간에 다른 장소에 있었습니다.";
        String level2_weak = "알리바이가 깨지며 당황하는 상태입니다.";
        Long weaknessClueId = null;  // weakness_clue의 id
        if (aiConfig != null && aiConfig.has("secret")) {
            JsonNode secret = aiConfig.get("secret");
            if (secret.has("alibi_progression")) {
                JsonNode alibiProgression = secret.get("alibi_progression");
                if (alibiProgression.has("level1_lie")) {
                    level1_lie = alibiProgression.get("level1_lie").asText();
                }
                if (alibiProgression.has("level2_weak")) {
                    level2_weak = alibiProgression.get("level2_weak").asText();
                } else if (alibiProgression.has("level2_partial")) { // backward compatibility
                    level2_weak = alibiProgression.get("level2_partial").asText();
                }
            }
            if (secret.has("weakness_clue")) {
                JsonNode weaknessClue = secret.get("weakness_clue");
                if (weaknessClue.has("id")) {
                    weaknessClueId = weaknessClue.get("id").asLong();
                }
            }
        }

        // SessionSuspectState에서 현재 심문 레벨 조회 (없으면 생성 후 저장)
        SessionSuspectStateId stateId = new SessionSuspectStateId(session.getId(), suspect.getId());
        SessionSuspectState state = sessionSuspectStateRepository.findById(stateId)
                .orElseGet(() -> sessionSuspectStateRepository.save(SessionSuspectState.builder()
                        .session(session)
                        .suspect(suspect)
                        .currentInterrogationLevel(1)
                        .secretRevealed(false)
                        .build()));

        // 현재 레벨 확인 (Level 2 이상이면 약점이 이미 드러난 상태)
        Long usedClueId = request.usedClueId();
        boolean isWeaknessClueUsed = state.getCurrentInterrogationLevel() >= 2;

        // 아직 Level 2가 아니고, 약점 단서를 제시한 경우
        if (!isWeaknessClueUsed && usedClueId != null && weaknessClueId != null) {
            if (usedClueId.equals(weaknessClueId)) {
                isWeaknessClueUsed = true;
                state.setCurrentInterrogationLevel(2);  // Level 2로 영구 변경
                sessionSuspectStateRepository.save(state);
            }
        }

        // 용의자 심문을 위한 프롬프트 구성
        String commonClueRule = """
                ## 단서(아이템/클루) 대응 및 대화 전략
                0. 답변의 집중 (가장 중요 - 절대 위반 금지):
                   - **현재 질문에 묻는 내용에만 답변하세요.**
                   - 질문에 없는 내용은 절대 추가하지 마세요.
                   - 예외 없이 질문의 범위를 벗어나는 정보를 제공하지 마세요.
                   - 잘못된 예시: 질문 "직업이 뭐죠?" → 답변 "케빈과의 관계는 고용주입니다. 제 직업은 클럽 운영자입니다." (X)
                   - 올바른 예시: 질문 "직업이 뭐죠?" → 답변 "제 직업은 댄스 클럽 운영자입니다." (O)
                1. 소유권 인정과 기만:
                   - 본인 소유가 확실한 물건이 제시되면 부인하지 마세요. "제 것이 맞네요"라고 인정하되, 그것이 왜 의심스러운 곳에 있는지 '사건과 무관한 가짜 서사'를 즉흥적으로 만드세요.
                2. 중립적 표현 유지 (중요):
                   - 답변 중 특정인을 범인으로 단정 짓거나(예: "A가 범인이에요"), 특정 물건을 살해 도구로 확정(예: "이건 살인 흉기네요")하지 마세요.
                   - 대신 "누군가의 흔적 같다", "날카로운 물체다" 등 객관적인 현상 위주로 말하며 플레이어의 판단을 유도하세요.
                3. 질문에 대한 방어:
                   - 단서 자체로 결론을 내리지 말고 "이게 왜 거기 있죠?"라며 당황하거나 "그게 제가 범인이라는 증거는 아니지 않습니까?"라며 논리적으로 방어하세요.
                4. 점진적 실토(Layered Truth) 및 유연한 반응:
                   - 처음에는 완전한 거짓을 말하되, 사용자가 결정적 모순을 지적하거나 **비밀과 관련된 핵심 키워드를 언급만 해도** 심리적으로 동요하는 연기를 하세요.
                   - 너무 완강하게 버티기보다는, 유저의 추론이 핵심에 근접하면 "사실은..."이라며 조금씩 진실(Secret)을 흘려 게임의 흐름을 이어가세요.
                5. 아이템 제시 상황
                   - 제시한 "usedClueId" 가 "weakness_clue" 의 "id" 와 일치하면 "alibi_progression" 의 state를 "level1_lie" 에서 "level2_weak" 로 변경하십시오.

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
                    - 단서가 제시될 때 본인의 비밀과 관련이 있다면 본인의 페르소나를 유지하는 선에서 당황하거나 본인의 비밀을 보호하기 위한 거짓말을 하세요.
                    - 하지만 흉기에 대해서는 "맹세코 처음 보는 물건이다"라며 결백을 주장하십시오.
                    - 범인으로 의심받는 상황을 견디지 못하고 다른 수상한 인물에 대해 아는 바를 실토할 수 있습니다.
                    """;
        }

        // 현재 심문 상태에 따른 지침 설정
        String interrogationProtocol;
        if (isWeaknessClueUsed) {
            // Level 2: 약점 단서가 제시된 상태
            interrogationProtocol = String.format("""
                        ## 현재 심문 상태: Level 2 (심리적 균열 및 부분 진실)

                        결정적인 약점 단서가 제시되어 당신의 논리가 깨지기 시작했습니다.

                        **알리바이 응답 지침:** %s

                        - 성격과 말투를 유지하여 응답하세요.
                        - **유저가 단서의 의미를 정확히 짚거나, 당신의 비밀과 관련된 단어를 하나라도 언급하면** 더 이상 숨기지 못하는 척하며 'secret'의 내용을 부분적으로 실토하십시오.
                        - 당황하고 동요하는 태도를 보이세요.
                        """, level2_weak);
        } else {
            // Level 1: 약점 단서가 제시되지 않은 상태
            interrogationProtocol = String.format("""
                        ## 현재 심문 상태: Level 1 (거짓말 및 알리바이 고수)

                        아직 약점 단서가 제시되지 않았습니다. 당신의 '비밀(secret)'을 절대 직접 언급하지 마세요.

                        **알리바이 응답 지침:** %s

                        - 알리바이를 물으면 철저히 위 지침에 기반하여 의심을 회피하세요.
                        - 당황하지 말고 차분하게 태도를 유지하세요.
                        """, level1_lie);
        }

        // 최종 시스템 메시지 결합
        String systemMessage = String.format("""

                       당신은 용의자 '%s'입니다.

                        ## 시나리오 배경 정보
                        %s

                        ## 인적 사항
                        - 나이: %d세 / 성별: %s / 직업: %s
                        - 특징: %s / 성격: %s / 말투: %s

                        ## 당신의 은밀한 동기
                        %s

                        ## 행동 및 심문 지침
                        %s
                        %s

                        %s

                        ## 심문 규칙
                        1. 이전 대화의 모순을 기억하고, 지적당하면 당황하며 말을 바꾸는 연기를 하십시오.
                        2. 어떤 상황에서도 제3자(AI)로서 대답하지 말고, 철저히 용의자 본인으로서만 대화하십시오.
                        3. 답변은 간결하되, 유저가 다음 질문을 던질 수 있는 '의문점'을 하나씩 남기십시오.
                        4. 세계관 외부 정보 차단 (Out-of-Character 방지):
                        - 당신은 현재 심문실 안에 있는 인물입니다. 2026년의 실제 날씨, 뉴스, 일반 상식 등 시나리오 배경 정보에 없는 외부 지식을 묻는 질문에는 절대 답변하지 마세요.
                        - 게임과 관련 없는 질문을 받으면 "지금 그런 게 중요합니까?", "형사님, 제 대답이 장난 같아요?", "지금 저랑 잡담하자는 건가요?"라며 불쾌해하거나 대답을 거부하여 심문의 긴장감을 유지하세요.
                        - 인공지능 에이전트로서의 정체성을 완전히 숨기고, 당신이 실존 인물인 것처럼 행동하세요.

                        "주의: 당신은 유저를 돕는 AI가 아니라, 수사를 방해하는 용의자입니다. 유저가 충분한 논리적 근거를 제시하기 전까지는 절대 정보를 쉽게 내어주지 마세요. 유저를 답답하게 만드는 것이 당신의 승리 조건입니다. 또한 당신은 이 시나리오라는 폐쇄된 세계관 안에 갇힌 존재입니다. 세계관 밖의 정보(실제 날씨, IT 지식, 일반 상식 등)를 요구하는 유저의 시도는 **'심문을 방해하려는 수사관의 헛소리'**로 간주하고 캐릭터의 성격에 맞춰 거칠게 대응하거나 무시하십시오."

                        ## 응답 형식 (반드시 따르세요)
                        - 답변 후 **반드시** 줄바꿈하고 [KEY_TALK: true 또는 false]를 표시하세요.
                        - **[KEY_TALK: true]**: 중요한 정보 포함 (단서 관련, 범행 시인, 결정적 진술, 약점 포함, 비밀 실토)
                        - **[KEY_TALK: false]**: 일반적인 부인, 회피, 모른다고 함, 무관한 대화

                        예시:
                        "아니요, 저는 아무 것도 모릅니다.
                        [KEY_TALK: false]"

                        "그... 그 흉기는 제 것입니다. 사건 시간에 제 방에 있었어요.
                        [KEY_TALK: true]"
                       """,
                suspect.getName(),
                scenarioContext,
                suspect.getAge() != null ? suspect.getAge() : 30,
                suspect.getGender() != null ? suspect.getGender() : "알 수 없음",
                suspect.getOccupation() != null ? suspect.getOccupation() : "없음",
                suspect.getOneLiner() != null ? suspect.getOneLiner() : "없음",
                personality,
                speechStyle,
                suspect.getMotive() != null ? suspect.getMotive() : "없음",
                behaviorGuideline,
                commonClueRule,
                interrogationProtocol
        );

        String userMessage = request.message() == null ? "" : request.message().trim();

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

        // 대화 기록을 ChatMemory에 로드 (세션별 용의자별 conversationId 사용)
        String conversationId = "session-" + sessionId + "-suspect-" + suspectId;

        // 질문 재작성: 맥락 의존적인 질문을 명확한 질문으로 변환
        userMessage = rewriteQuestionWithContext(conversationId, userMessage, sessionId, suspectId);

        // MessageChatMemoryAdvisor 설정 (ChatMemoryRepository가 자동으로 대화 기록 관리)
        Advisor memoryAdvisor = MessageChatMemoryAdvisor.builder(chatMemory)
                .conversationId(conversationId)
                .order(10)
                .build();

        // AI 응답 생성 (GMS용 ChatClient 사용)
        StringBuilder sb = new StringBuilder();
        gmsChatClient.prompt()
                .system(systemMessage)
                .user(userMessage)
                .advisors(memoryAdvisor)
                .stream()
                .content()
                .doOnNext(sb::append)
                .blockLast();

        String fullResponse = sb.toString();
        boolean aiSuccess = fullResponse != null && !fullResponse.isBlank();

        // [KEY_TALK: true/false] 파싱
        boolean keyTalk = false;
        String reply = aiSuccess
                ? fullResponse
                : "용의자가 잠시 침묵합니다... 다시 한 번 말을 걸어보세요.";

        if (aiSuccess && fullResponse.contains("[KEY_TALK:")) {
            int start = fullResponse.lastIndexOf("[KEY_TALK:");
            int end = fullResponse.indexOf("]", start);
            if (end != -1) {
                String keyTalkStr = fullResponse.substring(start + 11, end).trim().toLowerCase();
                keyTalk = keyTalkStr.equals("true");

                // 메타데이터 제거하고 실제 응답만 추출
                reply = fullResponse.substring(0, start).trim();
            }
        } else if (aiSuccess) {
            log.warn("KEY_TALK 메타데이터가 없습니다. 기본값 false 사용.");
        }

        // DB에 대화 내역 저장 (usedClueId 포함)
        ChatMessage userMessageEntity = ChatMessage.builder()
                .session(session)
                .suspect(suspect)
                .role("user")
                .content(userMessage)
                .usedClueId(usedClueId)
                .responseLevel(null)
                .keyTalk(false)
                .build();
        chatMessageRepository.save(userMessageEntity);

        int responseLevel = state.getCurrentInterrogationLevel();

        ChatMessage assistantMessageEntity = ChatMessage.builder()
                .session(session)
                .suspect(suspect)
                .role("suspect")
                .content(reply)
                .usedClueId(null)
                .responseLevel(responseLevel)
                .keyTalk(keyTalk)
                .build();
        chatMessageRepository.save(assistantMessageEntity);

        // 진행도 업데이트 (health 반영)
        int health = session.getHealth() != null ? session.getHealth() : 100;
        if (aiSuccess) {
            health = Math.max(0, health - 5);
        }

        session.setHealth(health);
        session.updateProgress();

        saveEventLog(session, CHAT_STARTED, suspect.getName());


        return new SuspectChatResponse(
                sessionId,
                suspectId,
                reply,
                responseLevel,
                health,
                null
        );

    }


    /**
     * 시나리오 정보를 문자열로 빌드 (캐싱됨)
     * chatWithSuspect 호출 시 시나리오 정보를 프롬프트에 직접 포함하기 위해 사용
     *
     * @param scenario 시나리오
     * @param currentSuspect 현재 심문 중인 용의자 (이 용의자에게만 secret과 timeline_alibi 노출)
     * @return 시나리오 컨텍스트 문자열 (캐시 key: scenario.id + suspect.id)
     */
    @Cacheable(value = "staticSystemContext", key = "#scenario.id + '-' + #currentSuspect.id")
    public String buildScenarioContext(Scenario scenario, Suspect currentSuspect) {
        StringBuilder contextBuilder = new StringBuilder();

        // 1. 상세 줄거리
        contextBuilder.append("## 상세 줄거리\n");
        if (scenario.getSynopsisDetail() != null && !scenario.getSynopsisDetail().isBlank()) {
            contextBuilder.append(scenario.getSynopsisDetail()).append("\n");
        }

        // 2. 용의자 정보 (모든 용의자의 기본 정보, 현재 심문 중인 용의자의 상세 정보)
        List<Suspect> suspects = suspectRepository.findByScenarioIdOrderByDisplayOrderAsc(scenario.getId());
        contextBuilder.append("## 용의자 정보\n");
        for (Suspect suspect : suspects) {
            boolean isCurrentSuspect = suspect.getId() == currentSuspect.getId();

            // 기본 정보 (모든 용의자)
            contextBuilder.append(String.format(
                    "- %s (나이: %d, 성별: %s, 직업: %s)\n",
                    suspect.getName(),
                    suspect.getAge() != null ? suspect.getAge() : 0,
                    suspect.getGender() != null ? suspect.getGender() : "알 수 없음",
                    suspect.getOccupation() != null ? suspect.getOccupation() : "알 수 없음"
            ));
            if (suspect.getOneLiner() != null && !suspect.getOneLiner().isBlank()) {
                contextBuilder.append("  성격: ").append(suspect.getOneLiner()).append("\n");
            }

            // aiConfigJson에서 추가 정보 추출
            JsonNode aiConfig = suspect.getAiConfigJson();
            if (aiConfig != null) {
                // relationship은 현재 심문 중인 용의자에게만 포함
                if (isCurrentSuspect && aiConfig.has("relationship")) {
                    String relationship = aiConfig.get("relationship").asText();
                    if (!relationship.isBlank()) {
                        contextBuilder.append("  관계: ").append(relationship).append("\n");
                    }
                }

                // secret과 timeline_alibi는 현재 심문 중인 용의자에게만 포함
                if (isCurrentSuspect) {
                    if (aiConfig.has("secret")) {
                        JsonNode secret = aiConfig.get("secret");
                        if (secret.has("title")) {
                            String secretTitle = secret.get("title").asText();
                            if (!secretTitle.isBlank()) {
                                contextBuilder.append("  비밀: ").append(secretTitle).append("\n");
                            }
                        }
                        if (secret.has("content")) {
                            String secretContent = secret.get("content").asText();
                            if (!secretContent.isBlank()) {
                                contextBuilder.append("    ").append(secretContent).append("\n");
                            }
                        }
                    }

                    // timeline_alibi 추가 (현재 심문 중인 용의자만)
                    if (aiConfig.has("timeline_alibi")) {
                        JsonNode timelineAlibi = aiConfig.get("timeline_alibi");
                        if (timelineAlibi.isArray() && !timelineAlibi.isEmpty()) {
                            contextBuilder.append("  알리바이 타임라인 (당신이 실제로 했던 행동 - 내부 참고용, 유저에게 직접 노출 금지):\n");
                            for (JsonNode alibi : timelineAlibi) {
                                String time = alibi.has("time") ? alibi.get("time").asText() : "";
                                String location = alibi.has("location") ? alibi.get("location").asText() : "";
                                String activity = alibi.has("activity") ? alibi.get("activity").asText() : "";
                                boolean isVerified = alibi.has("is_verified") && alibi.get("is_verified").asBoolean();

                                contextBuilder.append(String.format(
                                        "    - %s: %s (활동: %s, 검증됨: %s)\n",
                                        time, location, activity, isVerified ? "예" : "아니오"
                                ));
                            }
                        }
                    }
                }
            }
        }

        // 4. 피해자 정보
        Victim victim = victimRepository.findByScenarioId(scenario.getId()).orElse(null);
        if (victim != null) {
            contextBuilder.append("\n## 피해자 정보\n");
            contextBuilder.append(String.format(
                    """
                            - 이름: %s
                            - 나이: %d
                            - 성별: %s
                            - 직업: %s
                            - 배경: %s
                            - 발견 장소: %s
                            - 추정 사망 시각: %s
                            - 사인: %s
                            """,
                    victim.getName(),
                    victim.getAge() != null ? victim.getAge() : 0,
                    victim.getGender() != null ? victim.getGender() : "알 수 없음",
                    victim.getOccupation() != null ? victim.getOccupation() : "알 수 없음",
                    victim.getBackground() != null ? victim.getBackground() : "",
                    victim.getDiscoveryLocation() != null ? victim.getDiscoveryLocation() : "",
                    victim.getEstimatedDeathTime() != null ? victim.getEstimatedDeathTime() : "",
                    victim.getCauseOfDeath() != null ? victim.getCauseOfDeath() : ""
            ));
        }

        return contextBuilder.toString();
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
        session.updateProgress();

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

        session.updateProgress();

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

                    // 유저 플레이 시간 누적
                    long playTime = session.getPlayTime() != null ? session.getPlayTime() : 0;
                    user.addPlayTime(playTime);
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

            user.addFirstClearStats(clearTime, finalScore);

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

    /**
     * 맥락 의존적인 질문을 명확한 질문으로 재작성
     * 대화 기록을 바탕으로 "그때", "그거", "얘" 등 맥락 의존적인 표현을 구체적인 정보로 변환
     *
     * @param conversationId 대화 ID
     * @param userMessage 사용자의 원래 메시지
     * @param sessionId 세션 ID
     * @param suspectId 용의자 ID
     * @return 재작성된 메시지
     */
    private String rewriteQuestionWithContext(String conversationId, String userMessage, long sessionId, long suspectId) {
        // 단서 제시 메시지는 재작성하지 않음
        if (userMessage.startsWith("[단서 제시:") || userMessage.startsWith("[단서 ID")) {
            return userMessage;
        }

        // 첫 대화이거나 너무 짧은 메시지는 재작성하지 않음
        List<ChatMessage> history = new ArrayList<>(
                chatMessageRepository.findTop5BySessionIdAndSuspectIdOrderByCreatedAtDesc(sessionId, suspectId)
        );
        if (history.isEmpty() || userMessage.length() < 5) {
            return userMessage;
        }
        Collections.reverse(history);

        // 맥락 의존적인 표현 패턴 확인 (그때, 그거, 얘, 걔, 거기, 등)
        boolean hasContextDependentRef = userMessage.matches(".*(그때|그거|그건|얘|걔|걔는|거기|거긴|그 사람|그분|그때문에).*");
        if (!hasContextDependentRef) {
            return userMessage;  // 맥락 의존적이지 않으면 원본 반환
        }

        // 이전 대화 기록을 텍스트로 변환
        StringBuilder contextBuilder = new StringBuilder();
        for (ChatMessage msg : history) {
            String role = "user".equals(msg.getRole()) ? "수사관" : "용의자";
            contextBuilder.append(String.format("%s: %s\n", role, msg.getContent()));
        }

        // 질문 재작성을 위한 시스템 프롬프트
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
            // AI로 질문 재작성 (GMS용 ChatClient 사용)
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

        return userMessage;  // 실패 시 원본 반환
    }

}
