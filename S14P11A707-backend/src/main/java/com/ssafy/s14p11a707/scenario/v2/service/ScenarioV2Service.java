package com.ssafy.s14p11a707.scenario.v2.service;

import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateRequest;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateResponse;

/**
 * 시나리오 생성 v2 애플리케이션 서비스
 * <p>
 * 시나리오 생성 요청을 접수하고 도메인 엔티티를 초기 생성한 뒤,
 * 백그라운드 생성 작업을 시작하도록 오케스트레이션한다.
 * </p>
 * <p><b>설계 메모</b></p>
 * <ul>
 *   <li>v2는 생성 시작 응답({@link ScenarioV2CreateResponse})과 진행 스트림({@link com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent})을 분리한다.</li>
 * </ul>
 *
 * @see com.ssafy.s14p11a707.scenario.v2.service.impl.ScenarioV2ServiceImpl
 */
public interface ScenarioV2Service {

    /**
     * 시나리오 생성 작업을 시작하고 시작 응답 반환
     * <p>
     * 입력값을 검증하고 생성 중복 여부를 확인한 뒤,
     * 생성 대상 {@link com.ssafy.s14p11a707.scenario.entity.Scenario}를 저장하고 비동기 작업을 실행한다.
     * </p>
     *
     * @param request 시나리오 생성 요청 DTO
     * @param userId 요청 사용자 식별자(id)
     * @return 생성 시작 응답 DTO
     * @throws com.ssafy.s14p11a707.exception.BaseException 생성 중복 또는 사용자 인증 실패 등 비즈니스 예외
     */
    ScenarioV2CreateResponse createScenario(ScenarioV2CreateRequest request, long userId);
}
