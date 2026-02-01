package com.ssafy.s14p11a707.scenario.v2.dto;

/**
 * 시나리오 생성 v2 응답 DTO
 * <p>
 * {@link com.ssafy.s14p11a707.scenario.v2.service.ScenarioV2Service#createScenario(ScenarioV2CreateRequest, long)} 호출 결과로,
 * 생성 작업의 시작 여부와 대상 {@code scenarioId}를 클라이언트에 전달하는 용도다.
 * </p>
 * <p><b>설계 메모</b></p>
 * <ul>
 *   <li>v2는 요청(POST)과 스트림(SSE)을 분리한다. 본 DTO는 <b>작업 시작(영수증)</b> 역할을 한다.</li>
 *   <li>실제 생성 진행 상황과 최종 결과는 {@link ScenarioV2StreamEvent}로 전송한다.</li>
 * </ul>
 *
 * @param scenarioId 생성 대상 시나리오 식별자(id)
 * @param status 생성 상태 문자열({@code GENERATING}, {@code COMPLETED}, {@code FAILED} 등)
 * @param estimatedTimeSeconds 예상 소요 시간(초). 현재 구현에서는 {@code null}을 반환할 수 있다.
 * @param errorMessage 요청 단계에서 즉시 실패했을 때의 오류 메시지(선택)
 * @see ScenarioV2CreateRequest
 * @see ScenarioV2StreamEvent
 */
public record ScenarioV2CreateResponse(
        long scenarioId,
        String status,
        Integer estimatedTimeSeconds,
        String errorMessage
) {
}
