package com.ssafy.s14p11a707.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.vertex")
public record VertexAiProperties(
        boolean enabled,
        String projectId,
        String location,
        String credentialsUri,
        String accessToken
) {
}
