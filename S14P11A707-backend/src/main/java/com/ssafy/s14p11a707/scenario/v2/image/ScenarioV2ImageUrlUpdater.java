package com.ssafy.s14p11a707.scenario.v2.image;

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
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 시나리오 v2 이미지 URL 반영 컴포넌트
 * <p>
 * {@link com.ssafy.s14p11a707.scenario.v2.node.ImageBatchNode}가 업로드한 이미지 URL을
 * 도메인 엔티티({@link Scenario}, {@link Victim}, {@link Suspect}, {@link Clue}, {@link Room})의 URL 필드에 기록한다.
 * </p>
 * <p><b>트랜잭션</b></p>
 * <p>
 * 본 컴포넌트의 URL 반영 작업은 {@link Transactional} 범위 내에서 수행되며,
 * 조회 실패 또는 갱신 중 예외가 발생하면 롤백된다.
 * </p>
 * <p><b>예외</b></p>
 * <ul>
 *   <li>시나리오/피해자 조회 실패 시 {@link BaseException}({@link ErrorCode})을 발생</li>
 * </ul>
 *
 * @see ScenarioV2ImageJob.Target
 * @see ScenarioRepository
 * @see VictimRepository
 * @see SuspectRepository
 * @see ClueRepository
 * @see RoomRepository
 */
@Component
@RequiredArgsConstructor
public class ScenarioV2ImageUrlUpdater {

    private final ScenarioRepository scenarioRepository;
    private final VictimRepository victimRepository;
    private final SuspectRepository suspectRepository;
    private final ClueRepository clueRepository;
    private final RoomRepository roomRepository;

    /**
     * 업로드 결과(URL)를 엔티티에 반영
     * <p>
     * {@code urlByKey}는 {@code "TARGET:ID"} 형태의 키를 사용하며, 존재하는 URL만 각 엔티티의 URL 필드에 설정한다.
     * </p>
     *
     * @param scenarioId 시나리오 식별자(id)
     * @param urlByKey 업로드된 객체 키별 URL 매핑(예: {@code SCENARIO_THUMBNAIL:10 -> https://.../thumbnail.png})
     * @throws BaseException 시나리오 또는 피해자를 찾을 수 없을 때
     */
    @Transactional
    public void applyImageUrls(long scenarioId, Map<String, String> urlByKey) {
        Scenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new BaseException(ErrorCode.SCENARIO_NOT_FOUND));

        String thumbnailUrl = urlByKey.get(key(ScenarioV2ImageJob.Target.SCENARIO_THUMBNAIL, scenario.getId()));
        if (thumbnailUrl != null) {
            scenario.setThumbnailUrl(thumbnailUrl);
        }

        Victim victim = victimRepository.findByScenarioId(scenarioId)
                .orElseThrow(() -> new BaseException(ErrorCode.VICTIM_NOT_FOUND));
        String victimUrl = urlByKey.get(key(ScenarioV2ImageJob.Target.VICTIM_PORTRAIT, victim.getId()));
        if (victimUrl != null) {
            victim.setPortraitUrl(victimUrl);
        }

        for (Suspect suspect : suspectRepository.findByScenarioIdOrderByDisplayOrderAsc(scenarioId)) {
            String suspectUrl = urlByKey.get(key(ScenarioV2ImageJob.Target.SUSPECT_PORTRAIT, suspect.getId()));
            if (suspectUrl != null) {
                suspect.setPortraitUrl(suspectUrl);
            }
        }

        for (Clue clue : clueRepository.findByScenarioId(scenarioId)) {
            String clueUrl = urlByKey.get(key(ScenarioV2ImageJob.Target.CLUE_IMAGE, clue.getId()));
            if (clueUrl != null) {
                clue.setDetailImageUrl(clueUrl);
            }
        }

        for (Room room : roomRepository.findByScenarioIdOrderByFloorNumberAsc(scenarioId)) {
            String roomUrl = urlByKey.get(key(ScenarioV2ImageJob.Target.ROOM_BACKGROUND, room.getId()));
            if (roomUrl != null) {
                room.setBackgroundImageUrl(roomUrl);
            }
        }
    }

    private static String key(ScenarioV2ImageJob.Target target, long targetId) {
        return target.name() + ":" + targetId;
    }
}
