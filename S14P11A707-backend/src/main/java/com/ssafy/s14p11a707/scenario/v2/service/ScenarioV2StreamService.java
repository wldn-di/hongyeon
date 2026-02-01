package com.ssafy.s14p11a707.scenario.v2.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * 시나리오 생성 v2 SSE 스트림 서비스
 * <p>
 * 클라이언트가 진행 상황을 수신할 수 있도록 {@link SseEmitter} 연결을 생성하고 관리한다.
 * 실제 이벤트 발행은 Redis Pub/Sub({@link com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher})를 통해 이루어지며,
 * 본 서비스는 사용자별 emitter를 보관({@link com.ssafy.s14p11a707.scenario.v2.stream.ScenarioV2EmitterRepository})한다.
 * </p>
 *
 * @see com.ssafy.s14p11a707.scenario.v2.service.impl.ScenarioV2StreamServiceImpl
 * @see com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2RedisSubscriber
 */
public interface ScenarioV2StreamService {

    /**
     * 사용자별 SSE 연결을 생성하고 emitter 반환
     * <p>
     * 동일 사용자로 기존 연결이 존재하면 기존 emitter를 종료하고 새 emitter로 교체한다.
     * </p>
     *
     * @param userId 사용자 식별자(id)
     * @return SSE emitter
     */
    SseEmitter connect(long userId);
}
