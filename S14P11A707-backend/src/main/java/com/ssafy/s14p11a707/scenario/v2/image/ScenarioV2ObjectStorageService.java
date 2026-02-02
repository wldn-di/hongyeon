package com.ssafy.s14p11a707.scenario.v2.image;

/**
 * 시나리오 v2 객체 스토리지 업로드 서비스
 * <p>
 * 생성된 PNG 바이트를 스토리지에 저장하고, 접근 가능한 URL을 반환하는 역할을 담당한다.
 * 구현체는 MinIO, S3 등 스토리지 종류에 따라 달라질 수 있다.
 * </p>
 *
 * @see MinioScenarioV2ObjectStorageService
 */
public interface ScenarioV2ObjectStorageService {

    /**
     * PNG 바이트를 업로드하고 접근 URL 반환
     * <p>
     * {@code objectKey} 경로로 PNG 객체를 업로드하고, 저장된 객체를 조회할 수 있는 URL을 반환한다.
     * </p>
     *
     * @param objectKey 업로드 경로/키
     * @param bytes PNG 이미지 바이트 배열
     * @return 업로드된 객체의 접근 URL
     * @throws RuntimeException 업로드 과정에서 문제가 발생했을 때
     */
    String uploadPng(String objectKey, byte[] bytes);
}
