package com.ssafy.s14p11a707.scenario.v2.job;

import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateRequest;

/**
 * 시나리오 생성 v2 비동기 작업 실행기
 * <p>
 * 생성 요청을 백그라운드로 실행하는 책임을 가지며,
 * 프레젠테이션/서비스 계층은 본 인터페이스에 의존해 생성 작업을 시작한다.
 * </p>
 *
 * @see com.ssafy.s14p11a707.scenario.v2.service.impl.ScenarioV2ServiceImpl
 * @see com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2GraphRunner
 */
public interface ScenarioV2JobRunner {

    /**
     * 시나리오 생성 작업을 비동기로 실행
     * <p>
     * 호출자는 작업 완료를 기다리지 않으며,
     * 진행 상황/완료 이벤트는 SSE 스트림({@link com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent})을 통해 전달된다.
     * </p>
     *
     * @param userId SSE 라우팅에 사용되는 사용자 식별자(id)
     * @param scenarioId 생성 대상 시나리오 식별자(id)
     * @param request 사용자 입력 DTO
     */
    void runAsync(long userId, long scenarioId, ScenarioV2CreateRequest request);
}
