package com.ssafy.s14p11a707.scenario.v2.image;

import com.google.common.util.concurrent.RateLimiter;
import com.google.genai.Client;
import com.google.genai.types.GenerateImagesConfig;
import com.google.genai.types.GenerateImagesResponse;
import com.google.genai.types.Image;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Google GenAI(Imagen) 기반 시나리오 v2 PNG 이미지 생성기
 * <p>
 * {@link Client}의 {@code generateImages} 기능을 이용해 프롬프트 기반 이미지를 생성하고,
 * 결과를 PNG 바이트 배열로 반환한다.
 * </p>
 * <p><b>프로퍼티</b></p>
 * <ul>
 *   <li>{@code app.scenario.v2.image.model}: 사용할 이미지 모델명(기본값 {@code imagen-4.0-fast-generate-001})</li>
 * </ul>
 * <p><b>예외</b></p>
 * <ul>
 *   <li>API 호출 실패 또는 응답에 이미지 바이트가 없으면 {@link IllegalStateException}을 발생</li>
 * </ul>
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class GoogleGenAiImagenImageGenerator {

    private final Client googleGenAiClient;

    @Value("${app.scenario.v2.image.model:imagen-4.0-fast-generate-001}")
    private String model;

    @Value("${app.scenario.v2.image.max-requests-per-minute:10}")
    private double maxRequestsPerMinute;

    private RateLimiter rateLimiter;

    @PostConstruct
    void initRateLimiter() {
        if (maxRequestsPerMinute <= 0) {
            log.info("[v2] google imagen rate limiter disabled. maxRequestsPerMinute={}", maxRequestsPerMinute);
            this.rateLimiter = null;
            return;
        }

        double permitsPerSecond = maxRequestsPerMinute / 60.0;
        this.rateLimiter = RateLimiter.create(permitsPerSecond);
        log.info(
                "[v2] google imagen rate limiter configured. maxRequestsPerMinute={}, permitsPerSecond={}",
                maxRequestsPerMinute,
                permitsPerSecond
        );
    }

    /**
     * Google Imagen을 통해 PNG 바이트 생성
     * <p>
     * {@link GenerateImagesConfig}를 구성해 1장의 정사각(1:1) PNG 이미지를 생성한다.
     * 응답에 이미지 바이트가 없는 경우(예: GCS URI만 제공되는 형태)에는 실패로 간주한다.
     * </p>
     *
     * @param prompt 이미지 생성에 사용할 텍스트 프롬프트
     * @return PNG 이미지 바이트 배열
     * @throws IllegalStateException 이미지 생성 실패 또는 유효한 이미지 바이트가 없을 때
     */
    public byte[] generatePng(String prompt) {
        String safePrompt = prompt == null ? "" : prompt;
        double waitedSeconds = 0.0;
        if (rateLimiter != null) {
            waitedSeconds = rateLimiter.acquire();
        }
        log.info(
                "[v2] google imagen generate started. model={}, promptLen={}, waitedMs={}",
                model,
                safePrompt.length(),
                Math.round(waitedSeconds * 1000.0)
        );

        GenerateImagesConfig config = GenerateImagesConfig.builder()
                .numberOfImages(1)
                .aspectRatio("1:1")
                .outputMimeType("image/png")
                .build();

        try {
            GenerateImagesResponse response = googleGenAiClient.models.generateImages(model, safePrompt, config);
            if (response == null || response.images() == null || response.images().isEmpty()) {
                throw new IllegalStateException("no images returned from google imagen");
            }

            Image image = response.images().get(0);
            byte[] bytes = image.imageBytes().orElse(null);
            if (bytes == null || bytes.length == 0) {
                String gcsUri = image.gcsUri().orElse(null);
                throw new IllegalStateException("image bytes missing (gcsUri=" + gcsUri + ")");
            }

            log.info("[v2] google imagen generate finished. model={}, bytes={}", model, bytes.length);
            return bytes;
        } catch (Exception e) {
            log.error("[v2] google imagen generate failed. model={}, error={}", model, e.getMessage(), e);
            throw new IllegalStateException("failed to generate image via google imagen", e);
        }
    }
}
