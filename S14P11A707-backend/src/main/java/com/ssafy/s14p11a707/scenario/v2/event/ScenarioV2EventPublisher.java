package com.ssafy.s14p11a707.scenario.v2.event;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Component;

/**
 * 시나리오 생성 v2 이벤트 발행 컴포넌트
 * <p>
 * {@link ScenarioV2EventMessage}를 JSON으로 직렬화하여 Redis Pub/Sub 채널({@link ChannelTopic})로 발행한다.
 * 노드 내부에서 진행 상황을 <b>best-effort</b>로 알리기 위한 용도로,
 * 직렬화/Redis 오류가 발생하더라도 생성 파이프라인 자체를 중단시키지 않고 로그로만 남긴다.
 * </p>
 * <p><b>설계 메모</b></p>
 * <ul>
 *   <li>발행 실패가 곧 도메인 실패를 의미하지 않도록 예외를 삼킨다.</li>
 *   <li>메시지 스키마는 {@link com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent}와 1:1 대응한다.</li>
 * </ul>
 *
 * @see ScenarioV2EventMessage
 * @see ScenarioV2RedisSubscriber
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ScenarioV2EventPublisher {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final ChannelTopic scenarioV2EventsTopic;

    /**
     * v2 이벤트 메시지를 Redis Pub/Sub 채널로 발행
     * <p>
     * 메시지를 JSON 문자열로 변환한 뒤 {@link StringRedisTemplate#convertAndSend(String, Object)}로 발행한다.
     * 직렬화 실패({@link JsonProcessingException}) 또는 Redis 전송 실패가 발생하면 경고 로그를 남기고 반환한다.
     * </p>
     *
     * @param message 발행할 이벤트 메시지
     */
    public void publish(ScenarioV2EventMessage message) {
        try {
            String json = objectMapper.writeValueAsString(message);
            stringRedisTemplate.convertAndSend(scenarioV2EventsTopic.getTopic(), json);
        } catch (JsonProcessingException e) {
            log.warn("[v2] failed to publish event. type={}", message.type(), e);
        } catch (Exception e) {
            log.warn("[v2] failed to publish event (redis). type={}", message.type(), e);
        }
    }
}
