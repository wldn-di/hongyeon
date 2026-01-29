package com.ssafy.s14p11a707.scenario.repository;

import com.ssafy.s14p11a707.scenario.entity.Scenario;
import java.math.BigDecimal;

public interface ScenarioListProjection {
    long getId();
    String getTitle();
    String getSynopsis();
    String getGenre();
    String getThumbnailUrl();
    int getPlayCount();
    BigDecimal getAvgRating();
    BigDecimal getAvgDifficulty();
    Scenario.GenerationStatus getGenerationStatus();
    String getGenerationError();
}
