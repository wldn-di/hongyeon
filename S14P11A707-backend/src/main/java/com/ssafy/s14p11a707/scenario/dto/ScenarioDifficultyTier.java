package com.ssafy.s14p11a707.scenario.dto;

import java.util.Locale;

public enum ScenarioDifficultyTier {
    EASY,
    MEDIUM,
    HARD;

    public static ScenarioDifficultyTier from(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return switch (raw.trim().toLowerCase(Locale.ROOT)) {
            case "easy" -> EASY;
            case "medium" -> MEDIUM;
            case "hard" -> HARD;
            default -> null;
        };
    }
}

