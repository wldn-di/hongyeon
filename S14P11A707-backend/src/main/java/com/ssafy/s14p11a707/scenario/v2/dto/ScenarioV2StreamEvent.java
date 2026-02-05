package com.ssafy.s14p11a707.scenario.v2.dto;

import java.util.Map;

/**
 * 시나리오 생성 v2 SSE 이벤트 DTO
 * <p>
 * 백그라운드 생성 작업의 단계/진행률/메시지를 스트리밍으로 전달하기 위한 데이터 구조다.
 * Redis Pub/Sub로 전달되는 {@link com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage}를
 * {@link com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2RedisSubscriber}가 수신하여 본 DTO로 변환한 뒤,
 * {@link org.springframework.web.servlet.mvc.method.annotation.SseEmitter}를 통해 클라이언트로 전송한다.
 * </p>
 * <p><b>데이터 규약</b></p>
 * <ul>
 *   <li>{@code progress}: 0~100 범위의 진행률(표시 목적)</li>
 *   <li>{@code message}: 진행 바와 함께 노출할 수 있는 사용자 친화 메시지</li>
 *   <li>{@code data}: 노드별 부가 데이터(예: 이미지 생성 {@code done/total}, 재시도 {@code retry/maxRetry})</li>
 * </ul>
 *
 * @param scenarioId 이벤트가 속한 시나리오 식별자(id)
 * @param type 이벤트 타입({@link EventType})
 * @param progress 진행률(0~100)
 * @param message 진행 단계 메시지
 * @param data 단계별 부가 데이터(선택)
 * @see com.ssafy.s14p11a707.scenario.v2.service.ScenarioV2StreamService
 * @see com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2GraphRunner
 */
public record ScenarioV2StreamEvent(
        long scenarioId,
        EventType type,
        int progress,
        String message,
        Map<String, Object> data
) {

    /**
     * 시나리오 생성 v2 이벤트 타입
     * <p>
     * 각 타입은 그래프 노드 실행 단계 또는 스트림 제어 신호를 나타낸다.
     * {@link com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2RedisSubscriber}는 타입에 따라 SSE 이벤트 이름을 결정한다.
     * </p>
     * <p><b>노드 매핑</b></p>
     * <ul>
     *   <li>{@link #TIMELINE}: {@link com.ssafy.s14p11a707.scenario.v2.node.TimelineNode} 단계</li>
     *   <li>{@link #CHARACTERS_CLUES_TRUTH}: {@link com.ssafy.s14p11a707.scenario.v2.node.CharactersCluesTruthNode} 단계</li>
     *   <li>{@link #ROOMS}: {@link com.ssafy.s14p11a707.scenario.v2.node.RoomsNode} 단계</li>
     *   <li>{@link #VALIDATE}: {@link com.ssafy.s14p11a707.scenario.v2.node.ValidateNode} 단계</li>
     *   <li>{@link #CRITIQUE}: {@link com.ssafy.s14p11a707.scenario.v2.node.CritiqueNode} 단계</li>
     *   <li>{@link #REFINE}: {@link com.ssafy.s14p11a707.scenario.v2.node.RefineNode} 단계</li>
     *   <li>{@link #PERSIST}: {@link com.ssafy.s14p11a707.scenario.v2.node.PersistNode} 단계</li>
     *   <li>{@link #IMAGE_PROMPT}: {@link com.ssafy.s14p11a707.scenario.v2.node.ImagePromptNode} 단계</li>
     *   <li>{@link #IMAGE_PROGRESS}: {@link com.ssafy.s14p11a707.scenario.v2.node.ImageBatchNode} 진행 이벤트</li>
     *   <li>{@link #FINALIZE}: {@link com.ssafy.s14p11a707.scenario.v2.node.FinalizeNode} 단계</li>
     * </ul>
     * <p><b>스트림 제어</b></p>
     * <ul>
     *   <li>{@link #CONNECT}: 연결 직후 전송되는 이벤트</li>
     *   <li>{@link #PING}: 연결 유지를 위한 이벤트(선택)</li>
     *   <li>{@link #COMPLETE}/{@link #ERROR}: 스트림 종료를 유도하는 종결 이벤트</li>
     * </ul>
     */
    public enum EventType {
        CONNECT,
        PING,
        WAITING,
        TIMELINE,
        CHARACTERS_CLUES_TRUTH,
        ROOMS,
        VALIDATE,
        CRITIQUE,
        REFINE,
        PERSIST,
        IMAGE_PROMPT,
        IMAGE_PROGRESS,
        FINALIZE,
        COMPLETE,
        ERROR
    }
}
