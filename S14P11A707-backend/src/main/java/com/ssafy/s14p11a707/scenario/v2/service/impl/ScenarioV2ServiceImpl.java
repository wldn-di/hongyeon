package com.ssafy.s14p11a707.scenario.v2.service.impl;

import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.scenario.repository.ScenarioRepository;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateRequest;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateResponse;
import com.ssafy.s14p11a707.scenario.v2.job.ScenarioV2JobRunner;
import com.ssafy.s14p11a707.scenario.v2.service.ScenarioV2Service;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 시나리오 생성 v2 서비스 구현체
 * <p>
 * 시나리오 생성 요청을 접수하면,
 * 생성 상태({@link Scenario.GenerationStatus})가 GENERATING인 {@link Scenario}를 먼저 저장하고
 * {@link ScenarioV2JobRunner}를 통해 백그라운드 생성 작업을 시작한다.
 * </p>
 * <p><b>트랜잭션</b></p>
 * <p>
 * 요청 접수/초기 엔티티 저장은 {@link Transactional} 범위에서 수행되며,
 * 백그라운드 작업은 별도 스레드에서 수행된다.
 * </p>
 * <p><b>예외</b></p>
 * <ul>
 *   <li>이미 생성 중인 시나리오가 존재하면 {@link BaseException}({@link ErrorCode#SCENARIO_ALREADY_GENERATING}) 발생</li>
 *   <li>사용자 조회 실패 시 {@link BaseException}({@link ErrorCode#UNAUTHORIZED}) 발생</li>
 * </ul>
 *
 * @see ScenarioV2Service
 * @see ScenarioV2JobRunner
 * @see ScenarioRepository
 */
@Service
@RequiredArgsConstructor
public class ScenarioV2ServiceImpl implements ScenarioV2Service {

    private final ScenarioRepository scenarioRepository;
    private final UserRepository userRepository;
    private final ScenarioV2JobRunner scenarioV2JobRunner;

    /**
     * 시나리오 생성 요청을 접수하고 비동기 작업 시작 응답 반환
     * <p>
     * 동일 사용자가 이미 생성 중이면 중복 요청을 차단하고,
     * 생성 대상 {@link Scenario}를 저장한 뒤 {@link ScenarioV2JobRunner#runAsync(long, long, ScenarioV2CreateRequest)}를 호출한다.
     * </p>
     *
     * @param request 시나리오 생성 요청 DTO
     * @param userId 요청 사용자 식별자(id)
     * @return 생성 시작 응답 DTO
     * @throws BaseException 생성 중복 또는 사용자 인증 실패 등 비즈니스 예외
     */
    @Override
    @Transactional
    public ScenarioV2CreateResponse createScenario(ScenarioV2CreateRequest request, long userId) {
        if (scenarioRepository.existsByCreatorIdAndGenerationStatus(userId, Scenario.GenerationStatus.GENERATING)) {
            throw new BaseException(ErrorCode.SCENARIO_ALREADY_GENERATING);
        }

        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));

        Scenario scenario = Scenario.builder()
                .creator(creator)
                .title(request.title())
                .userSynopsis(request.userSynopsis())
                .synopsis(request.userSynopsis())
                .suspectCount(request.suspectCount())
                .genre(request.genre())
                .generationStatus(Scenario.GenerationStatus.GENERATING)
                .playCount(0)
                .build();

        scenarioRepository.saveScenario(scenario);

        scenarioV2JobRunner.runAsync(userId, scenario.getId(), request);

        return new ScenarioV2CreateResponse(
                scenario.getId(),
                Scenario.GenerationStatus.GENERATING.name(),
                null,
                null
        );
    }
}
