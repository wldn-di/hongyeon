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
        String visualBiblePrefix = buildVisualBiblePrefix(scenario, state);
        String incidentTime = scenario.getStoryConfigJson() != null ? safe(scenario.getStoryConfigJson().path("incident_time").asText(null)) : "";
        String twist = scenario.getStoryConfigJson() != null ? safe(scenario.getStoryConfigJson().path("twist").asText(null)) : "";

        jobs.add(new ScenarioV2ImageJob(
                ScenarioV2ImageJob.Target.SCENARIO_THUMBNAIL,
                scenario.getId(),
                "scenarios/%d/thumbnail.png".formatted(scenario.getId()),
                """
                Create a cinematic thumbnail image for a mystery detective game.

                %s

                SCENARIO CONTEXT:
                - Genre: %s
                - Title: %s
                - Synopsis: %s
                - Synopsis Detail: %s
                - Incident time: %s
                - Twist: %s
                """.formatted(
                        visualBiblePrefix,
                        safe(scenario.getGenre()),
                        safe(scenario.getTitle()),
                        safe(scenario.getSynopsis()),
                        safe(scenario.getSynopsisDetail()),
                        incidentTime,
                        twist
                )
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
                %s

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
                - black-and-white monochrome instant-film (Polaroid) photo aesthetic
                - film grain/noise, dust/scratches, slight vignette, soft focus
                - cinematic noir lighting, dramatic shadows
                - Atmosphere: mysterious, crime scene victim, tragic mood
                """.formatted(
                visualBiblePrefix,
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
                    %s

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
                    - black-and-white monochrome instant-film (Polaroid) photo aesthetic
                    - film grain/noise, dust/scratches, slight vignette, soft focus
                    - cinematic noir lighting, dramatic shadows
                    - Atmosphere: suspicious, hiding something, interrogation room mood
                    """.formatted(
                    visualBiblePrefix,
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
            Room foundIn = clue.getRoom();
            String foundInText = foundIn == null
                    ? ""
                    : "Found in: floor %d, %s (%s)".formatted(
                            foundIn.getFloorNumber(),
                            safe(foundIn.getRoomName()),
                            safe(foundIn.getRoomType())
                    );

            jobs.add(new ScenarioV2ImageJob(
                    ScenarioV2ImageJob.Target.CLUE_IMAGE,
                    clue.getId(),
                    "scenarios/%d/clues/%d.png".formatted(scenario.getId(), clue.getId()),
                    """
                    Close-up evidence photo for a mystery detective game.

                    %s

                    Clue name: %s
                    Description: %s
                    Importance: %s
                    %s
                    STYLE:
                    - black-and-white monochrome evidence photo, instant-film (Polaroid) aesthetic
                    - film grain/noise, dust/scratches, slight vignette, soft focus
                    """.formatted(
                            visualBiblePrefix,
                            clue.getName(),
                            safe(clue.getDescription()),
                            clue.getImportance() == null ? "" : clue.getImportance().name(),
                            foundInText
                    )
            ));
        }

        for (Room room : rooms) {
            jobs.add(new ScenarioV2ImageJob(
                    ScenarioV2ImageJob.Target.ROOM_BACKGROUND,
                    room.getId(),
                    "scenarios/%d/rooms/%d.png".formatted(scenario.getId(), room.getId()),
                    """
                    Background image of a room interior for a mystery detective game.

                    %s

                    Floor: %d
                    Room Type: %s
                    Room Name: %s
                    Description: %s
                    STYLE:
                    - first-person view, atmospheric, noir, cinematic, realistic
                    - black-and-white monochrome instant-film (Polaroid) photograph, film grain/noise, dust/scratches
                    """.formatted(
                            visualBiblePrefix,
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
        String ethnicity = safe(appearance.path("ethnicity").asText());
        String hairStyle = safe(appearance.path("hair_style").asText());
        String hairColor = safe(appearance.path("hair_color").asText());
        String eyeColor = safe(appearance.path("eye_color").asText());
        String facialFeatures = safe(appearance.path("facial_features").asText());
        String bodyType = safe(appearance.path("body_type").asText());
        String clothingStyle = safe(appearance.path("clothing_style").asText());
        String expression = safe(appearance.path("expression").asText());
        String distinctiveTrait = safe(appearance.path("distinctive_trait").asText());

        StringBuilder sb = new StringBuilder();

        if (!ethnicity.isEmpty()) {
            sb.append("- Ethnicity: ").append(ethnicity).append("\n");
        }

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

    private String buildVisualBiblePrefix(Scenario scenario, ScenarioV2State state) {
        StringBuilder sb = new StringBuilder();
        sb.append("VISUAL CONSISTENCY (apply to all images):\n");
        sb.append("- Output medium: black-and-white monochrome photo ONLY (no color).\n");
        sb.append("- Aesthetic: noisy analog instant-film (Polaroid) photo; film grain, dust/scratches, slight vignette, soft focus.\n");
        sb.append("- Continuity: props/clothing/architecture must match Era/Locale/Season/Time of day.\n");

        JsonNode storyConfig = scenario.getStoryConfigJson();
        JsonNode visualBible = storyConfig == null ? null : storyConfig.path("visual_bible_json");
        if (visualBible != null && visualBible.isObject()) {
            appendIfPresent(sb, "Era", safe(visualBible.path("era").asText(null)));
            appendIfPresent(sb, "Locale", safe(visualBible.path("locale").asText(null)));
            appendIfPresent(sb, "Season", safe(visualBible.path("season").asText(null)));
            appendIfPresent(sb, "Time of day", safe(visualBible.path("time_of_day").asText(null)));
            appendIfPresent(sb, "Lighting", safe(visualBible.path("lighting").asText(null)));
            appendIfPresent(sb, "Color palette", safe(visualBible.path("color_palette").asText(null)));
            appendIfPresent(sb, "Visual style", safe(visualBible.path("visual_style").asText(null)));
            appendIfPresent(sb, "Camera", safe(visualBible.path("camera").asText(null)));

            String avoid = joinArray(visualBible.path("avoid"));
            if (!avoid.isEmpty()) {
                sb.append("- Avoid: ").append(avoid).append("\n");
            }
        }

        String styleKeywords = safe(state.getRequest().style());
        if (!styleKeywords.isEmpty()) {
            sb.append("- Style keywords: ").append(styleKeywords).append("\n");
        }

        sb.append("- Do NOT add any text, watermark, logo, UI overlay.\n");
        return sb.toString();
    }

    private void appendIfPresent(StringBuilder sb, String label, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        sb.append("- ").append(label).append(": ").append(value.trim()).append("\n");
    }

    private String joinArray(JsonNode node) {
        if (node == null || !node.isArray()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        for (JsonNode item : node) {
            String text = safe(item.asText(null)).trim();
            if (text.isEmpty()) {
                continue;
            }
            if (!sb.isEmpty()) {
                sb.append(", ");
            }
            sb.append(text);
        }
        return sb.toString();
    }
}
