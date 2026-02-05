package com.ssafy.s14p11a707.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.vertex")
public record VertexAiPoolProperties(
        boolean enabled,
        String projectId,
        String location,
        String credentialsUri,
        String accessToken,
        int semaphorePerAccount,
        List<AccountEntry> accounts
) {
    public record AccountEntry(
            String name,
            String projectId,
            String location,
            String credentialsUri,
            String accessToken
    ) {}
}
