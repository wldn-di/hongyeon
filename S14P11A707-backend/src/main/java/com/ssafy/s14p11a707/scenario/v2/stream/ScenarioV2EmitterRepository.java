package com.ssafy.s14p11a707.scenario.v2.stream;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * 시나리오 생성 v2 SSE emitter 저장소
 * <p>
 * 사용자 식별자(userId)를 키로 {@link SseEmitter}를 메모리에 보관한다.
 * Redis Pub/Sub 이벤트 수신 시 {@link com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2RedisSubscriber}가
 * 본 저장소를 조회해 사용자에게 이벤트를 전달한다.
 * </p>
 * <p><b>설계 메모</b></p>
 * <ul>
 *   <li>단일 인스턴스(스케일아웃 없음) 전제를 둔 단순 저장소다.</li>
 *   <li>동시 접근을 위해 {@link ConcurrentHashMap} 기반으로 구현한다.</li>
 * </ul>
 *
 * @see com.ssafy.s14p11a707.scenario.v2.service.ScenarioV2StreamService
 * @see com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2RedisSubscriber
 */
@Component
public class ScenarioV2EmitterRepository {

    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    /**
     * 사용자별 emitter 조회
     * <p>
     * 현재 연결된 {@link SseEmitter}가 없으면 {@link Optional#empty()}를 반환한다.
     * </p>
     *
     * @param userId 사용자 식별자(id)
     * @return emitter Optional
     */
    public Optional<SseEmitter> find(long userId) {
        return Optional.ofNullable(emitters.get(userId));
    }


    public Map<Long, SseEmitter> snapshot() {
        return Map.copyOf(emitters);
    }

    /**
     * 사용자별 emitter 저장/갱신
     * <p>
     * 동일 {@code userId}로 기존 emitter가 존재하면 새 emitter로 덮어쓴다.
     * </p>
     *
     * @param userId 사용자 식별자(id)
     * @param emitter 저장할 SSE emitter
     */
    public void put(long userId, SseEmitter emitter) {
        emitters.put(userId, emitter);
    }

    /**
     * 사용자별 emitter 제거
     * <p>
     * 연결 종료/타임아웃/에러 등의 경우 호출된다.
     * </p>
     *
     * @param userId 사용자 식별자(id)
     */
    public void remove(long userId) {
        emitters.remove(userId);
    }
}
