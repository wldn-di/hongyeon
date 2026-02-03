package com.ssafy.s14p11a707.scenario.v2.node;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateRequest;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State;
import com.ssafy.s14p11a707.scenario.v2.image.GoogleGenAiImagenImageGenerator;
import com.ssafy.s14p11a707.scenario.v2.image.ScenarioV2ImageJob;
import com.ssafy.s14p11a707.scenario.v2.image.ScenarioV2ImageUrlUpdater;
import com.ssafy.s14p11a707.scenario.v2.image.ScenarioV2ObjectStorageService;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class ImageBatchNodeTest {

    private ExecutorService executor;

    @AfterEach
    void tearDown() {
        if (executor != null) {
            executor.shutdownNow();
        }
    }

    @Test
    void execute_retriesTwice_thenSucceeds_andPublishesProgress() {
        executor = Executors.newSingleThreadExecutor();

        GoogleGenAiImagenImageGenerator imageGenerator = mock(GoogleGenAiImagenImageGenerator.class);
        ScenarioV2ObjectStorageService objectStorageService = mock(ScenarioV2ObjectStorageService.class);
        ScenarioV2ImageUrlUpdater imageUrlUpdater = mock(ScenarioV2ImageUrlUpdater.class);
        ScenarioV2EventPublisher eventPublisher = mock(ScenarioV2EventPublisher.class);

        AtomicInteger attempts = new AtomicInteger(0);
        when(imageGenerator.generatePng(anyString())).thenAnswer(invocation -> {
            int attempt = attempts.incrementAndGet();
            if (attempt < 3) {
                throw new IllegalStateException("retry in 0.001s");
            }
            return new byte[]{1, 2, 3};
        });

        when(objectStorageService.uploadPng(anyString(), any())).thenAnswer(invocation -> "https://public/" + invocation.getArgument(0));

        ImageBatchNode node = new ImageBatchNode(imageGenerator, objectStorageService, imageUrlUpdater, eventPublisher, executor);

        ScenarioV2State state = new ScenarioV2State(1L, 2L, new ScenarioV2CreateRequest("t", "g", 1, "syn", null));
        ScenarioV2ImageJob job = new ScenarioV2ImageJob(
                ScenarioV2ImageJob.Target.CLUE_IMAGE,
                10L,
                "scenarios/2/clues/10.png",
                "prompt"
        );
        state.setImageJobs(List.of(job));

        node.execute(state);

        verify(imageGenerator, times(3)).generatePng(anyString());
        verify(objectStorageService, times(1)).uploadPng(eq("scenarios/2/clues/10.png"), any());

        ArgumentCaptor<Map<String, String>> urlByKeyCaptor = ArgumentCaptor.forClass(Map.class);
        verify(imageUrlUpdater, times(1)).applyImageUrls(eq(2L), urlByKeyCaptor.capture());
        assertThat(urlByKeyCaptor.getValue()).containsEntry("CLUE_IMAGE:10", "https://public/scenarios/2/clues/10.png");

        ArgumentCaptor<ScenarioV2EventMessage> eventCaptor = ArgumentCaptor.forClass(ScenarioV2EventMessage.class);
        verify(eventPublisher, times(1)).publish(eventCaptor.capture());
        assertThat(eventCaptor.getValue().type()).isEqualTo(EventType.IMAGE_PROGRESS);
        assertThat(eventCaptor.getValue().progress()).isEqualTo(95);
        assertThat(eventCaptor.getValue().data()).containsEntry("done", 1).containsEntry("total", 1);
    }

    @Test
    void execute_runsImageJobs_withConcurrencyUpperBound() throws Exception {
        executor = Executors.newFixedThreadPool(2);

        GoogleGenAiImagenImageGenerator imageGenerator = mock(GoogleGenAiImagenImageGenerator.class);
        ScenarioV2ObjectStorageService objectStorageService = mock(ScenarioV2ObjectStorageService.class);
        ScenarioV2ImageUrlUpdater imageUrlUpdater = mock(ScenarioV2ImageUrlUpdater.class);
        ScenarioV2EventPublisher eventPublisher = mock(ScenarioV2EventPublisher.class);

        AtomicInteger inFlight = new AtomicInteger(0);
        AtomicInteger maxInFlight = new AtomicInteger(0);
        AtomicInteger callCount = new AtomicInteger(0);
        CyclicBarrier barrier = new CyclicBarrier(2);

        when(imageGenerator.generatePng(anyString())).thenAnswer(invocation -> {
            int current = inFlight.incrementAndGet();
            maxInFlight.updateAndGet(prev -> Math.max(prev, current));

            try {
                int call = callCount.incrementAndGet();
                if (call <= 2) {
                    barrier.await(2, TimeUnit.SECONDS);
                }
                Thread.sleep(30);
                return new byte[]{9, 9, 9};
            } finally {
                inFlight.decrementAndGet();
            }
        });

        when(objectStorageService.uploadPng(anyString(), any())).thenAnswer(invocation -> "https://public/" + invocation.getArgument(0));

        ImageBatchNode node = new ImageBatchNode(imageGenerator, objectStorageService, imageUrlUpdater, eventPublisher, executor);

        ScenarioV2State state = new ScenarioV2State(1L, 3L, new ScenarioV2CreateRequest("t", "g", 1, "syn", null));
        state.setImageJobs(List.of(
                new ScenarioV2ImageJob(ScenarioV2ImageJob.Target.CLUE_IMAGE, 1L, "scenarios/3/clues/1.png", "p1"),
                new ScenarioV2ImageJob(ScenarioV2ImageJob.Target.CLUE_IMAGE, 2L, "scenarios/3/clues/2.png", "p2"),
                new ScenarioV2ImageJob(ScenarioV2ImageJob.Target.CLUE_IMAGE, 3L, "scenarios/3/clues/3.png", "p3"),
                new ScenarioV2ImageJob(ScenarioV2ImageJob.Target.CLUE_IMAGE, 4L, "scenarios/3/clues/4.png", "p4")
        ));

        node.execute(state);

        assertThat(maxInFlight.get()).isEqualTo(2);

        verify(eventPublisher, times(4)).publish(any(ScenarioV2EventMessage.class));

        ArgumentCaptor<Map<String, String>> urlByKeyCaptor = ArgumentCaptor.forClass(Map.class);
        verify(imageUrlUpdater, times(1)).applyImageUrls(eq(3L), urlByKeyCaptor.capture());
        assertThat(urlByKeyCaptor.getValue()).hasSize(4);
    }
}

