package com.ssafy.s14p11a707.scenario.v2.node;

import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.scenario.entity.Clue;
import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.scenario.entity.Suspect;
import com.ssafy.s14p11a707.scenario.entity.Victim;
import com.ssafy.s14p11a707.scenario.repository.ClueRepository;
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
 * 이미지 생성 프롬프트 구성을 담당하는 노드입니다.
 * 텍스트 렌더링 노이즈를 방지하기 위해 'Key: Value' 형태의 레이블을 배제하고 묘사 위주로 구성합니다.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ImagePromptNode implements ScenarioV2Node {

    private final ScenarioRepository scenarioRepository;
    private final VictimRepository victimRepository;
    private final SuspectRepository suspectRepository;
    private final ClueRepository clueRepository;
    private final ScenarioV2EventPublisher eventPublisher;

    /**
     * 텍스트 생성을 강력하게 억제하는 접두사
     */
    private static final String NO_TEXT_PREFIX = "((STRICTLY NO TEXT, NO LETTERS, NO WORDS, NO SYMBOLS)). ";

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

        List<ScenarioV2ImageJob> jobs = new ArrayList<>();

        // 1. Scenario Thumbnail: 'Synopsis:' 레이블을 제거하고 'depicting'으로 연결
        jobs.add(new ScenarioV2ImageJob(
                ScenarioV2ImageJob.Target.SCENARIO_THUMBNAIL,
                scenario.getId(),
                "scenarios/%d/thumbnail.png".formatted(scenario.getId()),
                NO_TEXT_PREFIX + 
                "A cinematic %s atmosphere for a mystery game depicting [%s]. Artistic style: %s."
                .formatted(scenario.getGenre(), scenario.getSynopsis(), safe(state.getRequest().style()))
        ));

        // 2. Victim Portrait: 'Name:', 'Occupation:' 레이블 제거
        jobs.add(new ScenarioV2ImageJob(
                ScenarioV2ImageJob.Target.VICTIM_PORTRAIT,
                victim.getId(),
                "scenarios/%d/victim/%d.png".formatted(scenario.getId(), victim.getId()),
                NO_TEXT_PREFIX +
                "A photorealistic character portrait of a %s in a %s role. Background: %s. Noir cinematic lighting."
                .formatted(safe(victim.getGender()), safe(victim.getOccupation()), safe(victim.getBackground()))
        ));

        // 3. Suspect Portraits: 'One-liner:' 레이블 제거
        for (Suspect suspect : suspects) {
            jobs.add(new ScenarioV2ImageJob(
                    ScenarioV2ImageJob.Target.SUSPECT_PORTRAIT,
                    suspect.getId(),
                    "scenarios/%d/suspects/%d.png".formatted(scenario.getId(), suspect.getId()),
                    NO_TEXT_PREFIX +
                    "A detailed character portrait of a %s %s. The character vibe is [%s]. Realistic studio lighting."
                    .formatted(
                            safe(suspect.getGender()), 
                            safe(suspect.getOccupation()), 
                            safe(suspect.getOneLiner())
                    )
            ));
        }

        // 4. Clue Images: 'Clue name:' 레이블 제거
        for (Clue clue : clues) {
            jobs.add(new ScenarioV2ImageJob(
                    ScenarioV2ImageJob.Target.CLUE_IMAGE,
                    clue.getId(),
                    "scenarios/%d/clues/%d.png".formatted(scenario.getId(), clue.getId()),
                    NO_TEXT_PREFIX +
                    "A macro close-up evidence photo of [%s]. Physical description: [%s]. Sharp focus, realistic textures."
                    .formatted(clue.getName(), safe(clue.getDescription()))
            ));
        }

        state.setImageJobs(jobs);
        log.info("[v2] ImagePromptNode completed. scenarioId={}, jobs={}", state.getScenarioId(), jobs.size());
        return state;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}