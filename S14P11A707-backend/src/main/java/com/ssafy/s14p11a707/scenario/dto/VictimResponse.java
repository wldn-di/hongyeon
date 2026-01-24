package com.ssafy.s14p11a707.scenario.dto;

public record VictimResponse(
        long scenarioId,
        Victim victim
) {

    public record Victim(
            long victimId,
            String name,
            int age,
            String gender,
            String occupation,
            String discoveryLocation,
            String estimatedDeathTime,
            String causeOfDeath,
            String background,
            String portraitUrl
    ) {
    }
}

