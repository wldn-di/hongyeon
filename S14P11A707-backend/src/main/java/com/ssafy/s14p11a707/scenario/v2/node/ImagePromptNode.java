package com.ssafy.s14p11a707.scenario.v2.node;

import com.fasterxml.jackson.databind.JsonNode;
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
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State;
import com.ssafy.s14p11a707.scenario.v2.image.ScenarioV2ImageJob;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 이미지 생성 프롬프트/작업 목록 구성 노드
 * <p>
 * 영속화된 도메인 엔티티({@link Scenario}, {@link Victim}, {@link Suspect}, {@link Clue}, {@link Room})를 조회하여,
 * 생성해야 할 이미지 목록({@link ScenarioV2ImageJob})을 구성한다.
 * </p>
 * <p><b>이미지 정책</b></p>
 * <ul>
 *   <li>고정 장수(예: 30장) 방식이 아닌, 실제 URL 필드가 존재하는 엔티티만 대상으로 생성한다.</li>
 *   <li>대상 필드: {@link Scenario#setThumbnailUrl(String)}, {@link Victim#setPortraitUrl(String)},
 *       {@link Suspect#setPortraitUrl(String)}, {@link Clue#setDetailImageUrl(String)}, {@link Room#setBackgroundImageUrl(String)}</li>
 * </ul>
 * <p><b>트랜잭션</b></p>
 * <p>
 * 조회 전용 노드로 {@link Transactional#readOnly()} 트랜잭션에서 실행된다.
 * </p>
 *
 * @see ImageBatchNode
 * @see ScenarioV2ImageJob.Target
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ImagePromptNode implements ScenarioV2Node {

    private final ScenarioRepository scenarioRepository;
    private final VictimRepository victimRepository;
    private final SuspectRepository suspectRepository;
    private final ClueRepository clueRepository;
    private final RoomRepository roomRepository;
    private final ScenarioV2EventPublisher eventPublisher;

    /**
     * 이미지 작업 목록을 생성하여 상태에 저장
     * <p>
     * 시나리오/인물/단서/방 정보를 바탕으로 objectKey와 프롬프트를 구성한 뒤,
     * {@link ScenarioV2State#setImageJobs(List)}에 저장한다.
     * </p>
     *
     * @param state 현재 상태
     * @return 이미지 작업 목록이 반영된 상태
     * @throws BaseException 시나리오 또는 피해자 조회에 실패했을 때
     */
    @Override
    @Transactional(readOnly = true)
    public ScenarioV2State execute(ScenarioV2State state) {
        log.info("[v2] ImagePromptNode execute. scenarioId={}", state.getScenarioId());

        eventPublisher.publish(new ScenarioV2EventMessage(
                state.getUserId(),
                state.getScenarioId(),
                EventType.IMAGE_PROMPT,
                65,
                "증거 사진 촬영 지시서를 작성 중…",
                null
        ));

        Scenario scenario = scenarioRepository.findById(state.getScenarioId())
                .orElseThrow(() -> new BaseException(ErrorCode.SCENARIO_NOT_FOUND));

        Victim victim = victimRepository.findByScenarioId(state.getScenarioId())
                .orElseThrow(() -> new BaseException(ErrorCode.VICTIM_NOT_FOUND));

        List<Suspect> suspects = suspectRepository.findByScenarioIdOrderByDisplayOrderAsc(state.getScenarioId());
        List<Clue> clues = clueRepository.findByScenarioId(state.getScenarioId()).stream()
                .sorted(Comparator.comparingLong(Clue::getId))
                .toList();
        List<Room> rooms = roomRepository.findByScenarioIdOrderByFloorNumberAsc(state.getScenarioId());

        List<ScenarioV2ImageJob> jobs = new ArrayList<>();

        jobs.add(new ScenarioV2ImageJob(
                ScenarioV2ImageJob.Target.SCENARIO_THUMBNAIL,
                scenario.getId(),
                "scenarios/%d/thumbnail.png".formatted(scenario.getId()),
                """
                Create a cinematic thumbnail image for a mystery detective game.
                Genre: %s
                Title: %s
                Synopsis: %s
                Style: %s
                """.formatted(scenario.getGenre(), scenario.getTitle(), scenario.getSynopsis(), safe(state.getRequest().style()))
        ));

        // Victim portrait
        JsonNode victimAppearance = victim.getVictimDetailJson() != null
                ? victim.getVictimDetailJson().path("appearance")
                : null;
        String victimGender = safe(victim.getGender());
        String victimGenderInst = victimGender.contains("남") || victimGender.toLowerCase().contains("male")
                ? "(male: masculine face, strong jawline)"
                : victimGender.contains("여") || victimGender.toLowerCase().contains("female")
                    ? "(female: feminine face)"
                    : "";
        String victimAppearanceDetails = victimAppearance != null && !victimAppearance.isMissingNode() && !victimAppearance.isNull()
                ? buildAppearanceText(victimAppearance)
                : "- Hair: realistic style\n- Face: " + (victimGender.contains("남") || victimGender.toLowerCase().contains("male") ? "masculine features, strong jawline" : "feminine features") + "\n- Body: normal build\n- Clothing: appropriate attire\n- Expression: neutral\n";

        jobs.add(new ScenarioV2ImageJob(
                ScenarioV2ImageJob.Target.VICTIM_PORTRAIT,
                victim.getId(),
                "scenarios/%d/victim/%d.png".formatted(scenario.getId(), victim.getId()),
                """
                MUST CREATE a photorealistic portrait for a mystery detective game victim.

                REQUIRED GENDER:
                - GENDER: %s %s

                IDENTITY:
                - Name: %s
                - Occupation: %s
                - Age: %s
                - Background: %s

                APPEARANCE:
                %s
                STYLE:
                - cinematic noir lighting, realistic textures, 8k quality
                - dramatic shadows, professional photography
                - Atmosphere: mysterious, crime scene victim, tragic mood
                """.formatted(
                victimGender, victimGenderInst,
                victim.getName(),
                safe(victim.getOccupation()),
                victim.getAge() != null ? victim.getAge().toString() : "adult",
                safe(victim.getBackground()),
                victimAppearanceDetails
        )
        ));

        for (Suspect suspect : suspects) {
            JsonNode suspectAppearance = suspect.getAiConfigJson() != null
                    ? suspect.getAiConfigJson().path("appearance")
                    : null;
            String suspectGender = safe(suspect.getGender());
            String suspectGenderInst = suspectGender.contains("남") || suspectGender.toLowerCase().contains("male")
                    ? "(male: masculine face, strong jawline)"
                    : suspectGender.contains("여") || suspectGender.toLowerCase().contains("female")
                        ? "(female: feminine face)"
                        : "";
            String suspectAppearanceDetails = suspectAppearance != null && !suspectAppearance.isMissingNode() && !suspectAppearance.isNull()
                    ? buildAppearanceText(suspectAppearance)
                    : "- Hair: realistic style\n- Face: " + (suspectGender.contains("남") || suspectGender.toLowerCase().contains("male") ? "masculine features, strong jawline" : "feminine features") + "\n- Body: normal build\n- Clothing: appropriate attire\n- Expression: neutral\n";

            jobs.add(new ScenarioV2ImageJob(
                    ScenarioV2ImageJob.Target.SUSPECT_PORTRAIT,
                    suspect.getId(),
                    "scenarios/%d/suspects/%d.png".formatted(scenario.getId(), suspect.getId()),
                    """
                    MUST CREATE a photorealistic portrait for a mystery detective game suspect.

                    REQUIRED GENDER:
                    - GENDER: %s %s

                    IDENTITY:
                    - Name: %s
                    - Occupation: %s
                    - Age: %s
                    - Personality hint: %s

                    APPEARANCE:
                    %s
                    STYLE:
                    - cinematic noir lighting, realistic textures, 8k quality
                    - dramatic shadows, professional photography
                    - Atmosphere: suspicious, hiding something, interrogation room mood
                    """.formatted(
                    suspectGender, suspectGenderInst,
                    suspect.getName(),
                    safe(suspect.getOccupation()),
                    suspect.getAge() != null ? suspect.getAge().toString() : "adult",
                    safe(suspect.getOneLiner()),
                    suspectAppearanceDetails
            )
            ));
        }

        for (Clue clue : clues) {
            jobs.add(new ScenarioV2ImageJob(
                    ScenarioV2ImageJob.Target.CLUE_IMAGE,
                    clue.getId(),
                    "scenarios/%d/clues/%d.png".formatted(scenario.getId(), clue.getId()),
                    """
                    Close-up evidence photo for a mystery detective game.
                    Clue name: %s
                    Description: %s
                    Tone: realistic, cinematic, detailed
                    """.formatted(clue.getName(), safe(clue.getDescription()))
            ));
        }

        for (Room room : rooms) {
            jobs.add(new ScenarioV2ImageJob(
                    ScenarioV2ImageJob.Target.ROOM_BACKGROUND,
                    room.getId(),
                    "scenarios/%d/rooms/%d.png".formatted(scenario.getId(), room.getId()),
                    """
                    Background image of a room interior for a mystery detective game.
                    Floor: %d
                    Room Type: %s
                    Room Name: %s
                    Description: %s
                    Style: first-person view, atmospheric, noir, cinematic, realistic
                    """.formatted(
                            room.getFloorNumber(),
                            safe(room.getRoomType()),
                            safe(room.getRoomName()),
                            safe(room.getDescription())
                    )
            ));
        }

        state.setImageJobs(jobs);
        log.info(
                "[v2] ImagePromptNode completed. scenarioId={}, jobs={}, suspects={}, clues={}, rooms={}",
                state.getScenarioId(),
                jobs.size(),
                suspects.size(),
                clues.size(),
                rooms.size()
        );
        return state;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String buildAppearanceText(JsonNode appearance) {
        String hairStyle = safe(appearance.path("hair_style").asText());
        String hairColor = safe(appearance.path("hair_color").asText());
        String eyeColor = safe(appearance.path("eye_color").asText());
        String facialFeatures = safe(appearance.path("facial_features").asText());
        String bodyType = safe(appearance.path("body_type").asText());
        String clothingStyle = safe(appearance.path("clothing_style").asText());
        String expression = safe(appearance.path("expression").asText());
        String distinctiveTrait = safe(appearance.path("distinctive_trait").asText());

        StringBuilder sb = new StringBuilder();

        String hair = hairStyle.isEmpty() ? "realistic style" : hairStyle;
        if (!hairColor.isEmpty()) hair += ", " + hairColor;
        sb.append("- Hair: ").append(hair).append("\n");

        sb.append("- Eyes: ").append(eyeColor.isEmpty() ? "natural color" : eyeColor).append("\n");
        sb.append("- Face: ").append(facialFeatures.isEmpty() ? "realistic features" : facialFeatures).append("\n");
        sb.append("- Body: ").append(bodyType.isEmpty() ? "normal build" : bodyType).append("\n");
        sb.append("- Clothing: ").append(clothingStyle.isEmpty() ? "appropriate attire" : clothingStyle).append("\n");
        sb.append("- Expression: ").append(expression.isEmpty() ? "natural" : expression).append("\n");

        if (!distinctiveTrait.isEmpty() && !distinctiveTrait.equals("없음")) {
            sb.append("- Distinctive: ").append(distinctiveTrait).append("\n");
        }

        return sb.toString();
    }
}