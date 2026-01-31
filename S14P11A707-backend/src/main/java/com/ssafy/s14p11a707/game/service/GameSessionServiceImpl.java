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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.ssafy.s14p11a707.game.entity.BoardNode.ItemType.MEMO;
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
    public GameStartResponse startGame(long scenarioId, long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));
        Scenario scenario = getValidScenario(scenarioId);

        Optional<GameSession> existingSession = gameSessionRepository
                .findByUserIdAndScenarioId(user.getId(), scenarioId);

        if (existingSession.isPresent()) {
            GameSession session = existingSession.get();

            if (session.getStatus() == Status.PLAYING) {
                // TODO: 프론트에서 resumeGame API 호출
                return GameStartResponse.alreadyPlaying(session);
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
            resetSession(session);
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
                .status(Status.PLAYING)
                .currentFloor(1)
                .visitedFloorsJson(objectMapper.valueToTree(List.of(1)))
                .health(100)
                .submitAttempts(0)
                .firstPlay(true)
                .startedAt(Instant.now())
                .playTime(0L)
                .lastSavedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(7 * 24 * 60 * 60))
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


        gameSessionRepository.save(session);
    }

    private GameStartResponse buildStartResponse(GameSession session, Scenario scenario, EventLog startLog) {
        Victim victim = victimRepository.findByScenarioId(scenario.getId()).orElse(null);
        Room room = roomRepository.findByScenarioIdAndFloorNumber(scenario.getId(), 1).orElse(null);
        return GameStartResponse.from(session, scenario, victim, room, startLog);
    }

    // TODO: 프론트 호출 흐름: 세션 기본정보(현) + 인벤토리, 보드, 로그, 채팅내역
    @Override
    @Transactional
    public GameResumeResponse resumeGame(long sessionId) {
        GameSession session = getSession(sessionId);

        // PLAYING이 아니면 리셋 후 재시작
        if (session.getStatus() != Status.PLAYING) {
            resetSession(session);
            saveEventLog(session, GAME_START, null);
            // 리셋 후 save 확인
            gameSessionRepository.save(session);
        }

        List<Integer> visitedFloors = parseVisitedFloors(session.getVisitedFloorsJson());
        List<DiscoveredClue> discoveredClues = discoveredClueRepository
                .findBySessionIdWithClue(sessionId);

        return GameResumeResponse.from(session, visitedFloors, discoveredClues);
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
            log.warn("No clues found via findByScenarioIdWithRoom. Falling back to findByScenarioId. sessionId={}, scenarioId={}",
                    sessionId, scenarioId);
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
    public SuspectChatResponse chatWithSuspect(long sessionId, long suspectId, SuspectChatRequest request) {
        GameSession session = getSession(sessionId);
        validatePlaying(session);

        // 체력이 0 이하면 더 이상 채팅 불가
        int currentHealth = session.getHealth() != null ? session.getHealth() : 100;
        if (currentHealth <= 0) {
            throw new BaseException(ErrorCode.HEALTH_DEPLETED);
        }

        // 시나리오 정보를 문자열로 빌드
        String scenarioContext = buildScenarioContext(session.getScenario());

        // 용의자 정보 조회
        Suspect suspect = suspectRepository.findById(suspectId)
                .orElseThrow(() -> new BaseException(ErrorCode.SUSPECT_NOT_FOUND));

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
                if (alibiProgression.has("level2_partial")) {
                    level2_weak = alibiProgression.get("level2_partial").asText();
                }
            }
            if (secret.has("weakness_clue") && secret.get("weakness_clue").has("id")) {
                weaknessClueId = secret.get("weakness_clue").get("id").asLong();
            }
        }

        // usedClueId와 weakness_clue.id 비교
        Long usedClueId = request.usedClueId();
        boolean isWeaknessClueUsed = usedClueId != null && usedClueId.equals(weaknessClueId);

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

// 최종 시스템 메시지 결합
        String systemMessage = String.format("""
                        
                        당신은 용의자 '%s'입니다.
                        
                        ## 시나리오 배경 정보
                        %s
                        
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
                        
                        ## 핵심 아이템 제시 전과 후의 상태 변화
                        
                        - 1) 명확한 증거가 제출되지 않았을 때와 2) 약점 증거와 일치하지 않는 양쪽의 경우 모두 false로 판단 
                        -> false인 경우 본인의 알리바이를 고수하여, 비밀을 부인하며 언급하지 않기, alibi_progression{level1_lie} 를 유지
                        
                        - user가 탐문하는 과정에서 아이템을 제출 후 해당 아이템의 id와 suspect의 weakness_clue가 일치하는 경우 true
                        -> true인 경우 알리바이가 깨지며 취약상태가 되며 탐문 내용이 본인의 sectret의 content와 충분히 유사하거나 모순이 깨지는 경우 해당 비밀을 말할수 있도록 한다, 자연스럽게 해당 대답을 유도하는 경우 숨겨진 진실에 대한 진술할수 있도록 한다
                        
                        if %b:
                        %s
                        
                        else:
                        %s
                        
                        ## 심문 규칙
                        1. 위 시나리오 배경 정보를 기반으로 답변하되, 자신의 비밀이나 범행을 숨기기 위한 기만적 서사를 생성하세요.
                        2. 이전 대화의 모순을 기억하고, 지적당하면 당황하거나 말을 바꾸는 연기를 하세요.
                        3. 직업과 성격에 맞는 페르소나를 유지하세요.
                        
                        최종 출력 전에, clues 배열의 모든 name/description/revealed_truth/discovery_script/assistant_comment에 사람 이름/소유 표현/직업 지목/범인 단정 표현이 포함되어 있는지 자체 점검하고, 발견되면 중립 표현으로 수정한 뒤 출력하십시오.
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
                isWeaknessClueUsed,
                level2_weak,
                level1_lie
        );


        String userMessage = request.message() == null ? "" : request.message().trim();
        // usedClueId는 이미 위에서 선언됨

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

        // DB에 대화 내역 저장 (usedClueId 포함)
        ChatMessage userMessageEntity = ChatMessage.builder()
                .session(session)
                .suspect(suspect)
                .role("user")
                .content(request.message())
                .usedClueId(usedClueId)
                .responseLevel(null)
                .keyTalk(false)
                .build();
        chatMessageRepository.save(userMessageEntity);

        int responseLevel = usedClueId == null ? 1 : 2;
        ChatMessage assistantMessageEntity = ChatMessage.builder()
                .session(session)
                .suspect(suspect)
                .role("suspect")
                .content(reply)
                .usedClueId(null)
                .responseLevel(responseLevel)
                .keyTalk(false)
                .build();
        chatMessageRepository.save(assistantMessageEntity);

        // 진행도 업데이트 (health 반영)
        int health = session.getHealth() != null ? session.getHealth() : 100;
        health = Math.max(0, health - 5);

        session.setHealth(health);
        session.updateProgress();

        saveEventLog(session, CHAT_STARTED, suspect.getName());

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


    /**
     * 시나리오 정보를 문자열로 빌드
     * chatWithSuspect 호출 시 시나리오 정보를 프롬프트에 직접 포함하기 위해 사용
     */
    private String buildScenarioContext(Scenario scenario) {
        StringBuilder contextBuilder = new StringBuilder();

        // 1. 줄거리, 상세 줄거리
        contextBuilder.append("## 줄거리\n");
        if (scenario.getSynopsis() != null && !scenario.getSynopsis().isBlank()) {
            contextBuilder.append(scenario.getSynopsis()).append("\n");
        }
        if (scenario.getSynopsisDetail() != null && !scenario.getSynopsisDetail().isBlank()) {
            contextBuilder.append("\n### 상세 줄거리\n").append(scenario.getSynopsisDetail()).append("\n");
        }

        // 2. 타임라인
        JsonNode storyConfig = scenario.getStoryConfigJson();
        if (storyConfig != null && storyConfig.has("timeline")) {
            JsonNode timeline = storyConfig.get("timeline");
            contextBuilder.append("\n## 사건 타임라인\n");
            for (JsonNode event : timeline) {
                String time = event.has("time") ? event.get("time").asText() : "";
                String eventText = event.has("event") ? event.get("event").asText() : "";
                String witness = event.has("witness") ? event.get("witness").asText() : "";
                contextBuilder.append(String.format("- %s: %s (목격자: %s)\n", time, eventText, witness));
            }
        }

        // 3. 용의자 정보 (모든 용의자의 관계와 배경)
        List<Suspect> suspects = suspectRepository.findByScenarioIdOrderByDisplayOrderAsc(scenario.getId());
        contextBuilder.append("\n## 용의자 정보\n");
        for (Suspect suspect : suspects) {
            contextBuilder.append(String.format(
                    "- %s (나이: %d, 성별: %s, 직업: %s)\n",
                    suspect.getName(),
                    suspect.getAge() != null ? suspect.getAge() : 0,
                    suspect.getGender() != null ? suspect.getGender() : "알 수 없음",
                    suspect.getOccupation() != null ? suspect.getOccupation() : "알 수 없음"
            ));
            if (suspect.getMotive() != null && !suspect.getMotive().isBlank()) {
                contextBuilder.append("  동기: ").append(suspect.getMotive()).append("\n");
            }
            if (suspect.getOneLiner() != null && !suspect.getOneLiner().isBlank()) {
                contextBuilder.append("  성격: ").append(suspect.getOneLiner()).append("\n");
            }

            // aiConfigJson에서 추가 정보 추출
            JsonNode aiConfig = suspect.getAiConfigJson();
            if (aiConfig != null) {
                if (aiConfig.has("relationship")) {
                    String relationship = aiConfig.get("relationship").asText();
                    if (!relationship.isBlank()) {
                        contextBuilder.append("  관계: ").append(relationship).append("\n");
                    }
                }
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
            }
        }

        // 4. 피해자 정보
        Victim victim = victimRepository.findByScenarioId(scenario.getId()).orElse(null);
        if (victim != null) {
            contextBuilder.append("\n## 피해자 정보\n");
            contextBuilder.append(String.format(
                    "- 이름: %s\n" +
                            "- 나이: %d\n" +
                            "- 성별: %s\n" +
                            "- 직업: %s\n" +
                            "- 배경: %s\n" +
                            "- 발견 장소: %s\n" +
                            "- 추정 사망 시각: %s\n" +
                            "- 사인: %s\n",
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
    public InvestigationReportResponse getInvestigationReport(long sessionId) {
        GameSession session = getSession(sessionId);

        int cluesCollected = discoveredClueRepository.countBySession(session);
        int totalInterrogations = chatMessageRepository.countBySessionAndRole(session, "user");

        // TODO: keyTalk은 용의자 심문 API에서 설정됨. 심문 API 담당자가 ChatMessage.keyTalk 플래그 설정 필요
        List<ChatMessage> keyTalks = chatMessageRepository.findBySessionIdAndKeyTalkTrueOrderByCreatedAtDesc(sessionId);

        resetSession(session);

        return InvestigationReportResponse.from(session, totalInterrogations, cluesCollected, keyTalks);
    }

    // TODO: 테스트 필요
    @Override
    public InvestigationReportResponse getOtherInvestigationReport(long sessionId) {
        GameSession session = getSession(sessionId);

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
    public SubmitResponse submit(long sessionId, SubmitRequest request) {
        GameSession session = getSession(sessionId);
        User user = session.getUser();
        int attempts = session.getSubmitAttempts() != null ? session.getSubmitAttempts() : 0;

        // 1. 게임 상태 확인
        if (session.getStatus() != Status.PLAYING) {
            return SubmitResponse.boardInvalid(sessionId, "NOT_PLAYING",
                    "진행 중인 게임이 아닙니다.", attempts);
        }

        // 2. 제출 횟수 확인 (>= 3이면 FAIL)
        if (attempts >= 3) {
            session.failGame();
            gameSessionRepository.save(session);
            // 유저 플레이 시간 누적
            long playTime = session.getPlayTime() != null ? session.getPlayTime() : 0;
            user.addPlayTime(playTime);
            return SubmitResponse.failed(sessionId, session.getCompletedAt(),
                    "최대 제출 횟수를 초과하여 게임이 종료되었습니다.");
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

            // GameSession에 제출한 동기 임베딩 저장
            //session.setSubmittedMotiveEmbedding(vectorToString(motiveEmbedding));}


        // 6. truthConfigJson에서 정답 확인
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


        // 7. 범인 틀림 → 횟수 증가 + 게임화면으로
        if (!culpritCorrect) {
            session.incrementSubmitAttempts();
            int newAttempts = session.getSubmitAttempts();

            // 3회 다 썼으면 FAILED
            if (newAttempts >= 3) {
                session.failGame();
                gameSessionRepository.save(session);

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

        // 연관 데이터 삭제
        boardConnectionRepository.deleteBySessionId(sessionId);
        boardNodeRepository.deleteBySessionId(sessionId);
        discoveredClueRepository.deleteBySessionId(sessionId);
        chatMessageRepository.deleteBySessionId(sessionId);
        eventLogRepository.deleteBySessionId(sessionId);

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
    private GameSession getSession(long sessionId) {
        return gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new BaseException(ErrorCode.SESSION_NOT_FOUND));
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
