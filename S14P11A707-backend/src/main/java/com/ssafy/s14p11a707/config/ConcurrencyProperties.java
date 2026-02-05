package com.ssafy.s14p11a707.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.concurrency")
public record ConcurrencyProperties(
        int maxScenarioGeneration,
        int maxChatConcurrent,
        int chatTimeoutSeconds
) {
    public int effectiveMaxScenarioGeneration() {
        return maxScenarioGeneration > 0 ? maxScenarioGeneration : 10;
    }

    public int effectiveMaxChatConcurrent() {
        return maxChatConcurrent > 0 ? maxChatConcurrent : 50;
    }

    public int effectiveChatTimeoutSeconds() {
        return chatTimeoutSeconds > 0 ? chatTimeoutSeconds : 30;
    }
}
