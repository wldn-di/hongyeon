package com.ssafy.s14p11a707.scenario.dto;

import java.util.List;

public record ScenarioListRequest(
        String keyword,
        List<String> genres,
        List<ScenarioDifficultyTier> difficulties,
        ScenarioSortBy sortBy,
        int page,
        int size
) {
}

