package com.ssafy.s14p11a707.scenario.v2.node;

import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2StreamEvent.EventType;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventMessage;
import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher;
import com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State;
import com.ssafy.s14p11a707.scenario.v2.image.GoogleGenAiImagenImageGenerator;
import com.ssafy.s14p11a707.scenario.v2.image.ScenarioV2ImageJob;
import com.ssafy.s14p11a707.scenario.v2.image.ScenarioV2ObjectStorageService;
import com.ssafy.s14p11a707.scenario.v2.image.ScenarioV2ImageUrlUpdater;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

/**
 * 이미지 병렬 생성/업로드 및 URL 반영 노드
 * <p>
 * {@link ImagePromptNode}가 구성한 {@link ScenarioV2ImageJob} 목록을 병렬로 처리하여,
 * 이미지 생성({@link GoogleGenAiImagenImageGenerator}) → 업로드({@link ScenarioV2ObjectStorageService})를 수행한다.
 * 모든 작업이 완료되면 {@link ScenarioV2ImageUrlUpdater}로 URL을 엔티티에 반영한다.
 * </p>
 * <p><b>병렬 처리</b></p>
 * <ul>
 *   <li>{@code imageJobExecutor} 스레드 풀에서 각 작업을 {@link CompletableFuture}로 실행</li>
 *   <li>작업 완료마다 {@link EventType#IMAGE_PROGRESS} 이벤트를 발행하여 ({@code done/total}) 진행 상황을 전달</li>
 * </ul>
 * <p><b>재시도</b></p>
 * <ul>
 *   <li>개별 작업은 최대 2회 재시도(총 3회 시도)</li>
 *   <li>지수형이 아닌 고정 backoff(0ms → 300ms → 1000ms) + jitter</li>
 * </ul>
 *
 * @see ScenarioV2ImageJob
 * @see ScenarioV2ImageUrlUpdater
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ImageBatchNode implements ScenarioV2Node {

    private static final Pattern RETRY_IN_SECONDS_PATTERN =
            Pattern.compile("retry\\s+in\\s+([0-9]+(?:\\.[0-9]+)?)s", Pattern.CASE_INSENSITIVE);

    private final GoogleGenAiImagenImageGenerator imageGenerator;
    private final ScenarioV2ObjectStorageService objectStorageService;
    private final ScenarioV2ImageUrlUpdater imageUrlUpdater;
    private final ScenarioV2EventPublisher eventPublisher;

    @Qualifier("imageJobExecutor")
    private final Executor imageJobExecutor;

    /**
     * 이미지 작업을 병렬 실행하고 URL을 도메인에 반영
     * <p>
     * 상태에 이미지 작업이 존재하지 않으면 아무 작업도 수행하지 않고 상태를 그대로 반환한다.
     * 개별 이미지 생성/업로드 실패는 로그/진행 이벤트로 기록하고 스킵하며, 가능한 결과만 반영한다.
     * </p>
     *
     * @param state 현재 상태
     * @return 이미지 URL이 반영된 상태
     */
    @Override
    public ScenarioV2State execute(ScenarioV2State state) {
        var jobs = state.getImageJobs();
        if (jobs == null || jobs.isEmpty()) {
            log.info("[v2] ImageBatchNode skipped. scenarioId={}, reason=no jobs", state.getScenarioId());
            return state;
        }

        int total = jobs.size();
        log.info("[v2] ImageBatchNode execute. scenarioId={}, jobs={}", state.getScenarioId(), total);

        AtomicInteger done = new AtomicInteger(0);
        AtomicInteger success = new AtomicInteger(0);
        AtomicInteger failed = new AtomicInteger(0);
        Map<String, String> urlByKey = new ConcurrentHashMap<>();

        CompletableFuture<?>[] futures = jobs.stream()
                .map(job -> CompletableFuture.runAsync(() -> {
                    log.info(
                            "[v2] Image job started. scenarioId={}, target={}, targetId={}, objectKey={}",
                            state.getScenarioId(),
                            job.target(),
                            job.targetId(),
                            job.objectKey()
                    );

                    try {
                        String url = runJobWithRetry(job);
                        urlByKey.put(key(job.target(), job.targetId()), url);
                        success.incrementAndGet();
                        log.info(
                                "[v2] Image job finished. scenarioId={}, target={}, targetId={}, url={}",
                                state.getScenarioId(),
                                job.target(),
                                job.targetId(),
                                url
                        );
                    } catch (Exception e) {
                        failed.incrementAndGet();
                        log.error(
                                "[v2] Image job skipped after retries. scenarioId={}, target={}, targetId={}, objectKey={}, error={}",
                                state.getScenarioId(),
                                job.target(),
                                job.targetId(),
                                job.objectKey(),
                                e.getMessage(),
                                e
                        );
                    } finally {
                        int nowDone = done.incrementAndGet();
                        int progress = 65 + (int) Math.floor(30.0 * nowDone / total);
                        eventPublisher.publish(new ScenarioV2EventMessage(
                                state.getUserId(),
                                state.getScenarioId(),
                                EventType.IMAGE_PROGRESS,
                                progress,
                                "증거 사진을 확보 중… (%d/%d)".formatted(nowDone, total),
                                Map.of(
                                        "done", nowDone,
                                        "total", total,
                                        "success", success.get(),
                                        "failed", failed.get()
                                )
                        ));
                    }
                }, imageJobExecutor))
                .toArray(CompletableFuture[]::new);

        CompletableFuture.allOf(futures).join();

        log.info(
                "[v2] ImageBatchNode uploads finished. scenarioId={}, uploadedKeys={}, success={}, failed={}, total={}",
                state.getScenarioId(),
                urlByKey.size(),
                success.get(),
                failed.get(),
                total
        );
        if (urlByKey.isEmpty()) {
            log.warn(
                    "[v2] ImageBatchNode completed with no uploaded images. scenarioId={}, totalJobs={}",
                    state.getScenarioId(),
                    total
            );
        }
        imageUrlUpdater.applyImageUrls(state.getScenarioId(), urlByKey);
        log.info("[v2] ImageBatchNode url apply finished. scenarioId={}", state.getScenarioId());
        return state;
    }

    private String runJobWithRetry(ScenarioV2ImageJob job) {
        int maxAttempts = 3; // 2 retries max (total 3 attempts)
        long[] backoffMillis = {0L, 300L, 1000L};

        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                byte[] png = imageGenerator.generatePng(job.prompt());
                return objectStorageService.uploadPng(job.objectKey(), png);
            } catch (Exception e) {
                if (isNonRetryableImagePayloadError(e)) {
                    log.warn(
                            "[v2] Image job failed (non-retryable payload). target={}, targetId={}, objectKey={}, error={}",
                            job.target(),
                            job.targetId(),
                            job.objectKey(),
                            e.getMessage()
                    );
                    throw e;
                }

                if (attempt == maxAttempts - 1) {
                    log.error(
                            "[v2] Image job failed (final). target={}, targetId={}, objectKey={}",
                            job.target(),
                            job.targetId(),
                            job.objectKey(),
                            e
                    );
                    throw e;
                }

                Long retryAfterMs = resolveRetryAfterMillis(e);
                long baseSleepMs = retryAfterMs != null
                        ? retryAfterMs
                        : backoffMillis[Math.min(attempt + 1, backoffMillis.length - 1)];
                long sleepMs = baseSleepMs + ThreadLocalRandom.current().nextLong(0, 250);
                log.warn(
                        "[v2] Image job failed (retry). attempt={}/{}, sleepMs={}, target={}, targetId={}, objectKey={}, rateLimited={}, error={}",
                        attempt + 1,
                        maxAttempts,
                        sleepMs,
                        job.target(),
                        job.targetId(),
                        job.objectKey(),
                        retryAfterMs != null,
                        e.getMessage()
                );
                sleep(sleepMs);
            }
        }

        throw new IllegalStateException("unreachable");
    }

    private boolean isNonRetryableImagePayloadError(Throwable throwable) {
        for (Throwable t = throwable; t != null; t = t.getCause()) {
            String message = t.getMessage();
            if (message == null || message.isBlank()) {
                continue;
            }
            String normalized = message.toLowerCase();
            if (normalized.contains("image bytes missing") || normalized.contains("no images returned")) {
                return true;
            }
        }
        return false;
    }

    private Long resolveRetryAfterMillis(Throwable throwable) {
        for (Throwable t = throwable; t != null; t = t.getCause()) {
            String message = t.getMessage();
            if (message == null || message.isBlank()) {
                continue;
            }
            Matcher matcher = RETRY_IN_SECONDS_PATTERN.matcher(message);
            if (!matcher.find()) {
                continue;
            }
            try {
                double seconds = Double.parseDouble(matcher.group(1));
                if (seconds <= 0) {
                    return 1_000L;
                }
                return (long) Math.ceil(seconds * 1000.0);
            } catch (NumberFormatException ignored) {
                return 20_000L;
            }
        }
        return null;
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    private static String key(ScenarioV2ImageJob.Target target, long targetId) {
        return target.name() + ":" + targetId;
    }
}
