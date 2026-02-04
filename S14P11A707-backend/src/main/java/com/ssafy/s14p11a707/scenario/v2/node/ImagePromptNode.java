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
        String commonImagePrefix = buildCommonImagePrefix(scenario, state);

        jobs.add(new ScenarioV2ImageJob(
                ScenarioV2ImageJob.Target.SCENARIO_THUMBNAIL,
                scenario.getId(),
                "scenarios/%d/thumbnail.png".formatted(scenario.getId()),
                """
                %s

                Create a single cinematic noir scene image for a mystery detective game.
                Depict a single atmospheric scene that suggests mystery and danger through lighting, props, and setting.
                One continuous scene only: no collage, no montage, no split-screen, no panels, no grids, no inset images.
                """.formatted(commonImagePrefix)
        ));

        // Victim portrait
        JsonNode victimAppearance = victim.getVictimDetailJson() != null
                ? victim.getVictimDetailJson().path("appearance")
                : null;
        String victimGender = safe(victim.getGender());
        String victimGenderWord = toGenderWord(victimGender);
        String victimGenderFaceCue = toGenderFaceCue(victimGender);
        String victimOccupation = truncate(safe(victim.getOccupation()), 80);
        if (victimOccupation.isEmpty()) {
            victimOccupation = "their profession";
        }
        String victimMoodCue = truncate(safe(victim.getBackground()), 180);
        if (victimMoodCue.isEmpty()) {
            victimMoodCue = "none";
        }
        String victimAppearanceDetails = victimAppearance != null && !victimAppearance.isMissingNode() && !victimAppearance.isNull()
                ? buildAppearanceText(victimAppearance)
                : "Realistic hair, " + (victimGenderFaceCue.isEmpty() ? "realistic facial features" : victimGenderFaceCue) + ", normal build, appropriate attire, neutral expression.";

        jobs.add(new ScenarioV2ImageJob(
                ScenarioV2ImageJob.Target.VICTIM_PORTRAIT,
                victim.getId(),
                "scenarios/%d/victim/%d.png".formatted(scenario.getId(), victim.getId()),
                """
                %s

                Create a photorealistic black-and-white portrait image for a mystery detective game.
                Depict an adult %s, around %s years old, with %s.
                Clothing and props should subtly match a %s.
                %s
                Tragic, mysterious mood; cinematic noir lighting with dramatic shadows.
                Mood cue is %s.
                """.formatted(
                commonImagePrefix,
                victimGenderWord,
                victim.getAge() != null ? victim.getAge().toString() : "adult",
                victimGenderFaceCue.isEmpty() ? "realistic facial features" : victimGenderFaceCue,
                victimOccupation,
                victimAppearanceDetails,
                victimMoodCue
        )
        ));

        for (Suspect suspect : suspects) {
            JsonNode suspectAppearance = suspect.getAiConfigJson() != null
                    ? suspect.getAiConfigJson().path("appearance")
                    : null;
            String suspectGender = safe(suspect.getGender());
            String suspectGenderWord = toGenderWord(suspectGender);
            String suspectGenderFaceCue = toGenderFaceCue(suspectGender);
            String suspectOccupation = truncate(safe(suspect.getOccupation()), 80);
            if (suspectOccupation.isEmpty()) {
                suspectOccupation = "their profession";
            }
            String suspectMoodCue = truncate(safe(suspect.getOneLiner()), 180);
            if (suspectMoodCue.isEmpty()) {
                suspectMoodCue = "none";
            }
            String suspectAppearanceDetails = suspectAppearance != null && !suspectAppearance.isMissingNode() && !suspectAppearance.isNull()
                    ? buildAppearanceText(suspectAppearance)
                    : "Realistic hair, " + (suspectGenderFaceCue.isEmpty() ? "realistic facial features" : suspectGenderFaceCue) + ", normal build, appropriate attire, neutral expression.";

            jobs.add(new ScenarioV2ImageJob(
                    ScenarioV2ImageJob.Target.SUSPECT_PORTRAIT,
                    suspect.getId(),
                    "scenarios/%d/suspects/%d.png".formatted(scenario.getId(), suspect.getId()),
                    """
                    %s

                    Create a photorealistic black-and-white portrait image for a mystery detective game.
                    Depict an adult %s, around %s years old, with %s.
                    Clothing and props should subtly match a %s.
                    %s
                    Suspicious, tense mood; cinematic noir lighting with dramatic shadows.
                    Mood cue is %s.
                    """.formatted(
                    commonImagePrefix,
                    suspectGenderWord,
                    suspect.getAge() != null ? suspect.getAge().toString() : "adult",
                    suspectGenderFaceCue.isEmpty() ? "realistic facial features" : suspectGenderFaceCue,
                    suspectOccupation,
                    suspectAppearanceDetails,
                    suspectMoodCue
            )
            ));
        }

        for (Clue clue : clues) {
            Room foundIn = clue.getRoom();
            String foundInText = foundIn == null
                    ? ""
                    : "%s (%s)".formatted(safe(foundIn.getRoomName()), safe(foundIn.getRoomType()));
            String clueMoodCue = truncate(safe(clue.getDescription()), 220);
            if (clueMoodCue.isEmpty()) {
                clueMoodCue = "none";
            }

            jobs.add(new ScenarioV2ImageJob(
                    ScenarioV2ImageJob.Target.CLUE_IMAGE,
                    clue.getId(),
                    "scenarios/%d/clues/%d.png".formatted(scenario.getId(), clue.getId()),
                    """
                    %s

                    Create a photorealistic black-and-white macro close-up image of a clue object for a mystery detective game.
                    Depict a single physical clue object, %s.
                    If the clue would normally contain writing (paper, label, screen), render it blank with no visible characters.
                    Mood cue is %s.
                    Location cue is %s.
                    Composition should be a single object centered on a surface, shallow depth of field, cinematic noir lighting.
                    """.formatted(
                            commonImagePrefix,
                            truncate(safe(clue.getName()), 80),
                            clueMoodCue,
                            truncate(foundInText, 80)
                    )
            ));
        }

        for (Room room : rooms) {
            jobs.add(new ScenarioV2ImageJob(
                    ScenarioV2ImageJob.Target.ROOM_BACKGROUND,
                    room.getId(),
                    "scenarios/%d/rooms/%d.png".formatted(scenario.getId(), room.getId()),
                    """
                    %s

                    Create a photorealistic black-and-white room interior image for a mystery detective game.
                    Depict the interior of a %s (%s).
                    %s
                    Composition should be first-person view, atmospheric, cinematic noir lighting, realistic textures.
                    """.formatted(
                            commonImagePrefix,
                            truncate(safe(room.getRoomType()), 60),
                            truncate(safe(room.getRoomName()), 60),
                            truncate(safe(room.getDescription()), 260)
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

    /**
     * Collapse all whitespace (including newlines) into single spaces so long narrative fields
     * don't accidentally become multi-paragraph prompts.
     */
    private String compact(String value) {
        if (value == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(value.length());
        boolean lastWasSpace = false;
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (Character.isWhitespace(c)) {
                if (!lastWasSpace) {
                    sb.append(' ');
                    lastWasSpace = true;
                }
                continue;
            }
            sb.append(c);
            lastWasSpace = false;
        }
        return sb.toString().trim();
    }

    /**
     * Keep prompts bounded. Imagen calls are repeated per image job, so we should not repeat
     * extremely long fields verbatim.
     */
    private String truncate(String value, int maxChars) {
        String v = compact(value);
        if (v.isEmpty()) {
            return "";
        }
        if (maxChars <= 0 || v.length() <= maxChars) {
            return v;
        }
        int suffixLen = 3; // "..."
        int end = Math.max(1, maxChars - suffixLen);
        return v.substring(0, end).trim() + "...";
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
            sb.append(ethnicity).append(" appearance, ");
        }

        String hair = hairStyle.isEmpty() ? "realistic hair" : hairStyle;
        if (!hairColor.isEmpty()) {
            hair += " (" + hairColor + ")";
        }
        sb.append(hair);

        if (!eyeColor.isEmpty()) {
            sb.append(", ").append(eyeColor).append(" eyes");
        }
        if (!facialFeatures.isEmpty()) {
            sb.append(", ").append(facialFeatures);
        }
        if (!bodyType.isEmpty()) {
            sb.append(", ").append(bodyType).append(" build");
        }
        if (!clothingStyle.isEmpty()) {
            sb.append(", wearing ").append(clothingStyle);
        }
        if (!expression.isEmpty()) {
            sb.append(", ").append(expression).append(" expression");
        }
        if (!distinctiveTrait.isEmpty() && !distinctiveTrait.equals("없음")) {
            sb.append(", ").append(distinctiveTrait);
        }

        String out = compact(sb.toString());
        if (out.endsWith(",")) {
            out = out.substring(0, out.length() - 1).trim();
        }
        if (!out.endsWith(".")) {
            out += ".";
        }
        return out;
    }

    private String buildCommonImagePrefix(Scenario scenario, ScenarioV2State state) {
        StringBuilder sb = new StringBuilder();

        sb.append("Photorealistic black-and-white monochrome, cinematic noir.\n");
        sb.append("Single full-bleed image that fills the entire canvas edge-to-edge.\n");
        sb.append("Centered composition; keep key subjects within safe margins.\n");
        sb.append("No visible text, letters, numbers, symbols, logos, watermarks, UI, or readable writing.\n");
        sb.append("One continuous scene only: no collage, no montage, no split-screen, no panels, no grids, no inset images.\n");
        sb.append("Consistent worldbuilding across all images (props, clothing, architecture).\n");

        JsonNode storyConfig = scenario.getStoryConfigJson();
        JsonNode visualBible = storyConfig == null ? null : storyConfig.path("visual_bible_json");
        if (visualBible != null && visualBible.isObject()) {
            String era = truncate(safe(visualBible.path("era").asText(null)), 80);
            String locale = truncate(safe(visualBible.path("locale").asText(null)), 80);
            String season = truncate(safe(visualBible.path("season").asText(null)), 60);
            String timeOfDay = truncate(safe(visualBible.path("time_of_day").asText(null)), 60);
            String lighting = truncate(safe(visualBible.path("lighting").asText(null)), 80);
            String palette = truncate(safe(visualBible.path("color_palette").asText(null)), 80);

            // These fields often contain "polaroid/instant-film/frame" style words from the LLM. Strip them.
            String visualStyle = sanitizeStyleKeywords(truncate(safe(visualBible.path("visual_style").asText(null)), 120));
            String camera = sanitizeStyleKeywords(truncate(safe(visualBible.path("camera").asText(null)), 120));

            if (!era.isEmpty() || !locale.isEmpty() || !season.isEmpty() || !timeOfDay.isEmpty()) {
                sb.append("Set in ");
                if (!era.isEmpty()) sb.append(era).append(" ");
                if (!locale.isEmpty()) sb.append(locale).append(" ");
                if (!season.isEmpty()) sb.append(season).append(" ");
                if (!timeOfDay.isEmpty()) sb.append(timeOfDay).append(" ");
                sb.append(".\n");
            }
            if (!lighting.isEmpty()) sb.append("Lighting is ").append(lighting).append(".\n");
            if (!palette.isEmpty()) sb.append("Palette is ").append(palette).append(".\n");
            if (!visualStyle.isEmpty()) sb.append("Style is ").append(visualStyle).append(".\n");
            if (!camera.isEmpty()) sb.append("Camera look is ").append(camera).append(".\n");

            String avoid = joinArray(visualBible.path("avoid"));
            if (!avoid.isEmpty()) {
                sb.append("Avoid ").append(truncate(avoid, 160)).append(".\n");
            }
        }

        String styleKeywords = sanitizeStyleKeywords(safe(state.getRequest().style()));
        if (!styleKeywords.isEmpty()) {
            sb.append("Style keywords include ").append(truncate(styleKeywords, 160)).append(".\n");
        }

        return sb.toString();
    }

    private String toGenderWord(String gender) {
        String g = gender == null ? "" : gender.toLowerCase();
        if ((gender != null && gender.contains("남")) || g.contains("male") || g.contains("man")) {
            return "man";
        }
        if ((gender != null && gender.contains("여")) || g.contains("female") || g.contains("woman")) {
            return "woman";
        }
        return "person";
    }

    private String toGenderFaceCue(String gender) {
        String g = gender == null ? "" : gender.toLowerCase();
        if ((gender != null && gender.contains("남")) || g.contains("male") || g.contains("man")) {
            return "masculine facial features (strong jawline)";
        }
        if ((gender != null && gender.contains("여")) || g.contains("female") || g.contains("woman")) {
            return "feminine facial features";
        }
        return "";
    }

    private String sanitizeStyleKeywords(String styleKeywords) {
        String s = compact(styleKeywords);
        if (s.isEmpty()) {
            return "";
        }

        // Remove terms that tend to create frames/printouts or readable text in the generated image.
        s = s.replace("폴라로이드", "");
        s = s.replace("인스턴트필름", "");
        s = s.replace("인스턴트 필름", "");
        s = s.replace("액자", "");
        s = s.replace("프레임", "");
        s = s.replace("테두리", "");
        s = s.replace("여백", "");
        s = s.replace("텍스트", "");
        s = s.replace("자막", "");
        s = s.replace("워터마크", "");

        s = s.replaceAll("(?i)polaroid", "");
        s = s.replaceAll("(?i)instant[- ]?film", "");
        s = s.replaceAll("(?i)frame", "");
        s = s.replaceAll("(?i)border", "");
        s = s.replaceAll("(?i)margin", "");
        s = s.replaceAll("(?i)text", "");

        return compact(s);
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
