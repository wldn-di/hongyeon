package com.ssafy.s14p11a707.scenario.v2.image;

/**
 * 시나리오 v2 PNG 이미지 생성기 추상화
 * <p>
 * 텍스트 프롬프트를 입력받아 PNG 이미지 바이트를 생성하는 역할을 담당한다.
 * 실제 서비스에서는 외부 이미지 모델/API 연동 구현체로 교체할 수 있으며,
 * 개발 단계에서는 {@link PlaceholderPngImageGenerator}처럼 더미 구현체를 사용할 수 있다.
 * </p>
 *
 * @see PlaceholderPngImageGenerator
 * @see ScenarioV2ObjectStorageService
 */
public interface ScenarioV2ImageGenerator {

    /**
     * 프롬프트 기반 PNG 바이트 생성
     * <p>
     * 주어진 프롬프트를 기반으로 PNG 포맷의 이미지 바이트 배열을 생성한다.
     * 생성 실패 시 호출자가 처리할 수 있도록 예외를 던질 수 있다.
     * </p>
     *
     * @param prompt 이미지 생성에 사용할 텍스트 프롬프트
     * @return PNG 이미지 바이트 배열
     * @throws RuntimeException 이미지 생성 과정에서 문제가 발생했을 때
     */
    byte[] generatePng(String prompt);
}
