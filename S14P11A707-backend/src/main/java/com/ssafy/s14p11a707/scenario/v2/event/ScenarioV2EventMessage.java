package com.ssafy.s14p11a707.scenario.v2.event;

import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import java.util.Map;

/**
 * Redis Pub/Sub 전송용 시나리오 v2 이벤트 메시지
 * <p>
 * v2 생성 파이프라인에서 발생하는 진행 상황을 Redis 채널로 발행하기 위한 내부 메시지다.
 * {@link ScenarioV2EventPublisher}가 JSON 문자열로 직렬화하여 Pub/Sub로 발행하며,
 * {@link ScenarioV2RedisSubscriber}가 이를 수신하여 {@link com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent}로 변환한 뒤
 * {@link org.springframework.web.servlet.mvc.method.annotation.SseEmitter}로 전달한다.
 * </p>
 * <p><b>설계 메모</b></p>
 * <ul>
 *   <li>{@code userId}는 SSE 연결을 식별하기 위한 라우팅 키다.</li>
 *   <li>{@code scenarioId}는 클라이언트에서 결과 화면 전환/조회 등에 사용할 수 있는 도메인 키다.</li>
 * </ul>
 *
 * @param userId SSE 연결 사용자 식별자(id)
 * @param scenarioId 시나리오 식별자(id)
 * @param type 이벤트 타입({@link EventType})
 * @param progress 진행률(0~100)
 * @param message 사용자에게 노출할 메시지
 * @param data 부가 데이터(선택)
 * @see ScenarioV2EventPublisher
 * @see ScenarioV2RedisSubscriber
 */
public record ScenarioV2EventMessage(
        long userId,
        long scenarioId,
        EventType type,
        int progress,
        String message,
        Map<String, Object> data
) {
}
