package com.ssafy.s14p11a707.scenario.v2.service;

import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.stream.ScenarioV2EmitterRepository;
import java.io.IOException;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * 시나리오 생성 v2 SSE 스트림 서비스
 * <p>
 * 클라이언트가 진행 상황을 수신할 수 있도록 {@link SseEmitter} 연결을 생성하고 관리한다.
 * 실제 이벤트 발행은 Redis Pub/Sub({@link com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher})를 통해 이루어지며,
 * 본 서비스는 사용자별 emitter를 보관({@link com.ssafy.s14p11a707.scenario.v2.stream.ScenarioV2EmitterRepository})한다.
 * </p>
 *
 * @see com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2RedisSubscriber
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScenarioV2StreamService {

    private static final long DEFAULT_TIMEOUT_MILLIS = Duration.ofMinutes(30).toMillis();

    private final ScenarioV2EmitterRepository emitterRepository;

    /**
     * 사용자별 SSE 연결을 생성하고 emitter 반환
     * <p>
     * 동일 사용자로 기존 연결이 존재하면 기존 emitter를 종료하고 새 emitter로 교체한다.
     * </p>
     *
     * @param userId 사용자 식별자(id)
     * @return SSE emitter
     */
    public SseEmitter connect(long userId) {
        log.info("[v2] SSE connect. userId={}", userId);
        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT_MILLIS);

        emitterRepository.find(userId).ifPresent(existing -> {
            existing.complete();
            emitterRepository.remove(userId);
        });

        emitterRepository.put(userId, emitter);

        emitter.onCompletion(() -> {
            log.info("[v2] SSE completed. userId={}", userId);
            emitterRepository.remove(userId);
        });
        emitter.onTimeout(() -> {
            log.warn("[v2] SSE timeout. userId={}", userId);
            emitter.complete();
            emitterRepository.remove(userId);
        });
        emitter.onError(e -> {
            log.warn("[v2] SSE error. userId={}", userId, e);
            emitter.complete();
            emitterRepository.remove(userId);
        });

        try {
            emitter.send(SseEmitter.event()
                    .name("connect")
                    .data(new ScenarioV2StreamEvent(
                            0L,
                            EventType.CONNECT,
                            0,
                            "connected",
                            null
                    )));
        } catch (IOException e) {
            log.info("[v2] SSE initial connect event send failed. userId={}", userId, e);
            emitter.complete();
            emitterRepository.remove(userId);
        }

        return emitter;
    }
}
