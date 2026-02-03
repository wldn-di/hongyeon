package com.ssafy.s14p11a707.scenario.v2.service;

import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.stream.ScenarioV2EmitterRepository;
import java.io.IOException;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScenarioV2HeartbeatService {

    private final ScenarioV2EmitterRepository emitterRepository;

    @Scheduled(fixedDelayString = "${app.scenario.v2.stream.ping-interval-millis:15000}")
    public void ping() {
        Map<Long, SseEmitter> snapshot = emitterRepository.snapshot();
        if (snapshot.isEmpty()) {
            return;
        }

        for (Map.Entry<Long, SseEmitter> entry : snapshot.entrySet()) {
            long userId = entry.getKey();
            SseEmitter emitter = entry.getValue();

            try {
                emitter.send(SseEmitter.event()
                        .name("ping")
                        .data(new ScenarioV2StreamEvent(
                                0L,
                                EventType.PING,
                                0,
                                "ping",
                                null
                        )));
            } catch (IOException e) {
                log.info("[v2] SSE ping failed; closing emitter. userId={}", userId);
                emitter.complete();
                emitterRepository.remove(userId);
            }
        }
    }
}
