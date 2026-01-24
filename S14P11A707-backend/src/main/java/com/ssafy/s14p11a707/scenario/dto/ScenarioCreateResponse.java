package com.ssafy.s14p11a707.scenario.dto;

public record ScenarioCreateResponse(
        long scenarioId,
        String status,
        Integer estimatedTime
) {
}

