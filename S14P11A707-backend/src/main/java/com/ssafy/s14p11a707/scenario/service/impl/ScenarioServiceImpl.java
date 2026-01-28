package com.ssafy.s14p11a707.scenario.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.s14p11a707.game.entity.ScenarioRanking;
import com.ssafy.s14p11a707.game.repository.ScenarioRankingRepository;
import com.ssafy.s14p11a707.scenario.dto.*;
import com.ssafy.s14p11a707.scenario.entity.*;
import com.ssafy.s14p11a707.scenario.repository.*;
import com.ssafy.s14p11a707.scenario.service.RoomLayoutService; // ★ 추가됨
import com.ssafy.s14p11a707.scenario.service.ScenarioService;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScenarioServiceImpl implements ScenarioService {

    private final ChatClient chatClient;
    private final EmbeddingModel embeddingModel;
    //private final ScenarioReActHandler reActHandler;
    private final ScenarioRepository scenarioRepository;
    private final VictimRepository victimRepository;
    private final SuspectRepository suspectRepository;
    private final ClueRepository clueRepository;
    private final RoomRepository roomRepository;
    private final ScenarioRankingRepository scenarioRankingRepository;
    private final UserRepository userRepository;

    // ★ 랜덤 가구 배치 서비스 주입
    private final RoomLayoutService roomLayoutService;

    @Override
    public ScenarioCreateResponse createScenario(ScenarioCreateRequest request) {
        int estimatedSeconds = Math.max(20, Math.min(120, 25 + request.suspectCount() * 10));

        ScenarioCreateResponse.OriginalRequest originalRequest = new ScenarioCreateResponse.OriginalRequest(request.title(), request.userSynopsis(), request.genre(), request.suspectCount());
        try {
            // 1. 사용자 입력 메시지
            String userMessage = String.format("""
                    {
                      "title": "%s",
                      "genre": "%s",
                      "suspect_count": %d,
                      "synopsis": "%s"
                    }
                    """, request.title(), request.genre(), request.suspectCount(), request.userSynopsis());

            // 2. 첫 번째 AI 호출: 사건 타임라인 생성
            String timelineSystemMessage = """
                                        추리 게임의 시나리오를 생성하기 위한 작업이야 아래에 명시해주는 내용과 형식 기반으로 응답을 하고 그 외에 사담을 섞지 말고 응답을 제공해, Json pretty print 형식으로 출력:
                    
                    첫번째 AI 호출 작업 = Timeline 생성
                    
                    Persona: 당신은 전문 추리 게임 시나리오 작가입니다. 당신은 논리적으로 사건의 트릭, 반전, 그리고 타임라인이 독자 및 게임의 사용자들이 납득할 수 있는 시나리오를 작성하는데 있어서 특화되어 있습니다.
                    당신은 사용자가 제공한 '장르', '인원수', '간단한 시놉시스'를 바탕으로 사건의 타임라인을 우선 작성해야 합니다 작업의 순서는 다음과 같습니다:
                    
                    사건이 일어난 하루의 타임라인을 30분 간격으로 JSON 배열 형식으로 작성하십시오.
                    
                    1) 사건과 사건이 일어난 하루의 TImeline 생성 단계 수행
                    
                    1) 사건과 사건이 일어난 하루의 TImeline 생성 단계 수행 시 주의사항:
                    
                    - 범인 은닉: 타임라인상에서 범인의 이름을 직접적으로 살해 행위("사건 발생 — 최도윤이 안준호를 살해")와 연결하지 마십시오. 대신 "사건 발생 시각", "비명 소리 발생", 또는 "정전 발생"과 같이 객관적인 현상 위주로 서술하십시오.
                    - 중립적 서술: 모든 용의자의 행동은 범행 여부와 관계없이 의심스럽거나 알리바이를 증명하는 활동 위주로 구성하십시오. (예: "서재 근처에서 목격됨", "자리를 비움" 등)
                    - 결말 포함 금지: 1단계 타임라인에서는 '범인 체포', '범행 자백', '사인 확인'과 같은 수사 결과나 엔딩 내용을 포함하지 마십시오. 타임라인은 사건 발생 및 발견 시점까지만 구성하거나, 발견 이후의 혼란 상황까지만 묘사하십시오.
                    - 증거 위주 구성: 타임라인 생성 단계에서는 유저가 직접 수사를 통해서 얻고 추리를 해야하는 증거 등에 대한 직접적인 언급을 피하십시오
                    
                    출력 예시:
                                       {
                                          "timeline": [
                                            {"time": "22:00", "event": "피해자가 연구실에 도착"},
                                            {"time": "23:00", "event": "용의자 A와 피해자가 언쟁"},
                                            {"time": "23:30", "event": "사건 발생"}
                                          ]
                                        }
                    """;

            StringBuilder timelineSb = new StringBuilder();
            chatClient.prompt()
                    .system(timelineSystemMessage)
                    .user(userMessage)
                    .stream()
                    .content()
                    .doOnNext(timelineSb::append)
                    .blockLast();

            String timelineJson = timelineSb.toString();

            // 3. 두 번째 AI 호출: 타임라인을 바탕으로 시나리오 전체 생성
            // ★ 중요: rooms 부분 프롬프트 수정 (room_type을 명확하게 지정)
            String scenarioSystemMessage = """
                    Persona: 당신은 전문 추리 게임 시나리오 작가입니다. 논리적 트릭과 반전이 포함된 시나리오를 작성하는 데 특화되어 있습니다. 유저가 단서를 통해 동기, 범인, 수법을 추리할 수 있도록 구성하십시오.
                    
                    아래의 사건 타임라인을 참고하여 시나리오를 JSON 형식으로 작성하십시오.
                    
                    ### 생성 및 작성 규칙 (엄격 준수):
                    1. **고유 ID 사용 (중요)**:
                       - 모든 용의자는 `1`, `2`와 같은 고유 ID를 부여하십시오.
                       - 모든 단서는 `1`, `2`와 같은 고유 ID를 부여하십시오.
                       - `truth_config_json` 내의 `culprit_id`와 `weapon_clue_id`는 반드시 위에서 정의한 고유 ID 문자열을 참조하십시오.
                    
                    2. **타임라인 확장**:
                       - 1단계의 모든 항목을 `story_config_json.timeline`에 포함하십시오.
                       - 각 타임라인 객체는 반드시 `{"time": "HH:MM", "event": "내용", "witness": "목격자ID 또는 관련자ID"}` 형식을 유지해야 합니다.
                    
                    3. **공간 및 단서 제한**:
                       - `rooms`는 반드시 6개(floor_number는 id와 동일한 역할을 하기 때문에 중복이 없도록 합니다)로 고정하십시오.
                       - 단서(`clues`)의 총 개수는 20개 이하로 제한하십시오.
                    
                    4. **"assistant_comment": "코멘트" 영역 작성 지침***:
                       - 해당 comment는 조수가 탐정(유저)에게 말을 거는 느낌으로 친근함과 몰입감을 제공하는걸 목적으로 함
                       - 단서 획득 시 좀 더 관심을 가질 수 있도록 해주는 역할을 메인으로 수행할 뿐 직접적인 추리 단서 제공 등은 피해야 함
                       - 해당 영역 작성 시 추리에 직접적인 힌트가 될 수 있는지 여부를 마지막에 다시 확인 후 만약 그렇다면 내용을 다시 작성해야 함
                       - 예시: 피 묻은 장갑 획득 시:
                         "assistant_comment": "장갑에 뭐가 잔뜩 묻어있는 것 같아요 탐정님, 이거 혹시 피 아닌가요?" }
                    
                    시나리오 작성 형식:
                    {
                      "scenario": {
                            "title": "[시나리오 제목]",
                            "synopsis": "[한 줄 요약]",
                            "synopsisDetail": "[상세 줄거리 200자 내외]",
                            "thumbnailUrl": "[썸네일 이미지 URL]",
                            "story_config_json": {
                              "incident_time": "[YYYY-MM-DD HH:MM 형식의 발생 시각]",
                              "twist": "[반전 요소]",
                              "timeline": [
                                { "time": "HH:MM", "event": "내용", "witness": 0 }
                              ],
                              "narration": {
                                "opening": "[시작 나레이션]",
                                "epilogue": "[엔딩 나레이션]",
                                "culprit_monologue": "[범인 검거 시 독백]",
                                "unsolved_monologue": "[미해결 시 독백]"
                              }
                            },
                            "truth_config_json": {
                              "culprit_id": 0,
                              "motive": "[상세 동기]",
                              "weapon_clue_id": 0,
                              "method": "[상세 수법]",
                              "location_floor": 0,
                              "cause_of_death": "[사인 상세]"
                            }
                          },
                          "victim": {
                            "name": "[이름]",
                            "age": 0,
                            "gender": "[남성/여성]",
                            "occupation": "[직업]",
                            "background": "[배경 설명]",
                            "discovery_location": "[장소]",
                            "estimated_death_time": "[시각]",
                            "cause_of_death": "[사인]",
                            "victim_detail_json": {
                              "secret": "[비밀]",
                              "hidden_info": "[정보]"
                            }
                          },
                          "suspects": [
                            {
                              "name": "[이름]",
                              "age": 0,
                              "gender": "[성별]",
                              "occupation": "[직업]",
                              "one_liner": "[성격 요약]",
                              "is_culprit": false,
                              "motive": "[동기]",
                              "ai_config_json": {
                                "personality": "[성격]",
                                "relationship": "[관계]",
                                "knowledge_scope": {
                                  "knows_about": "[아는 정보 목록 문자열]",
                                  "doesnt_know": "[모르는 정보 목록 문자열]"
                                },
                                "secret": {
                                  "title": "[비밀 제목]",
                                  "content": "[비밀 내용]",
                                  "weakness_clue": {
                                    "id": 0,
                                    "name": "[단서명]",
                                    "description": "[설명]"
                                  },
                                  "alibi_progression": {
                                    "level1_lie": "[거짓말]",
                                    "level2_partial": "[부분 인정]",
                                    "level3_truth": "[진실]"
                                  }
                                },
                                "deflection_strategy": {
                                  "target_name": "[타겟 이름]",
                                  "suspicion_point": "[의심 포인트]",
                                  "dialogue_hint": "[대화 힌트]"
                                },
                                "timeline_alibi": [
                                  { "time": "HH:MM", "location": "장소", "activity": "활동", "is_verified": false }
                                ]
                              }
                            }
                          ],
                          "clues": [
                            {
                              "name": "[단서명]",
                              "description": "[설명]",
                              "importance": "[LOW/MEDIUM/HIGH/CRITICAL]",
                              "assistant_comment": "[조수 코멘트]",
                              "clue_detail_json": {
                                "revealed_truth": "[밝혀지는 사실]",
                                "related_suspect_ids": [0, 1],
                                "discovery_script": "[발견 대사]",
                                "is_weakness_clue_for": 0
                              }
                            }
                          ],
                          "rooms": [
                            {
                              "floor_number": 0,
                              "room_type": "[유형]",
                              "room_name": "[이름]",
                              "description": "[설명]",
                              "assistant_comment": "[조수 코멘트]"
                            }
                          ]
                        }
                    """;

            StringBuilder scenarioSb = new StringBuilder();
            chatClient.prompt()
                    .system(scenarioSystemMessage)
                    .user(timelineJson) // 첫 번째 응답(타임라인)을 두 번째 프롬프트에 주입
                    .stream()
                    .content()
                    .doOnNext(scenarioSb::append)
                    .blockLast();

            String scenarioJson = scenarioSb.toString();

            // Markdown 코드 블록 제거
            scenarioJson = scenarioJson.replaceAll("```json\\s*", "")
                    .replaceAll("```\\s*$", "")
                    .trim();

            // 5. JSON 파싱
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(scenarioJson);


            String title = root.path("scenario").path("title").asText();
            String synopsis = root.path("scenario").path("synopsis").asText();
            String synopsisDetail = root.path("scenario").path("synopsisDetail").asText();

            JsonNode storyConfig = root.path("scenario").path("story_config_json");
            JsonNode truthConfig = root.path("scenario").path("truth_config_json");

            // Embedding 생성
            String motiveText = truthConfig.path("motive").asText();
            String causeOfDeathText = truthConfig.path("cause_of_death").asText();

            float[] motiveEmbedding = embeddingModel.embed(motiveText);
            float[] causeEmbedding = embeddingModel.embed(causeOfDeathText);

            // float[] → 문자열로 변환
            String motiveEmbeddingStr = arrayToVectorString(motiveEmbedding);
            String causeEmbeddingStr = arrayToVectorString(causeEmbedding);

            // 6. Scenario 엔티티 저장
            Scenario scenario = Scenario.builder()
                    .title(title)
                    .userSynopsis(request.userSynopsis())
                    .synopsis(synopsis)
                    .synopsisDetail(synopsisDetail)
                    .genre(request.genre())
                    .suspectCount(request.suspectCount())
                    .playCount(0)
                    .generationStatus(Scenario.GenerationStatus.COMPLETED)
                    .generationError(null)
                    .storyConfigJson(storyConfig)
                    .truthConfigJson(truthConfig)
                    .correctMotiveEmbedding(motiveEmbeddingStr)
                    .build();

            scenarioRepository.saveScenario(scenario);


            // 7. Victim 저장
            JsonNode victimNode = root.path("victim");
            Victim victim = Victim.builder()
                    .scenario(scenario)
                    .name(victimNode.path("name").asText())
                    .age(victimNode.path("age").asInt())
                    .gender(victimNode.path("gender").asText())
                    .occupation(victimNode.path("occupation").asText())
                    .background(victimNode.path("background").asText())
                    .discoveryLocation(victimNode.path("discovery_location").asText())
                    .estimatedDeathTime(victimNode.path("estimated_death_time").asText())
                    .causeOfDeath(victimNode.path("cause_of_death").asText())
                    .victimDetailJson(victimNode.path("victim_detail_json"))
                    .portraitUrl("https://example.com/victim.jpg")
                    .build();
            victimRepository.saveVictim(victim);

            // 8. Suspects 저장
            List<Suspect> suspects = new ArrayList<>();
            int displayOrder = 1;
            for (JsonNode suspectNode : root.path("suspects")) {
                Suspect suspect = Suspect.builder()
                        .scenario(scenario)
                        .name(suspectNode.path("name").asText())
                        .age(suspectNode.path("age").asInt())
                        .gender(suspectNode.path("gender").asText())
                        .occupation(suspectNode.path("occupation").asText())
                        .culprit(suspectNode.path("is_culprit").asBoolean())
                        .motive(suspectNode.path("motive").asText())
                        .oneLiner(suspectNode.path("one_liner").asText())
                        .aiConfigJson(suspectNode.path("ai_config_json"))
                        .displayOrder(displayOrder++)
                        .portraitUrl("https://example.com/suspect.jpg")
                        .build();
                suspects.add(suspect);
            }
            suspectRepository.saveSuspects(suspects);

            // 9. Rooms 저장
            // ★ RoomLayoutService를 호출하여 랜덤 가구 배치 적용
            Map<Integer, Room> roomMap = new LinkedHashMap<>();
            for (JsonNode roomNode : root.path("rooms")) {
                int floorNumber = roomNode.path("floor_number").asInt();

                // 같은 floor_number가 없을 때만 추가
                if (!roomMap.containsKey(floorNumber)) {
                    // AI가 생성한 방 타입 (living, kitchen 등)
                    String roomType = roomNode.path("room_type").asText("living");

                    // ★ 랜덤 배치 서비스 호출
                    JsonNode objectLayout = roomLayoutService.generateRandomLayout(roomType);

                    Room room = Room.builder()
                            .scenario(scenario)
                            .floorNumber(floorNumber)
                            .roomType(roomType) // AI가 준 타입 사용
                            .roomName(roomNode.path("room_name").asText())
                            .description(roomNode.path("description").asText())
                            .assistantComment(roomNode.path("assistant_comment").asText())
                            .objectJson(objectLayout) // ★ 생성된 가구 배치 JSON 저장
                            .build();
                    roomMap.put(floorNumber, room);
                }
            }
            List<Room> savedRooms = roomRepository.saveRooms(new ArrayList<>(roomMap.values()));

            // 10. Clues 저장
            List<Clue> clues = new ArrayList<>();
            Room defaultRoom = savedRooms.isEmpty() ? null : savedRooms.getFirst();

            for (JsonNode clueNode : root.path("clues")) {
                String importanceStr = clueNode.path("importance").asText("SUPPORTING");
                Clue.Importance importance = "CRITICAL".equalsIgnoreCase(importanceStr)
                        ? Clue.Importance.CRITICAL
                        : "RED_HERRING".equalsIgnoreCase(importanceStr)
                        ? Clue.Importance.RED_HERRING
                        : Clue.Importance.SUPPORTING;

                Clue clue = Clue.builder()
                        .scenario(scenario)
                        .room(defaultRoom)
                        .name(clueNode.path("name").asText())
                        .importance(importance)
                        .description(clueNode.path("description").asText())
                        .clueDetailJson(clueNode.path("clue_detail_json"))
                        .detailImageUrl("https://example.com/clue.jpg")
                        .assistantComment(null)
                        .transformJson(mapper.createObjectNode()) // 추후 단서 배치 로직 적용 시 변경 필요
                        .build();
                clues.add(clue);
            }
            clueRepository.saveClues(clues);

            ScenarioCreateResponse.OriginalRequest originalRequest1 = new ScenarioCreateResponse.OriginalRequest(request.title(), synopsis, request.genre(), request.suspectCount());

            // 11. 응답 반환
            return new ScenarioCreateResponse(
                    scenario.getId(),
                    "COMPLETED",
                    estimatedSeconds,
                    null,
                    originalRequest1
            );

        } catch (Exception e) {
            log.error("Scenario generation failed", e);
            Scenario scenario = Scenario.builder()
                    .title(request.title())
                    .userSynopsis(request.userSynopsis())
                    .synopsis(request.userSynopsis())
                    .genre(request.genre())
                    .suspectCount(request.suspectCount())
                    .generationStatus(Scenario.GenerationStatus.FAILED)
                    .generationError(e.getMessage())
                    .build();
            scenarioRepository.saveScenario(scenario);

            return new ScenarioCreateResponse(
                    -1L,
                    "FAILED",
                    estimatedSeconds,
                    e.getMessage(),
                    originalRequest
            );

        }
    }

    @Override
    public ScenarioDeleteResponse deleteScenario(long scenarioId) {
        scenarioRepository.deleteById(scenarioId);
        return new ScenarioDeleteResponse(scenarioId, true);
    }

    @Override
    public ScenarioRankingResponse getScenarioRankings(long scenarioId, OidcUser oidcUser) {
        List<ScenarioRanking> rankings = scenarioRankingRepository
                .findByScenarioIdOrderByScoreDescClearTimeAsc(scenarioId);

        List<ScenarioRankingResponse.Ranking> rankingResponses = rankings.stream()
                .map(ranking -> new ScenarioRankingResponse.Ranking(
                        rankings.indexOf(ranking) + 1, // rank (1-based index)
                        ranking.getUser().getId(),
                        ranking.getUser().getNickname(),
                        ranking.getScore(),
                        ranking.getClearTime(),
                        ranking.getRankGrade().name()
                ))
                .toList();

        // 현재 사용자의 클리어 여부 확인
        boolean hasUserCleared = false;
        if (oidcUser != null) {
            String googleId = oidcUser.getSubject();
            User currentUser = userRepository.findByGoogleId(googleId).orElse(null);

            if (currentUser != null) {
                hasUserCleared = rankings.stream()
                        .anyMatch(ranking -> ranking.getUser().getId() == currentUser.getId());
            }
        }

        return new ScenarioRankingResponse(scenarioId, hasUserCleared, rankingResponses);
    }

    @Override
    @Transactional(readOnly = true)
    public RoomListResponse getRooms(long scenarioId) {
        Scenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new IllegalArgumentException("Scenario not found: " + scenarioId));

        List<Room> rooms = roomRepository.findByScenarioIdOrderByFloorNumberAsc(scenarioId);

        List<RoomListResponse.Room> roomResponses = rooms.stream()
                .map(room -> new RoomListResponse.Room(
                        room.getId(),
                        room.getFloorNumber(),
                        room.getRoomType(),
                        room.getRoomName(),
                        room.getDescription(),
                        room.getAssistantComment(),
                        room.getObjectJson()
                ))
                .toList();

        return new RoomListResponse(scenarioId, scenario.getTitle(), roomResponses);
    }

    @Override
    @Transactional(readOnly = true)
    public VictimResponse getVictim(long scenarioId) {
        Victim victim = victimRepository.findByScenarioId(scenarioId)
                .orElseThrow(() -> new IllegalArgumentException("Victim not found for scenario: " + scenarioId));

        VictimResponse.Victim response = new VictimResponse.Victim(
                victim.getId(),
                victim.getName(),
                victim.getAge() != null ? victim.getAge() : 0,
                victim.getGender(),
                victim.getOccupation(),
                victim.getDiscoveryLocation(),
                victim.getEstimatedDeathTime(),
                victim.getCauseOfDeath(),
                victim.getBackground(),
                victim.getPortraitUrl()
        );

        return new VictimResponse(scenarioId, response);
    }

    @Override
    @Transactional(readOnly = true)
    public SuspectListResponse getSuspects(long scenarioId) {
        List<Suspect> suspects =
                suspectRepository.findByScenarioIdOrderByDisplayOrderAsc(scenarioId);

        List<SuspectListResponse.Suspect> suspectResponses = suspects.stream()
                .map(suspect -> new SuspectListResponse.Suspect(
                        suspect.getId(),
                        suspect.getName(),
                        suspect.getAge() != null ? suspect.getAge() : 0,
                        suspect.getGender(),
                        suspect.getOccupation(),
                        suspect.getOneLiner(),
                        suspect.getPortraitUrl(),
                        suspect.getDisplayOrder() != null ? suspect.getDisplayOrder() : 0
                ))
                .toList();

        return new SuspectListResponse(scenarioId, suspectResponses);
    }

    @Override
    @Transactional(readOnly = true)
    public ScenarioListResponse listScenarios() {
        List<Scenario> scenarios = scenarioRepository.findAll();

        List<ScenarioListResponse.Item> items = scenarios.stream()
                .map(scenario -> new ScenarioListResponse.Item(
                        scenario.getId(),
                        scenario.getTitle(),
                        scenario.getSynopsis(),
                        scenario.getGenre(),
                        scenario.getThumbnailUrl(),
                        scenario.getPlayCount(),
                        scenario.getAvgRating(),
                        scenario.getAvgDifficulty(),
                        scenario.getGenerationStatus() != null ? scenario.getGenerationStatus().name() : "UNKNOWN",
                        null, // progress - 추후 구현
                        scenario.getGenerationError()
                ))
                .toList();

        return new ScenarioListResponse(items, 1, items.size(), 0);
    }

    @Override
    @Transactional(readOnly = true)
    public ScenarioListResponse searchScenarios(String keyword) {
        List<Scenario> scenarios;

        if (keyword == null || keyword.isBlank()) {
            scenarios = scenarioRepository.findAll();
        } else {
            scenarios = scenarioRepository.findByTitleContainingOrSynopsisContaining(
                    keyword.trim()
            );
        }

        List<ScenarioListResponse.Item> items = scenarios.stream()
                .map(scenario -> new ScenarioListResponse.Item(
                        scenario.getId(),
                        scenario.getTitle(),
                        scenario.getSynopsis(),
                        scenario.getGenre(),
                        scenario.getThumbnailUrl(),
                        scenario.getPlayCount(),
                        scenario.getAvgRating(),
                        scenario.getAvgDifficulty(),
                        scenario.getGenerationStatus() != null ? scenario.getGenerationStatus().name() : "UNKNOWN",
                        null,
                        scenario.getGenerationError()
                ))
                .toList();

        return new ScenarioListResponse(items, 1, items.size(), 0);
    }

    @Override
    @Transactional(readOnly = true)
    public ScenarioDetailResponse getScenario(long scenarioId) {
        Scenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new IllegalArgumentException("Scenario not found: " + scenarioId));

        // Victim 정보
        ScenarioDetailResponse.Victim victim = null;
        var victimEntity = victimRepository.findByScenarioId(scenarioId).orElse(null);
        if (victimEntity != null) {
            victim = new ScenarioDetailResponse.Victim(
                    victimEntity.getId(),
                    victimEntity.getName(),
                    victimEntity.getAge() != null ? victimEntity.getAge() : 0,
                    victimEntity.getGender(),
                    victimEntity.getOccupation(),
                    victimEntity.getBackground(),
                    victimEntity.getDiscoveryLocation(),
                    victimEntity.getEstimatedDeathTime(),
                    victimEntity.getCauseOfDeath(),
                    victimEntity.getPortraitUrl()
            );
        }

        // Suspects 정보
        List<Suspect> suspectEntities =
                suspectRepository.findByScenarioIdOrderByDisplayOrderAsc(scenarioId);
        List<ScenarioDetailResponse.Suspect> suspects = suspectEntities.stream()
                .map(s -> new ScenarioDetailResponse.Suspect(
                        s.getId(),
                        s.getName(),
                        s.getAge() != null ? s.getAge() : 0,
                        s.getGender(),
                        s.getOccupation(),
                        s.getOneLiner(),
                        s.getPortraitUrl(),
                        s.getDisplayOrder() != null ? s.getDisplayOrder() : 0
                ))
                .toList();

        // Rankings
        List<ScenarioRanking> rankingEntities = scenarioRankingRepository
                .findByScenarioIdOrderByScoreDescClearTimeAsc(scenarioId);

        List<ScenarioDetailResponse.ScenarioRanking> rankings = rankingEntities.stream()
                .map(ranking -> new ScenarioDetailResponse.ScenarioRanking(
                        rankingEntities.indexOf(ranking) + 1, // rank
                        ranking.getUser().getId(),
                        ranking.getUser().getNickname(),
                        ranking.getScore(),
                        ranking.getClearTime(),
                        ranking.getRankGrade().name()
                ))
                .toList();

        return new ScenarioDetailResponse(
                scenario.getId(),
                scenario.getTitle(),
                scenario.getSynopsis(),
                scenario.getSynopsisDetail(),
                scenario.getGenre(),
                scenario.getThumbnailUrl(),
                scenario.getPlayCount(),
                scenario.getAvgRating(),
                scenario.getAvgDifficulty(),
                victim,
                suspects,
                rankings
        );
    }

    @Override
    public ScenarioStatusResponse getScenarioStatus(long scenarioId) {
        Scenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new IllegalArgumentException("Scenario not found: " + scenarioId));

        String status = scenario.getGenerationStatus() != null
                ? scenario.getGenerationStatus().name()
                : "UNKNOWN";

        int progress = switch (Objects.requireNonNull(scenario.getGenerationStatus())) {
            case GENERATING -> 50;
            case COMPLETED -> 100;
            case FAILED -> 0;
        };

        String message = scenario.getGenerationError();
        if (message == null && scenario.getGenerationStatus() == Scenario.GenerationStatus.COMPLETED) {
            message = "Scenario generation completed successfully";
        } else if (message == null && scenario.getGenerationStatus() == Scenario.GenerationStatus.GENERATING) {
            message = "Scenario is being generated...";
        }

        return new ScenarioStatusResponse(scenarioId, status, progress, message);
    }

    /**
     * float[] 배열을 문자열 형식으로 변환
     */
    private String arrayToVectorString(float[] array) {
        if (array == null) return null;
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < array.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(array[i]);
        }
        sb.append("]");
        return sb.toString();
    }
}