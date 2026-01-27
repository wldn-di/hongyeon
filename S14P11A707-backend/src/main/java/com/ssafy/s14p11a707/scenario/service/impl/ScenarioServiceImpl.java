package com.ssafy.s14p11a707.scenario.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.s14p11a707.game.entity.ScenarioRanking;
import com.ssafy.s14p11a707.game.repository.ScenarioRankingRepository;
import com.ssafy.s14p11a707.scenario.dto.*;
import com.ssafy.s14p11a707.scenario.entity.*;
import com.ssafy.s14p11a707.scenario.repository.*;
import com.ssafy.s14p11a707.scenario.service.ScenarioService;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;


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
                    당신은 전문 추리 게임 시나리오 작가입니다.
                    사용자가 제공한 장르, 인원수, 간단한 시놉시스를 바탕으로
                    사건의 타임라인을 JSON 배열 형식으로 작성하세요.
                    
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
            String scenarioSystemMessage = """
                    당신은 전문 추리 게임 시나리오 작가입니다.
                    아래의 사건 타임라인을 참고하여 시나리오를 JSON 형식으로 작성하세요.

                    각 필드에 해당하는 내용을 작성하세요:

                    {
                      "scenario": {
                        "title": "[시나리오 제목 - 예: 호텔 VIP실의 살인자]",
                        "synopsis": "[한 줄 요약 - 예: 독가스로 살해된 회장, 용의자는 4명]",
                        "synopsisDetail": "[상세 줄거리 200자 내외]",
                        "thumbnailUrl": "[썸네일 이미지 URL]",
                        "story_config_json": {
                          "incident_time": "[사건 발생 시각 - 예: 2024-01-15 23:30]",
                          "twist": "[반전 요소 - 예: 피해자는 자살을 위장했으나 실수로 타살됨]",
                          "timeline": "[사건 시간순 배열 - 예: [{time, event, witness}, ...]]",
                          "narration": {
                            "opening": "[게임 시작 나레이션]",
                            "epilogue": "[사건 해결 엔딩 나레이션]",
                            "culprit_monologue": "[범인으로 지정될 때의 독백]",
                            "unsolved_monologue": "[미해결 시 독백]"
                          }
                        },
                        "truth_config_json": {
                          "culprit_id": "[범인 용의자 ID - suspects 배열의 index 0~N 중 하나]",
                          "motive": "[범행 동기 상세 설명 - 예: 피해자가 용의자의 사기를 당하게 해 복수]",
                          "weapon_clue_id": "[흉기 단서 ID - clues 배열의 index 0~N 중 하나]",
                          "method": "[범행 수법 상세]",
                          "location_floor": "[범행 발생 층 번호 - 예: 3]",
                          "cause_of_death": "[사인 상세 설명 - 예: 청산가스 중독으로 인한 질식사]"
                        }
                      },
                      "victim": {
                        "name": "[피해자 이름]",
                        "age": "[피해자 나이 - 숫자]",
                        "gender": "[성별 - 남성/여성]",
                        "occupation": "[직업]",
                        "background": "[피해자 배경 설명]",
                        "discovery_location": "[시체 발견 장소]",
                        "estimated_death_time": "[추정 사망 시각]",
                        "cause_of_death": "[사인]",
                        "victim_detail_json": {
                           "secret": "[피해자의 비밀]",
                           "hidden_info": "[게임 중 공개될 숨겨진 정보]"
                        }
                      },
                      "suspects": [
                        {
                          "name": "[용의자 이름]",
                          "age": "[나이 - 숫자]",
                          "gender": "[성별]",
                          "occupation": "[직업]",
                          "one_liner": "[한 줄 소개/성격 - 예: 냉정하지만 예민한 비서]",
                          "is_culprit": "[범인 여부 - true/false]",
                          "motive": "[범행 동기]",
                          "ai_config_json": {
                            "personality": "[성격 특성]",
                            "relationship": "[피해자와의 관계]",
                            "knowledge_scope": {
                              "knows_about": "[이 용의자가 아는 정보 목록]",
                              "doesnt_know": "[이 용의자가 모르는 정보 목록]"
                            },
                            "secret": {
                              "title": "[비밀 제목]",
                              "content": "[비밀 내용]",
                              "weakness_clue": {
                                "id": "[약점 단서 ID - clues 배열의 index]",
                                "name": "[단서 이름]",
                                "description": "[단서 설명]"
                              },
                              "alibi_progression": {
                                "level1_lie": "[1단계: 완전한 거짓말]",
                                "level2_partial": "[2단계: 부분적 인정]",
                                "level3_truth": "[3단계: 진실]"
                              }
                            },
                            "deflection_strategy": {
                              "target_name": "[혐의 전환 대상 이름]",
                              "suspicion_point": "[의심을 살 포인트]",
                              "dialogue_hint": "[대화 힌트]"
                            },
                            "timeline_alibi": "[시간대별 알리바이 - 예: [{time, location, activity, is_verified}, ...]]"
                          }
                        }
                      ],
                      "clues": [
                        {
                          "name": "[단서 이름]",
                          "description": "[단서 설명]",
                          "importance": "[중요도 - LOW/MEDIUM/HIGH/CRITICAL]",
                          "assistant_comment": "[AI 조력사 코멘트]",
                          "clue_detail_json": {
                            "revealed_truth": "[단서가 밝혀내는 진실]",
                            "related_suspect_ids": "[관련 용의자 ID 목록]",
                            "discovery_script": "[단서 발견시 스크립트]",
                            "is_weakness_clue_for": "[이 단서가 약점인 용의자 ID]"
                          }
                        }
                      ],
                      "rooms": [
                        {
                          "floor_number": "[층 번호 - 숫자]",
                          "room_type": "[방 유형 - 예: 복도, 객실, 레스토랑]",
                          "room_name": "[방 이름]",
                          "description": "[방 설명]",
                          "assistant_comment": "[AI 조력사 코멘트]"
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


            // 5. JSON 파싱
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(scenarioJson);


            String title = root.path("scenario").path("title").asText();
            String synopsis = root.path("scenario").path("synopsis").asText();
            String synopsisDetail = root.path("scenario").path("synopsisDetail").asText();

            JsonNode storyConfig = root.path("scenario").path("story_config_json");
            JsonNode truthConfig = root.path("scenario").path("truth_config_json");
            String motiveText = truthConfig.path("motive").asText();
            String causeOfDeathText = truthConfig.path("cause_of_death").asText();

            // Embedding 생성
            float[] motiveEmbedding = embeddingModel.embed(motiveText);
            float[] causeEmbedding = embeddingModel.embed(causeOfDeathText);


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
                    .correctMotiveEmbedding(motiveEmbedding)
                    .correctCauseOfDeathEmbedding(causeEmbedding)
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
            List<Room> rooms = new ArrayList<>();
            for (JsonNode roomNode : root.path("rooms")) {
                Room room = Room.builder()
                        .scenario(scenario)
                        .floorNumber(roomNode.path("floor_number").asInt())
                        .roomType(roomNode.path("room_type").asText())
                        .roomName(roomNode.path("room_name").asText())
                        .description(roomNode.path("description").asText())
                        .assistantComment(roomNode.path("assistant_comment").asText())
                        .objectJson(mapper.createObjectNode()) // 빈 JSON 객체로 초기화
                        .build();
                rooms.add(room);
            }
            List<Room> savedRooms = roomRepository.saveRooms(rooms);

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
                        .transformJson(mapper.createObjectNode()) // 빈 JSON 객체로 초기화
                        .build();
                clues.add(clue);
            }
            clueRepository.saveClues(clues);

            // 11. 응답 반환
            return new ScenarioCreateResponse(
                    scenario.getId(),
                    "COMPLETED",
                    estimatedSeconds,
                    null,
                    originalRequest
            );

        } catch (Exception e) {
            Scenario scenario = Scenario.builder()
                    .title(request.title())
                    .userSynopsis(request.userSynopsis())
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
    public ScenarioListResponse searchScenarios(String keyword) {
        List<Scenario> scenarios;

        if (keyword == null || keyword.isBlank()) {
            scenarios = scenarioRepository.findAll();
        } else {
            scenarios = scenarioRepository.findByTitleContainingOrSynopsisContaining(
                    keyword.trim(), keyword.trim()
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

        int progress = switch (scenario.getGenerationStatus()) {
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

}
