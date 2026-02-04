package com.ssafy.s14p11a707.scenario.v2.image;

import com.google.common.util.concurrent.RateLimiter;
import com.google.genai.Client;
import com.google.genai.types.PersonGeneration;
import com.google.genai.types.SafetyFilterLevel;
import com.google.genai.types.GenerateImagesConfig;
import com.google.genai.types.GenerateImagesResponse;
import com.google.genai.types.Image;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.awt.image.RasterFormatException;
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
    private static final int BASE_SIZE = 512;
    private static final String DEFAULT_NEGATIVE_PROMPT = "color, vibrant, saturated, neon, cartoon, illustration, CGI, 3D render, "
            + "text, letters, numbers, words, typography, handwriting, calligraphy, "
            + "korean text, hangul, japanese text, chinese text, "
            + "caption, subtitle, watermark, logo, UI, "
            + "sign, label, sticker, poster, billboard, banner, "
            + "document, newspaper, magazine, book cover, brochure, flyer, form, screenshot, monitor, "
            + "collage, montage, mosaic, grid, multi-panel, panel, comic panel, storyboard, film strip, contact sheet, "
            + "split-screen, diptych, triptych, picture-in-picture, inset, tiled, "
            + "border, frame, mat, white margin, paper border, photo frame, polaroid frame, "
            + "polaroid, instant film, photo print, pinned photo, corkboard, pinboard, thumbtack, push pin, tape";

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
                .addWatermark(false);

        // Always include our baseline negative prompt for "no text / no polaroid / no frame" invariants.
        // If the app config provides extra negatives, append them (but don't let them remove the baseline).
        String negative = DEFAULT_NEGATIVE_PROMPT;
        if (StringUtils.hasText(negativePrompt)) {
            negative = negativePrompt.trim() + ", " + DEFAULT_NEGATIVE_PROMPT;
        }
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

            byte[] normalized = normalizeFullBleedPng(bytes);
            if (normalized.length > MAX_BYTES) {
                log.warn(
                        "[v2] google imagen size limit exceeded even after normalization. model={}, bytes={}",
                        model,
                        normalized.length
                );
            }

            return normalized;
        } catch (Exception e) {
            log.error("[v2] google imagen generate failed. model={}, error={}", model, e.getMessage(), e);
            throw new IllegalStateException("failed to generate image via google imagen", e);
        }
    }

    private byte[] normalizeFullBleedPng(byte[] bytes) {
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

        // Two-stage trim:
        // 1) Trim any uniform "background canvas" around an embedded photo/print.
        // 2) Trim obvious near-white borders (polaroid/print margins).
        BufferedImage trimmed = trimWhiteBorder(trimUniformBorder(source));
        int[] sizes = {BASE_SIZE, 448, 384, 320, 256, 224, 192, 160};
        byte[] best = bytes;
        for (int outer : sizes) {
            try {
                byte[] normalized = renderFullBleedSquare(trimmed, outer);
                best = normalized;
                if (normalized.length <= MAX_BYTES) {
                    return normalized;
                }
            } catch (Exception e) {
                log.warn("[v2] failed to normalize image. size={}", outer, e);
            }
        }
        return best;
    }

    /**
     * Imagen sometimes returns an image of a photo placed on a plain background (e.g., corkboard / dark canvas).
     * We trim away a mostly-uniform outer border to better fit the frontend "frame slot" use-case.
     */
    private BufferedImage trimUniformBorder(BufferedImage source) {
        int w = source.getWidth();
        int h = source.getHeight();
        if (w < 32 || h < 32) {
            return source;
        }

        int c1 = source.getRGB(0, 0);
        int c2 = source.getRGB(w - 1, 0);
        int c3 = source.getRGB(0, h - 1);
        int c4 = source.getRGB(w - 1, h - 1);

        int bgR = (((c1 >> 16) & 0xff) + ((c2 >> 16) & 0xff) + ((c3 >> 16) & 0xff) + ((c4 >> 16) & 0xff)) / 4;
        int bgG = (((c1 >> 8) & 0xff) + ((c2 >> 8) & 0xff) + ((c3 >> 8) & 0xff) + ((c4 >> 8) & 0xff)) / 4;
        int bgB = ((c1 & 0xff) + (c2 & 0xff) + (c3 & 0xff) + (c4 & 0xff)) / 4;

        // Only attempt when corners are reasonably similar (indicates an outer "canvas").
        int maxCornerDelta = Math.max(
                Math.max(colorDelta(c1, c2), colorDelta(c3, c4)),
                Math.max(colorDelta(c1, c3), colorDelta(c2, c4))
        );
        if (maxCornerDelta > 35) {
            return source;
        }

        int step = Math.max(1, Math.min(w, h) / 220);
        int tol = 24; // per-channel max delta to consider "background-like"
        double maxNonBgRatio = 0.03;

        int top = 0;
        while (top < h && isMostlyBgRow(source, top, step, bgR, bgG, bgB, tol, maxNonBgRatio)) {
            top++;
        }
        int bottom = h - 1;
        while (bottom >= top && isMostlyBgRow(source, bottom, step, bgR, bgG, bgB, tol, maxNonBgRatio)) {
            bottom--;
        }
        int left = 0;
        while (left < w && isMostlyBgCol(source, left, step, bgR, bgG, bgB, tol, maxNonBgRatio)) {
            left++;
        }
        int right = w - 1;
        while (right >= left && isMostlyBgCol(source, right, step, bgR, bgG, bgB, tol, maxNonBgRatio)) {
            right--;
        }

        int trimTop = top;
        int trimBottom = (h - 1) - bottom;
        int trimLeft = left;
        int trimRight = (w - 1) - right;

        int minTrim = 10;
        if (trimTop < minTrim && trimBottom < minTrim && trimLeft < minTrim && trimRight < minTrim) {
            return source;
        }

        int newW = right - left + 1;
        int newH = bottom - top + 1;
        if (newW <= 0 || newH <= 0) {
            return source;
        }

        double minRatio = 0.60;
        if (newW < w * minRatio || newH < h * minRatio) {
            return source;
        }

        try {
            return source.getSubimage(left, top, newW, newH);
        } catch (RasterFormatException ignored) {
            return source;
        }
    }

    private int colorDelta(int rgb1, int rgb2) {
        int r1 = (rgb1 >> 16) & 0xff;
        int g1 = (rgb1 >> 8) & 0xff;
        int b1 = rgb1 & 0xff;
        int r2 = (rgb2 >> 16) & 0xff;
        int g2 = (rgb2 >> 8) & 0xff;
        int b2 = rgb2 & 0xff;
        return Math.max(Math.max(Math.abs(r1 - r2), Math.abs(g1 - g2)), Math.abs(b1 - b2));
    }

    private boolean isMostlyBgRow(BufferedImage img, int y, int step, int bgR, int bgG, int bgB, int tol, double maxNonBgRatio) {
        int w = img.getWidth();
        int samples = 0;
        int nonBg = 0;
        for (int x = 0; x < w; x += step) {
            samples++;
            int rgb = img.getRGB(x, y);
            if (!isBg(rgb, bgR, bgG, bgB, tol)) {
                nonBg++;
                if (nonBg > Math.ceil(samples * maxNonBgRatio)) {
                    return false;
                }
            }
        }
        return true;
    }

    private boolean isMostlyBgCol(BufferedImage img, int x, int step, int bgR, int bgG, int bgB, int tol, double maxNonBgRatio) {
        int h = img.getHeight();
        int samples = 0;
        int nonBg = 0;
        for (int y = 0; y < h; y += step) {
            samples++;
            int rgb = img.getRGB(x, y);
            if (!isBg(rgb, bgR, bgG, bgB, tol)) {
                nonBg++;
                if (nonBg > Math.ceil(samples * maxNonBgRatio)) {
                    return false;
                }
            }
        }
        return true;
    }

    private boolean isBg(int rgb, int bgR, int bgG, int bgB, int tol) {
        int r = (rgb >> 16) & 0xff;
        int g = (rgb >> 8) & 0xff;
        int b = rgb & 0xff;
        return Math.abs(r - bgR) <= tol && Math.abs(g - bgG) <= tol && Math.abs(b - bgB) <= tol;
    }

    /**
     * Imagen occasionally returns a photo-within-a-photo (e.g., polaroid/print with large white margins).
     * We aggressively trim obvious near-white borders to match frontend "frame slot" usage.
     */
    private BufferedImage trimWhiteBorder(BufferedImage source) {
        int w = source.getWidth();
        int h = source.getHeight();
        if (w < 32 || h < 32) {
            return source;
        }

        int step = Math.max(1, Math.min(w, h) / 200); // ~200 samples per axis
        int whiteThreshold = 245; // 0..255 luminance. Higher = stricter "white".
        double maxNonWhiteRatio = 0.03; // 3% of samples can be non-white and still count as border.

        int top = 0;
        while (top < h && isMostlyWhiteRow(source, top, step, whiteThreshold, maxNonWhiteRatio)) {
            top++;
        }
        int bottom = h - 1;
        while (bottom >= top && isMostlyWhiteRow(source, bottom, step, whiteThreshold, maxNonWhiteRatio)) {
            bottom--;
        }
        int left = 0;
        while (left < w && isMostlyWhiteCol(source, left, step, whiteThreshold, maxNonWhiteRatio)) {
            left++;
        }
        int right = w - 1;
        while (right >= left && isMostlyWhiteCol(source, right, step, whiteThreshold, maxNonWhiteRatio)) {
            right--;
        }

        int trimTop = top;
        int trimBottom = (h - 1) - bottom;
        int trimLeft = left;
        int trimRight = (w - 1) - right;

        int minTrim = 12;
        if (trimTop < minTrim && trimBottom < minTrim && trimLeft < minTrim && trimRight < minTrim) {
            return source;
        }

        int newW = right - left + 1;
        int newH = bottom - top + 1;
        if (newW <= 0 || newH <= 0) {
            return source;
        }

        // Guardrail: don't over-crop normal scenes with bright edges.
        double minRatio = 0.55;
        if (newW < w * minRatio || newH < h * minRatio) {
            return source;
        }

        try {
            return source.getSubimage(left, top, newW, newH);
        } catch (RasterFormatException ignored) {
            return source;
        }
    }

    private boolean isMostlyWhiteRow(BufferedImage img, int y, int step, int whiteThreshold, double maxNonWhiteRatio) {
        int w = img.getWidth();
        int samples = 0;
        int nonWhite = 0;
        for (int x = 0; x < w; x += step) {
            samples++;
            int lum = luminance(img.getRGB(x, y));
            if (lum < whiteThreshold) {
                nonWhite++;
                if (nonWhite > Math.ceil(samples * maxNonWhiteRatio)) {
                    return false;
                }
            }
        }
        return true;
    }

    private boolean isMostlyWhiteCol(BufferedImage img, int x, int step, int whiteThreshold, double maxNonWhiteRatio) {
        int h = img.getHeight();
        int samples = 0;
        int nonWhite = 0;
        for (int y = 0; y < h; y += step) {
            samples++;
            int lum = luminance(img.getRGB(x, y));
            if (lum < whiteThreshold) {
                nonWhite++;
                if (nonWhite > Math.ceil(samples * maxNonWhiteRatio)) {
                    return false;
                }
            }
        }
        return true;
    }

    private int luminance(int rgb) {
        int r = (rgb >> 16) & 0xff;
        int g = (rgb >> 8) & 0xff;
        int b = rgb & 0xff;
        return (r * 299 + g * 587 + b * 114) / 1000;
    }

    private byte[] renderFullBleedSquare(BufferedImage source, int size) {
        int crop = Math.min(source.getWidth(), source.getHeight());
        int cropX = (source.getWidth() - crop) / 2;
        int cropY = (source.getHeight() - crop) / 2;

        BufferedImage out = new BufferedImage(size, size, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = out.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            g.drawImage(
                    source,
                    0,
                    0,
                    size,
                    size,
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
