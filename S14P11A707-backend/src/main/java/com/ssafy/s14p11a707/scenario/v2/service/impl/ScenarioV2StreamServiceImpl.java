package com.ssafy.s14p11a707.scenario.v2.service.impl;

import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.service.ScenarioV2StreamService;
import com.ssafy.s14p11a707.scenario.v2.stream.ScenarioV2EmitterRepository;
import java.io.IOException;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * 시나리오 생성 v2 SSE 스트림 서비스 구현체
 * <p>
 * 사용자별 {@link SseEmitter}를 생성하여 {@link ScenarioV2EmitterRepository}에 저장하고,
 * 연결 직후 {@code connect} 이벤트를 1회 전송한다.
 * </p>
 * <p><b>연결 정책</b></p>
 * <ul>
 *   <li>동일 사용자로 기존 emitter가 존재하면 기존 연결을 종료하고 새 연결로 교체한다.</li>
 *   <li>타임아웃/에러/완료 시 저장소에서 emitter를 제거한다.</li>
 *   <li>Last-Event-ID 기반 재연결 복구(이벤트 재전송)는 지원하지 않는다.</li>
 * </ul>
 *
 * @see ScenarioV2EmitterRepository
 * @see com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2RedisSubscriber
 */
@Service
@RequiredArgsConstructor
public class ScenarioV2StreamServiceImpl implements ScenarioV2StreamService {

    private static final long DEFAULT_TIMEOUT_MILLIS = Duration.ofMinutes(5).toMillis();

    private final ScenarioV2EmitterRepository emitterRepository;

    /**
     * SSE 연결을 생성하고 connect 이벤트 전송
     * <p>
     * {@link SseEmitter}를 생성한 뒤 저장소에 등록하고,
     * 클라이언트 초기 핸드셰이크용 {@link ScenarioV2StreamEvent}({@link EventType#CONNECT})를 전송한다.
     * </p>
     *
     * @param userId 사용자 식별자(id)
     * @return 생성된 SSE emitter
     */
    @Override
    public SseEmitter connect(long userId) {
        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT_MILLIS);

        emitterRepository.find(userId).ifPresent(existing -> {
            existing.complete();
            emitterRepository.remove(userId);
        });

        emitterRepository.put(userId, emitter);

        emitter.onCompletion(() -> emitterRepository.remove(userId));
        emitter.onTimeout(() -> emitterRepository.remove(userId));
        emitter.onError(e -> emitterRepository.remove(userId));

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
            emitterRepository.remove(userId);
        }

        return emitter;
    }
}
