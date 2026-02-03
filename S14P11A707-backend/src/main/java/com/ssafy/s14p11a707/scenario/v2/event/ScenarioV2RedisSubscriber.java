package com.ssafy.s14p11a707.scenario.v2.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.stream.ScenarioV2EmitterRepository;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Redis Pub/Sub 이벤트를 SSE 스트림으로 중계하는 리스너
 * <p>
 * {@link org.springframework.data.redis.connection.MessageListener}로서 Redis 채널 메시지를 수신하고,
 * {@link ScenarioV2EventMessage} JSON을 역직렬화한 뒤
 * 사용자별 {@link SseEmitter}를 조회({@link ScenarioV2EmitterRepository})하여 클라이언트로 전달한다.
 * </p>
 * <p><b>스트림 정책</b></p>
 * <ul>
 *   <li>{@link EventType#COMPLETE} 또는 {@link EventType#ERROR} 수신 시 emitter를 {@link SseEmitter#complete()} 처리하고 저장소에서 제거한다.</li>
 *   <li>전송 중 {@link IOException}이 발생하면 연결이 끊긴 것으로 보고 emitter를 제거한다.</li>
 *   <li>재연결(Last-Event-ID) 기반의 이벤트 재전송은 지원하지 않는다.</li>
 * </ul>
 *
 * @see ScenarioV2EventPublisher
 * @see ScenarioV2EmitterRepository
 * @see ScenarioV2StreamEvent
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ScenarioV2RedisSubscriber implements MessageListener {

    private final ObjectMapper objectMapper;
    private final ScenarioV2EmitterRepository emitterRepository;

    /**
     * Redis 채널에서 수신한 메시지를 SSE로 전달
     * <p>
     * 메시지 본문을 UTF-8 문자열로 변환한 뒤 {@link ScenarioV2EventMessage}로 파싱하고,
     * {@link ScenarioV2StreamEvent}로 변환하여 {@link SseEmitter#send(Object)}로 전송한다.
     * 완료/오류 이벤트의 경우 스트림을 종료한다.
     * </p>
     *
     * @param message Redis에서 수신한 메시지
     * @param pattern 구독 패턴(채널 기반 구독에서는 사용하지 않을 수 있음)
     */
    @Override
    public void onMessage(Message message, byte[] pattern) {
        String payload = new String(message.getBody(), StandardCharsets.UTF_8);

        ScenarioV2EventMessage eventMessage;
        try {
            eventMessage = objectMapper.readValue(payload, ScenarioV2EventMessage.class);
        } catch (Exception e) {
            log.warn("[v2] failed to parse redis event payload={}", payload, e);
            return;
        }

        SseEmitter emitter = emitterRepository.find(eventMessage.userId()).orElse(null);
        if (emitter == null) {
            return;
        }

        ScenarioV2StreamEvent event = new ScenarioV2StreamEvent(
                eventMessage.scenarioId(),
                eventMessage.type(),
                eventMessage.progress(),
                eventMessage.message(),
                eventMessage.data()
        );

        String sseName = toSseName(eventMessage.type());

        try {
            emitter.send(SseEmitter.event().name(sseName).data(event));
        } catch (IOException e) {
            emitter.complete();
            emitterRepository.remove(eventMessage.userId());
            return;
        }

        if (eventMessage.type() == EventType.COMPLETE || eventMessage.type() == EventType.ERROR) {
            emitter.complete();
            emitterRepository.remove(eventMessage.userId());
        }
    }

    private String toSseName(EventType type) {
        if (type == EventType.COMPLETE) return "complete";
        if (type == EventType.ERROR) return "error";
        if (type == EventType.PING) return "ping";

        return "progress";
    }
}
