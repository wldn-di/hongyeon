package com.ssafy.s14p11a707.scenario.dto;

import java.math.BigDecimal;
import java.util.List;

public record ScenarioListResponse(
        List<Item> content,
        int totalPages,
        long totalElements,
        int currentPage
) {

    public record Item(
            long id,
            String title,
            String synopsis,
            String genre,
            String thumbnailUrl,
            int playCount,
            BigDecimal avgRating,
            BigDecimal avgDifficulty,
            String status,
            Integer progress,
            String generationMessage
    ) {
    }
}

