package com.ssafy.s14p11a707.scenario.v2.image;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 개발/테스트용 더미 PNG 이미지 생성기
 * <p>
 * 외부 이미지 모델 연동이 준비되기 전까지, 프롬프트 해시값을 기반으로 단색(512x512) PNG를 생성한다.
 * 생성된 이미지는 품질/의미를 보장하지 않으며, 파이프라인의 <b>병렬 처리 및 업로드/URL 반영</b> 흐름을 검증하기 위한 용도다.
 * </p>
 * <p><b>설계 메모</b></p>
 * <ul>
 *   <li>프롬프트가 동일하면 동일한 색상을 생성하도록 해 디버깅/재현을 돕는다.</li>
 * </ul>
 *
 * @see ScenarioV2ImageGenerator
 */
@Component
@ConditionalOnProperty(name = "app.scenario.v2.image.generator", havingValue = "placeholder")
public class PlaceholderPngImageGenerator implements ScenarioV2ImageGenerator {

    /**
     * 프롬프트 해시 기반 단색 PNG 생성
     * <p>
     * 프롬프트 문자열의 {@link String#hashCode()}로 색상을 결정한 후,
     * 512x512 크기의 단색 이미지를 PNG로 인코딩해 반환한다.
     * </p>
     *
     * @param prompt 이미지 생성 프롬프트
     * @return PNG 이미지 바이트 배열
     * @throws IllegalStateException PNG 인코딩에 실패했을 때
     */
    @Override
    public byte[] generatePng(String prompt) {
        int hash = prompt == null ? 0 : prompt.hashCode();
        Color color = new Color((hash >> 16) & 0xFF, (hash >> 8) & 0xFF, hash & 0xFF);

        BufferedImage image = new BufferedImage(512, 512, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = image.createGraphics();
        graphics.setColor(color);
        graphics.fillRect(0, 0, image.getWidth(), image.getHeight());
        graphics.dispose();

        try {
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            ImageIO.write(image, "png", output);
            return output.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("failed to generate placeholder png", e);
        }
    }
}
