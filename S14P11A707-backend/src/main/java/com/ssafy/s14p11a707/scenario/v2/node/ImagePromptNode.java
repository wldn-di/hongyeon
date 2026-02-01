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
 * 이미지 생성 프롬프트/작업 목록 구성 노드
 * <p>
 * 영속화된 도메인 엔티티({@link Scenario}, {@link Victim}, {@link Suspect}, {@link Clue})를 조회하여,
 * 생성해야 할 이미지 목록({@link ScenarioV2ImageJob})을 구성한다.
 * </p>
 * <p><b>이미지 정책</b></p>
 * <ul>
 *   <li>고정 장수(예: 30장) 방식이 아닌, 실제 URL 필드가 존재하는 엔티티만 대상으로 생성한다.</li>
 *   <li>대상 필드: {@link Scenario#setThumbnailUrl(String)}, {@link Victim#setPortraitUrl(String)},
 *       {@link Suspect#setPortraitUrl(String)}, {@link Clue#setDetailImageUrl(String)}</li>
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
    private final ScenarioV2EventPublisher eventPublisher;

    /**
     * 이미지 작업 목록을 생성하여 상태에 저장
     * <p>
     * 시나리오/인물/단서 정보를 바탕으로 objectKey와 프롬프트를 구성한 뒤,
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

        jobs.add(new ScenarioV2ImageJob(
                ScenarioV2ImageJob.Target.VICTIM_PORTRAIT,
                victim.getId(),
                "scenarios/%d/victim/%d.png".formatted(scenario.getId(), victim.getId()),
                """
                Portrait of the victim for a mystery detective game.
                Name: %s
                Gender: %s
                Occupation: %s
                Background: %s
                Tone: noir, cinematic, realistic
                """.formatted(victim.getName(), safe(victim.getGender()), safe(victim.getOccupation()), safe(victim.getBackground()))
        ));

        for (Suspect suspect : suspects) {
            jobs.add(new ScenarioV2ImageJob(
                    ScenarioV2ImageJob.Target.SUSPECT_PORTRAIT,
                    suspect.getId(),
                    "scenarios/%d/suspects/%d.png".formatted(scenario.getId(), suspect.getId()),
                    """
                    Portrait of a suspect for a mystery detective game.
                    Name: %s
                    Gender: %s
                    Occupation: %s
                    One-liner: %s
                    Tone: noir, cinematic, realistic
                    """.formatted(
                            suspect.getName(),
                            safe(suspect.getGender()),
                            safe(suspect.getOccupation()),
                            safe(suspect.getOneLiner())
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

        state.setImageJobs(jobs);
        log.info(
                "[v2] ImagePromptNode completed. scenarioId={}, jobs={}, suspects={}, clues={}",
                state.getScenarioId(),
                jobs.size(),
                suspects.size(),
                clues.size()
        );
        return state;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
