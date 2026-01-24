package com.ssafy.s14p11a707.scenario.dto;

import java.util.List;

public record SuspectListResponse(
        long scenarioId,
        List<Suspect> suspects
) {

    public record Suspect(
            long suspectId,
            String name,
            int age,
            String gender,
            String occupation,
            String oneLiner,
            String portraitUrl,
            int displayOrder
    ) {
    }
}

