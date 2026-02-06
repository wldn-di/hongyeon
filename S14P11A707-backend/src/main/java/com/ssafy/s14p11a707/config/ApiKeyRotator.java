package com.ssafy.s14p11a707.config;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.extern.slf4j.Slf4j;

/**
 * Google AI Studio 무료 API 키를 Round-Robin으로 로테이션한다.
 * <p>
 * 여러 팀원 계정의 키를 등록하면 실질 RPM/RPD를 키 수에 비례하여 확장할 수 있다.
 */
@Slf4j
public class ApiKeyRotator {

    private final List<String> apiKeys;
    private final AtomicInteger index = new AtomicInteger(0);

    public ApiKeyRotator(List<String> apiKeys) {
        if (apiKeys == null || apiKeys.isEmpty()) {
            throw new IllegalArgumentException("At least one API key is required");
        }
        this.apiKeys = List.copyOf(apiKeys);
        log.info("[ai] ApiKeyRotator initialized with {} key(s)", apiKeys.size());
    }

    /**
     * 다음 API 키를 Round-Robin으로 반환한다.
     */
    public String nextKey() {
        int i = Math.floorMod(index.getAndIncrement(), apiKeys.size());
        return apiKeys.get(i);
    }

    public int keyCount() {
        return apiKeys.size();
    }
}
