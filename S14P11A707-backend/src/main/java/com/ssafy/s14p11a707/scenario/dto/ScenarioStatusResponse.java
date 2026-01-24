package com.ssafy.s14p11a707.scenario.dto;

public record ScenarioStatusResponse(
        long scenarioId,
        String status,
        int progress,
        String message
) {
}

