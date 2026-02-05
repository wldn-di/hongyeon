package com.ssafy.s14p11a707.scenario.v2.node;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class ScenarioV2JsonUtilsTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void autoCloseJson_closesUnterminatedString_andBraces() throws Exception {
        String truncated = "{\"a\":\"b";

        String repaired = ScenarioV2JsonUtils.autoCloseJson(truncated);

        assertThat(repaired).isEqualTo("{\"a\":\"b\"}");
        assertThat(objectMapper.readTree(repaired).path("a").asText()).isEqualTo("b");
    }

    @Test
    void autoCloseJson_closesUnterminatedString_whenEndsWithBackslash() throws Exception {
        String truncated = "{\"a\":\"b" + "\\";

        String repaired = ScenarioV2JsonUtils.autoCloseJson(truncated);

        assertThat(repaired).isEqualTo("{\"a\":\"b\\\\\"}");
        assertThat(objectMapper.readTree(repaired).path("a").asText()).isEqualTo("b\\");
    }
}

