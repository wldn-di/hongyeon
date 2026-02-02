package com.ssafy.s14p11a707.scenario.v2.node;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.scenario.entity.Clue;
import com.ssafy.s14p11a707.scenario.entity.Room;
import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.scenario.entity.Suspect;
import com.ssafy.s14p11a707.scenario.entity.Victim;
import com.ssafy.s14p11a707.scenario.repository.ClueRepository;
import com.ssafy.s14p11a707.scenario.repository.RoomRepository;
import com.ssafy.s14p11a707.scenario.repository.ScenarioRepository;
import com.ssafy.s14p11a707.scenario.repository.SuspectRepository;
import com.ssafy.s14p11a707.scenario.repository.VictimRepository;
import com.ssafy.s14p11a707.scenario.service.RoomLayoutService;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 시나리오 v2 도메인 영속화 노드
 * <p>
 * 검증/평가를 통과한 draft JSON({@link ScenarioV2State#getDraftJson()})을
 * 도메인 엔티티({@link Scenario}, {@link Victim}, {@link Suspect}, {@link Room}, {@link Clue})로 변환하여 저장한다.
 * </p>
 * <p><b>영속성 협력 객체</b></p>
 * <ul>
 *   <li>{@link ScenarioRepository}, {@link VictimRepository}, {@link SuspectRepository}, {@link RoomRepository}, {@link ClueRepository}</li>
 * </ul>
 * <p><b>부가 처리</b></p>
 * <ul>
 *   <li>동기 텍스트(범행 동기)의 임베딩 생성({@link EmbeddingModel}) 및 {@link Scenario} 반영</li>
 *   <li>방 레이아웃 오브젝트 생성({@link RoomLayoutService}) 및 단서 배치(transformJson) 랜덤 생성</li>
 * </ul>
 * <p><b>트랜잭션</b></p>
 * <p>
 * 본 노드는 {@link Transactional} 범위 내에서 실행되며,
 * 저장 중 예외가 발생하면 전체가 롤백된다.
 * </p>
 *
 * @see com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2GraphRunner
 * @see ImagePromptNode
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class PersistNode implements ScenarioV2Node {

    private static final int ROOM_WIDTH = 320;
    private static final int ROOM_HEIGHT = 320;
    private static final int PADDING = 30;
    private static final int ITEM_GAP = 5;
    private static final int CLUE_WIDTH = 24;
    private static final int CLUE_HEIGHT = 24;
    private static final int DOOR_SAFE_RADIUS = 60;

    private final Random random = new Random();

    private final ScenarioRepository scenarioRepository;
    private final VictimRepository victimRepository;
    private final SuspectRepository suspectRepository;
    private final RoomRepository roomRepository;
    private final ClueRepository clueRepository;
    private final RoomLayoutService roomLayoutService;
    private final EmbeddingModel embeddingModel;
    private final ObjectMapper objectMapper;
    private final ScenarioV2EventPublisher eventPublisher;

    /**
     * draft JSON을 엔티티로 변환하여 저장하고 상태에 식별자 반영
     * <p>
     * {@link Scenario}를 조회하여 생성된 텍스트/설정 JSON을 반영한 뒤,
     * {@link Victim}/{@link Suspect}/{@link Room}/{@link Clue}를 생성하여 저장한다.
     * 저장 결과로 생성된 엔티티 ID를 {@link ScenarioV2State}에 기록한다.
     * </p>
     *
     * @param state 현재 상태
     * @return 영속화 결과(ID 목록)가 반영된 상태
     * @throws BaseException 시나리오 조회에 실패했을 때
     * @throws RuntimeException 저장/임베딩/레이아웃 생성 과정에서 문제가 발생했을 때
     */
    @Override
    @Transactional
    public ScenarioV2State execute(ScenarioV2State state) {
        JsonNode draft = state.getDraftJson();
        log.info(
                "[v2] PersistNode execute. scenarioId={}, draftPresent={}, suspects={}, rooms={}, clues={}",
                state.getScenarioId(),
                draft != null,
                arraySize(draft == null ? null : draft.path("suspects")),
                arraySize(draft == null ? null : draft.path("rooms")),
                arraySize(draft == null ? null : draft.path("clues"))
        );

        if (draft == null) {
            throw new IllegalStateException("draftJson is null");
        }
        if (!"OK".equals(state.getValidationReport())) {
            throw new IllegalStateException("validationReport not OK: " + state.getValidationReport());
        }

        eventPublisher.publish(new ScenarioV2EventMessage(
                state.getUserId(),
                state.getScenarioId(),
                EventType.PERSIST,
                60,
                "수사 노트에 정리해 기록하는 중…",
                null
        ));

        Scenario scenario = scenarioRepository.findById(state.getScenarioId())
                .orElseThrow(() -> new BaseException(ErrorCode.SCENARIO_NOT_FOUND));

        JsonNode scenarioNode = draft.path("scenario");
        JsonNode victimNode = draft.path("victim");
        JsonNode suspectsNode = draft.path("suspects");
        JsonNode cluesNode = draft.path("clues");
        JsonNode roomsNode = draft.path("rooms");

        String title = scenarioNode.path("title").asText(scenario.getTitle());
        String synopsis = scenarioNode.path("synopsis").asText(scenario.getSynopsis());
        String synopsisDetail = scenarioNode.path("synopsisDetail").asText(synopsis);
        JsonNode storyConfigJson = scenarioNode.path("story_config_json");
        JsonNode truthConfigJson = scenarioNode.path("truth_config_json");

        String motiveText = truthConfigJson.path("motive").asText("");
        String motiveEmbeddingStr = arrayToVectorString(embeddingModel.embed(motiveText));

        scenario.applyGeneratedContent(
                title,
                synopsis,
                synopsisDetail,
                storyConfigJson,
                truthConfigJson,
                motiveEmbeddingStr
        );

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
                .portraitUrl(null)
                .build();
        victimRepository.saveVictim(victim);

        List<Suspect> suspects = new ArrayList<>();
        int displayOrder = 1;
        for (JsonNode suspectNode : suspectsNode) {
            JsonNode aiConfigJson = suspectNode.path("ai_config_json");
            if (aiConfigJson == null || aiConfigJson.isMissingNode() || aiConfigJson.isNull()) {
                aiConfigJson = objectMapper.createObjectNode();
            }

            Suspect suspect = Suspect.builder()
                    .scenario(scenario)
                    .name(suspectNode.path("name").asText())
                    .age(suspectNode.path("age").asInt())
                    .gender(suspectNode.path("gender").asText())
                    .occupation(suspectNode.path("occupation").asText())
                    .oneLiner(suspectNode.path("one_liner").asText())
                    .culprit(suspectNode.path("is_culprit").asBoolean(false))
                    .motive(suspectNode.path("motive").asText())
                    .displayOrder(displayOrder++)
                    .portraitUrl(null)
                    .aiConfigJson(aiConfigJson)
                    .build();
            suspects.add(suspect);
        }
        List<Suspect> savedSuspects = suspectRepository.saveSuspects(suspects);

        List<Room> rooms = new ArrayList<>();
        for (JsonNode roomNode : roomsNode) {
            int floorNumber = roomNode.path("floor_number").asInt();
            String roomType = roomNode.path("room_type").asText();
            Room room = Room.builder()
                    .scenario(scenario)
                    .floorNumber(floorNumber)
                    .roomType(roomType)
                    .roomName(roomNode.path("room_name").asText())
                    .description(roomNode.path("description").asText())
                    .assistantComment(roomNode.path("assistant_comment").asText())
                    .objectJson(roomLayoutService.generateRandomLayout(roomType))
                    .build();
            rooms.add(room);
        }
        List<Room> savedRooms = roomRepository.saveRooms(rooms);

        List<Room> roomsByFloor = savedRooms.stream()
                .sorted(Comparator.comparingInt(Room::getFloorNumber))
                .toList();
        Map<Long, List<Rect>> occupiedByRoomId = new HashMap<>();

        List<Clue> clues = new ArrayList<>();
        int clueIndex = 0;
        for (JsonNode clueNode : cluesNode) {
            String importanceStr = clueNode.path("importance").asText("SUPPORTING");
            Clue.Importance importance = toImportance(importanceStr);

            Room targetRoom = roomsByFloor.isEmpty()
                    ? null
                    : roomsByFloor.get(clueIndex % roomsByFloor.size());

            JsonNode transform = objectMapper.createObjectNode();
            if (targetRoom != null) {
                List<Rect> occupied = occupiedByRoomId.computeIfAbsent(targetRoom.getId(), key -> new ArrayList<>());
                transform = generateRandomClueTransform(objectMapper, occupied);
            }

            Clue clue = Clue.builder()
                    .scenario(scenario)
                    .room(targetRoom)
                    .name(clueNode.path("name").asText())
                    .importance(importance)
                    .description(clueNode.path("description").asText())
                    .detailImageUrl(null)
                    .assistantComment(clueNode.path("assistant_comment").asText())
                    .clueDetailJson(clueNode.path("clue_detail_json"))
                    .transformJson(transform)
                    .build();

            clues.add(clue);
            clueIndex++;
        }
        List<Clue> savedClues = clueRepository.saveClues(clues);

        normalizeScenarioTruthConfig(scenario, savedSuspects, savedClues);
        normalizeSuspectWeaknessClues(savedSuspects, savedClues);

        state.setVictimId(victim.getId());
        state.setSuspectIds(savedSuspects.stream().map(Suspect::getId).toList());
        state.setClueIds(savedClues.stream().map(Clue::getId).toList());

        log.info(
                "[v2] PersistNode completed. scenarioId={}, victimId={}, suspects={}, rooms={}, clues={}",
                state.getScenarioId(),
                victim.getId(),
                savedSuspects.size(),
                savedRooms.size(),
                savedClues.size()
        );

        return state;
    }

    private void normalizeScenarioTruthConfig(Scenario scenario, List<Suspect> savedSuspects, List<Clue> savedClues) {
        Long culpritId = savedSuspects.stream()
                .filter(Suspect::isCulprit)
                .findFirst()
                .map(Suspect::getId)
                .orElse(null);
        if (culpritId == null) {
            throw new IllegalStateException("culprit suspect not found");
        }

        Map<String, Long> clueIdByName = clueIdByName(savedClues);

        JsonNode truthConfigJson = scenario.getTruthConfigJson();
        ObjectNode truth = truthConfigJson != null && truthConfigJson.isObject()
                ? (ObjectNode) truthConfigJson.deepCopy()
                : objectMapper.createObjectNode();

        truth.put("culprit_id", culpritId);

        Long weaponClueId = resolveWeaponClueId(truth, clueIdByName);
        truth.put("weapon_clue_id", weaponClueId);

        scenario.setTruthConfigJson(truth);
        scenarioRepository.saveScenario(scenario);
        log.info("[v2] PersistNode normalized truth_config_json. scenarioId={}, culpritId={}, weaponClueId={}", scenario.getId(), culpritId, weaponClueId);
    }

    private void normalizeSuspectWeaknessClues(List<Suspect> savedSuspects, List<Clue> savedClues) {
        Map<String, Long> clueIdByName = clueIdByName(savedClues);

        for (Suspect suspect : savedSuspects) {
            JsonNode aiConfigJson = suspect.getAiConfigJson();
            if (aiConfigJson == null || !aiConfigJson.isObject()) {
                throw new IllegalStateException("ai_config_json must be an object. suspectId=" + suspect.getId());
            }

            ObjectNode ai = (ObjectNode) aiConfigJson.deepCopy();
            ObjectNode secret = ai.path("secret").isObject()
                    ? (ObjectNode) ai.path("secret").deepCopy()
                    : objectMapper.createObjectNode();

            JsonNode weaknessNode = secret.path("weakness_clue");
            if (!weaknessNode.isObject()) {
                throw new IllegalStateException("secret.weakness_clue must be an object. suspectId=" + suspect.getId());
            }

            ObjectNode weakness = (ObjectNode) weaknessNode.deepCopy();
            String weaknessName = weakness.path("name").asText("").trim();
            if (weaknessName.isEmpty()) {
                throw new IllegalStateException("weakness_clue.name is missing. suspectId=" + suspect.getId());
            }

            Long clueId = clueIdByName.get(weaknessName);
            if (clueId == null) {
                throw new IllegalStateException("weakness_clue.name not found in clues: " + weaknessName + " (suspectId=" + suspect.getId() + ")");
            }

            weakness.put("id", clueId);
            secret.set("weakness_clue", weakness);
            ai.set("secret", secret);

            suspect.setAiConfigJson(ai);
        }

        suspectRepository.saveSuspects(savedSuspects);
        log.info("[v2] PersistNode normalized suspect weakness_clue ids. suspects={}", savedSuspects.size());
    }

    private Long resolveWeaponClueId(ObjectNode truthConfig, Map<String, Long> clueIdByName) {
        String weaponName = truthConfig.path("weapon_clue_name").asText("").trim();
        if (!weaponName.isEmpty()) {
            Long id = clueIdByName.get(weaponName);
            if (id == null) {
                throw new IllegalStateException("weapon_clue_name not found in clues: " + weaponName);
            }
            return id;
        }

        JsonNode weaponIdNode = truthConfig.get("weapon_clue_id");
        Long weaponIdCandidate = coerceLong(weaponIdNode);
        if (weaponIdCandidate != null && clueIdByName.containsValue(weaponIdCandidate)) {
            return weaponIdCandidate;
        }

        throw new IllegalStateException("weapon clue unresolved: provide truth_config_json.weapon_clue_name matching clues[].name");
    }

    private static Long coerceLong(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return null;
        }
        if (node.canConvertToLong()) {
            long value = node.asLong();
            return value == 0L ? null : value;
        }
        if (node.isTextual()) {
            String text = node.asText("").trim();
            if (text.matches("^[0-9]+$")) {
                long value = Long.parseLong(text);
                return value == 0L ? null : value;
            }
        }
        return null;
    }

    private static Map<String, Long> clueIdByName(List<Clue> savedClues) {
        Map<String, Long> map = new HashMap<>();
        for (Clue clue : savedClues) {
            String name = clue.getName();
            if (name == null || name.isBlank()) {
                continue;
            }
            map.putIfAbsent(name, clue.getId());
        }
        return map;
    }

    private Clue.Importance toImportance(String raw) {
        if ("CRITICAL".equalsIgnoreCase(raw) || "HIGH".equalsIgnoreCase(raw)) {
            return Clue.Importance.CRITICAL;
        }
        if ("RED_HERRING".equalsIgnoreCase(raw)) {
            return Clue.Importance.RED_HERRING;
        }
        return Clue.Importance.SUPPORTING;
    }

    private String arrayToVectorString(float[] array) {
        if (array == null) {
            return null;
        }
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < array.length; i++) {
            if (i > 0) {
                sb.append(",");
            }
            sb.append(array[i]);
        }
        sb.append("]");
        return sb.toString();
    }

    private record Rect(int x, int y, int width, int height) {
        boolean intersects(Rect other) {
            return this.x < other.x + other.width &&
                    this.x + this.width > other.x &&
                    this.y < other.y + other.height &&
                    this.y + this.height > other.y;
        }
    }

    private JsonNode generateRandomClueTransform(ObjectMapper mapper, List<Rect> occupiedRects) {
        int attempts = 0;
        int doorX = ROOM_WIDTH / 2;
        int doorY = ROOM_WIDTH - 40;

        while (attempts < 20) {
            attempts++;
            int x = PADDING + random.nextInt(ROOM_WIDTH - 2 * PADDING - CLUE_WIDTH);
            int y = PADDING + random.nextInt(ROOM_HEIGHT - 2 * PADDING - CLUE_HEIGHT);

            Rect newRect = new Rect(
                    x - ITEM_GAP,
                    y - ITEM_GAP,
                    CLUE_WIDTH + ITEM_GAP * 2,
                    CLUE_HEIGHT + ITEM_GAP * 2
            );

            double distToDoor = Math.sqrt(
                    Math.pow(x + CLUE_WIDTH / 2.0 - doorX, 2) +
                            Math.pow(y + CLUE_HEIGHT / 2.0 - doorY, 2)
            );
            if (distToDoor < DOOR_SAFE_RADIUS) {
                continue;
            }

            boolean collision = false;
            for (Rect existing : occupiedRects) {
                if (newRect.intersects(existing)) {
                    collision = true;
                    break;
                }
            }
            if (collision) {
                continue;
            }

            occupiedRects.add(newRect);
            var node = mapper.createObjectNode();
            node.put("x", x);
            node.put("y", y);
            return node;
        }

        var fallback = mapper.createObjectNode();
        fallback.put("x", ROOM_WIDTH / 2);
        fallback.put("y", ROOM_HEIGHT / 2);
        return fallback;
    }

    private static int arraySize(JsonNode node) {
        return node != null && node.isArray() ? node.size() : -1;
    }
}
