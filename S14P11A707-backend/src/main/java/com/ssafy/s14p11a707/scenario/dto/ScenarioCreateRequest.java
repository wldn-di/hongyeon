package com.ssafy.s14p11a707.scenario.dto;

public record ScenarioCreateRequest(
        String title,
        String genre,
        int suspectCount,
        String userSynopsis
) {
}

