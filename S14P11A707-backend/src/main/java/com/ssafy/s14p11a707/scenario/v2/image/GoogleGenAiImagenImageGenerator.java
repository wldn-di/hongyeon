package com.ssafy.s14p11a707.scenario.v2.image;

import com.google.common.util.concurrent.RateLimiter;
import com.google.genai.Client;
import com.google.genai.types.PersonGeneration;
import com.google.genai.types.SafetyFilterLevel;
import com.google.genai.types.GenerateImagesConfig;
import com.google.genai.types.GenerateImagesResponse;
import com.google.genai.types.Image;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import jakarta.annotation.PostConstruct;
import javax.imageio.ImageIO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

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

    private static final int MAX_BYTES = 300 * 1024;
    private static final int OUTER_SIZE = 512;
    private static final int BORDER_LEFT_RIGHT = 36;
    private static final int BORDER_TOP = 24;
    private static final int BORDER_BOTTOM = 48;

    private final Client googleGenAiClient;

    @Value("${app.scenario.v2.image.model:imagen-4.0-fast-generate-001}")
    private String model;

    @Value("${app.scenario.v2.image.max-requests-per-minute:10}")
    private double maxRequestsPerMinute;

    @Value("${app.scenario.v2.image.aspect-ratio:1:1}")
    private String aspectRatio;

    @Value("${app.scenario.v2.image.output-mime-type:image/png}")
    private String outputMimeType;

    @Value("${app.scenario.v2.image.negative-prompt:}")
    private String negativePrompt;

    @Value("${app.scenario.v2.image.guidance-scale:0}")
    private float guidanceScale;

    @Value("${app.scenario.v2.image.enhance-prompt:}")
    private String enhancePrompt;

    @Value("${app.scenario.v2.image.seed:0}")
    private int seed;

    @Value("${app.scenario.v2.image.person-generation:}")
    private String personGeneration;

    @Value("${app.scenario.v2.image.safety-filter-level:}")
    private String safetyFilterLevel;

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

        if (StringUtils.hasText(outputMimeType) && !"image/png".equalsIgnoreCase(outputMimeType.trim())) {
            log.warn(
                    "[v2] google imagen outputMimeType is not png, but this generator always returns PNG. configured={}",
                    outputMimeType
            );
        }
        var configBuilder = GenerateImagesConfig.builder()
                .numberOfImages(1)
                .aspectRatio(StringUtils.hasText(aspectRatio) ? aspectRatio : "1:1")
                .outputMimeType("image/png")
                .addWatermark(false)
                .imageSize("%dx%d".formatted(OUTER_SIZE, OUTER_SIZE));

        String negative = StringUtils.hasText(negativePrompt)
                ? negativePrompt
                : "color, vibrant, saturated, neon, cartoon, illustration, CGI, 3D render, text, caption, subtitle, watermark, logo, UI, poster";
        configBuilder.negativePrompt(negative);

        if (guidanceScale > 0) {
            configBuilder.guidanceScale(guidanceScale);
        }
        if (StringUtils.hasText(enhancePrompt)) {
            configBuilder.enhancePrompt(Boolean.parseBoolean(enhancePrompt));
        }
        if (seed > 0) {
            configBuilder.seed(seed);
        }

        if (StringUtils.hasText(personGeneration)) {
            PersonGeneration parsed = parsePersonGeneration(personGeneration);
            if (parsed != null && parsed.knownEnum() != PersonGeneration.Known.PERSON_GENERATION_UNSPECIFIED) {
                configBuilder.personGeneration(parsed);
            }
        }

        if (StringUtils.hasText(safetyFilterLevel)) {
            SafetyFilterLevel parsed = parseSafetyFilterLevel(safetyFilterLevel);
            if (parsed != null && parsed.knownEnum() != SafetyFilterLevel.Known.SAFETY_FILTER_LEVEL_UNSPECIFIED) {
                configBuilder.safetyFilterLevel(parsed);
            }
        }

        GenerateImagesConfig config = configBuilder.build();

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

            byte[] polaroid = normalizePolaroidPng(bytes);
            if (polaroid.length > MAX_BYTES) {
                log.warn(
                        "[v2] google imagen size limit exceeded even after normalization. model={}, bytes={}",
                        model,
                        polaroid.length
                );
            }

            return polaroid;
        } catch (Exception e) {
            log.error("[v2] google imagen generate failed. model={}, error={}", model, e.getMessage(), e);
            throw new IllegalStateException("failed to generate image via google imagen", e);
        }
    }

    private byte[] normalizePolaroidPng(byte[] bytes) {
        if (bytes == null) {
            return new byte[0];
        }

        BufferedImage source;
        try {
            source = ImageIO.read(new ByteArrayInputStream(bytes));
        } catch (Exception e) {
            log.warn("[v2] failed to decode image bytes for normalization. bytes={}", bytes.length, e);
            return bytes;
        }
        if (source == null) {
            log.warn("[v2] ImageIO returned null while decoding image bytes. bytes={}", bytes.length);
            return bytes;
        }

        int[] sizes = {OUTER_SIZE, 448, 384, 320, 256, 224, 192, 160};
        byte[] best = bytes;
        for (int outer : sizes) {
            try {
                byte[] normalized = renderPolaroid(source, outer);
                best = normalized;
                if (normalized.length <= MAX_BYTES) {
                    return normalized;
                }
            } catch (Exception e) {
                log.warn("[v2] failed to normalize image. outerSize={}", outer, e);
            }
        }
        return best;
    }

    private byte[] renderPolaroid(BufferedImage source, int outerSize) {
        int borderLr = Math.max(8, (int) Math.round(outerSize * (BORDER_LEFT_RIGHT / (double) OUTER_SIZE)));
        int borderTop = Math.max(6, (int) Math.round(outerSize * (BORDER_TOP / (double) OUTER_SIZE)));
        int borderBottom = Math.max(12, (int) Math.round(outerSize * (BORDER_BOTTOM / (double) OUTER_SIZE)));
        int innerWidth = outerSize - (borderLr * 2);
        int innerHeight = outerSize - borderTop - borderBottom;
        int innerSize = Math.max(1, Math.min(innerWidth, innerHeight));
        int innerX = borderLr + Math.max(0, (innerWidth - innerSize) / 2);
        int innerY = borderTop + Math.max(0, (innerHeight - innerSize) / 2);

        int crop = Math.min(source.getWidth(), source.getHeight());
        int cropX = (source.getWidth() - crop) / 2;
        int cropY = (source.getHeight() - crop) / 2;

        BufferedImage out = new BufferedImage(outerSize, outerSize, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = out.createGraphics();
        try {
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, outerSize, outerSize);
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            g.drawImage(
                    source,
                    innerX,
                    innerY,
                    innerX + innerSize,
                    innerY + innerSize,
                    cropX,
                    cropY,
                    cropX + crop,
                    cropY + crop,
                    null
            );
        } finally {
            g.dispose();
        }

        ByteArrayOutputStream outBytes = new ByteArrayOutputStream();
        try {
            boolean ok = ImageIO.write(out, "png", outBytes);
            if (!ok) {
                throw new IllegalStateException("no png writer available");
            }
        } catch (Exception e) {
            throw new IllegalStateException("failed to encode normalized png", e);
        }
        return outBytes.toByteArray();
    }

    private PersonGeneration parsePersonGeneration(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return new PersonGeneration(PersonGeneration.Known.valueOf(value.trim().toUpperCase()));
        } catch (Exception ignored) {
            try {
                return new PersonGeneration(value.trim());
            } catch (Exception e) {
                return null;
            }
        }
    }

    private SafetyFilterLevel parseSafetyFilterLevel(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return new SafetyFilterLevel(SafetyFilterLevel.Known.valueOf(value.trim().toUpperCase()));
        } catch (Exception ignored) {
            try {
                return new SafetyFilterLevel(value.trim());
            } catch (Exception e) {
                return null;
            }
        }
    }
}
