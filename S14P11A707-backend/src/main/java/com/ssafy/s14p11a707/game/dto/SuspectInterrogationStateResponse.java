package com.ssafy.s14p11a707.game.dto;

public record SuspectInterrogationStateResponse(
        long sessionId,
        long suspectId,
        int currentInterrogationLevel,
        boolean isSecretRevealed
) {
}

