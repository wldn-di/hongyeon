package com.ssafy.s14p11a707.scenario.v2.image;

import com.ssafy.s14p11a707.config.MinioProperties;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import java.io.ByteArrayInputStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * MinIO 기반 시나리오 v2 객체 스토리지 업로드 서비스
 * <p>
 * {@link MinioClient}를 사용해 PNG 바이트를 지정 버킷에 업로드하고,
 * {@link MinioProperties}의 엔드포인트/버킷 정보를 바탕으로 접근 URL을 구성해 반환한다.
 * </p>
 * <p><b>예외</b></p>
 * <ul>
 *   <li>업로드 실패 시 {@link IllegalStateException}을 발생시켜 상위(이미지 배치 처리)에서 전체 실패로 처리한다.</li>
 * </ul>
 *
 * @see ScenarioV2ObjectStorageService
 * @see MinioProperties
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MinioScenarioV2ObjectStorageService implements ScenarioV2ObjectStorageService {

    private final MinioClient minioClient;
    private final MinioProperties properties;

    /**
     * PNG 객체를 MinIO에 업로드하고 접근 URL 반환
     * <p>
     * {@link PutObjectArgs}로 {@code image/png} 콘텐츠 타입을 지정해 업로드한다.
     * </p>
     *
     * @param objectKey 업로드 경로/키
     * @param bytes PNG 이미지 바이트 배열
     * @return 업로드된 객체의 접근 URL
     * @throws IllegalStateException 업로드 실패 시
     */
    @Override
    public String uploadPng(String objectKey, byte[] bytes) {
        int size = bytes == null ? 0 : bytes.length;
        log.info("[v2] minio upload started. bucket={}, objectKey={}, bytes={}", properties.bucket(), objectKey, size);
        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(properties.bucket())
                            .object(objectKey)
                            .stream(new ByteArrayInputStream(bytes), bytes.length, -1)
                            .contentType("image/png")
                            .build()
            );
        } catch (Exception e) {
            log.error("[v2] minio upload failed. bucket={}, objectKey={}", properties.bucket(), objectKey, e);
            throw new IllegalStateException("failed to upload to minio. objectKey=" + objectKey, e);
        }

        String url = buildUrl(objectKey);
        log.info("[v2] minio upload finished. bucket={}, objectKey={}, url={}", properties.bucket(), objectKey, url);
        return url;
    }

    private String buildUrl(String objectKey) {
        String endpoint = properties.publicEndpoint();
        if (endpoint == null || endpoint.isBlank()) {
            endpoint = properties.endpoint();
        }
        if (endpoint.endsWith("/")) {
            endpoint = endpoint.substring(0, endpoint.length() - 1);
        }
        return endpoint + "/" + properties.bucket() + "/" + objectKey;
    }
}
