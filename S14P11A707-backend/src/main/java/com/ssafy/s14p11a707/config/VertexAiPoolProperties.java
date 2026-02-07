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
        String model,
        String thinkingLevel,
        boolean includeThoughts,
        int semaphorePerAccount,
        int rpm,
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
