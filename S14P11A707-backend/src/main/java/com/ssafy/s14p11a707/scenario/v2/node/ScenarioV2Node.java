package com.ssafy.s14p11a707.scenario.v2.node;

import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State;

/**
 * 시나리오 생성 v2 그래프 노드 인터페이스
 * <p>
 * 각 노드는 {@link ScenarioV2State}를 입력으로 받아 처리한 뒤 다음 상태를 반환한다.
 * 노드 구현체는 {@link com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher}를 통해
 * 진행 상황을 이벤트로 발행할 수 있다.
 * </p>
 * <p><b>설계 메모</b></p>
 * <ul>
 *   <li>노드는 가급적 상태를 보관하지 않는 <i>stateless</i> 컴포넌트로 구현한다.</li>
 *   <li>노드 간 데이터 전달은 {@link ScenarioV2State}의 필드로만 수행한다.</li>
 * </ul>
 *
 * @see com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2GraphRunner
 */
public interface ScenarioV2Node {

    /**
     * 노드 단위 처리를 수행하고 다음 상태 반환
     * <p>
     * 구현체는 입력 상태를 갱신하거나 새 값을 설정한 뒤 동일/변경된 {@link ScenarioV2State}를 반환한다.
     * </p>
     *
     * @param state 현재 실행 상태
     * @return 처리 후 상태
     * @throws RuntimeException 노드 처리 중 예외가 발생했을 때
     */
    ScenarioV2State execute(ScenarioV2State state);
}
