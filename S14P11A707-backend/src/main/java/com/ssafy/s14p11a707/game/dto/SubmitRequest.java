package com.ssafy.s14p11a707.game.dto;

public record SubmitRequest(
        long culpritId,
        long weaponClueId,
        int locationFloor,
        String motive,
        String causeOfDeath
) {
}

