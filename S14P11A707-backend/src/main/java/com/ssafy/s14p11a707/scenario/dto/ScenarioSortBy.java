package com.ssafy.s14p11a707.scenario.dto;

import java.util.Locale;

public enum ScenarioSortBy {
    LATEST,
    POPULAR,
    RATING;

    public static ScenarioSortBy from(String raw) {
        if (raw == null || raw.isBlank()) {
            return LATEST;
        }

        return switch (raw.trim().toLowerCase(Locale.ROOT)) {
            case "latest", "views", "new" -> LATEST;
            case "popular" -> POPULAR;
            case "rating" -> RATING;
            default -> LATEST;
        };
    }
}

