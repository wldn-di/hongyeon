package com.ssafy.s14p11a707.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MinioBucketInitializer {

    private final MinioClient minioClient;
    private final MinioProperties properties;

    @PostConstruct
    void ensureBucketExists() {
        String bucket = properties.bucket();
        if (bucket == null || bucket.isBlank()) {
            log.warn("[minio] bucket is blank. skip bucket check.");
            return;
        }

        try {
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (exists) {
                log.info("[minio] bucket exists. bucket={}", bucket);
                return;
            }

            log.warn("[minio] bucket not found. creating. bucket={}", bucket);
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            log.info("[minio] bucket created. bucket={}", bucket);
        } catch (Exception e) {
            log.warn("[minio] failed to check/create bucket. bucket={}", bucket, e);
        }
    }
}

