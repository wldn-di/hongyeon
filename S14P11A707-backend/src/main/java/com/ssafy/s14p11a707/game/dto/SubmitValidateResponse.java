package com.ssafy.s14p11a707.game.dto;

import java.util.List;

public record SubmitValidateResponse(
        long sessionId,
        boolean submittable,
        List<String> missing,
        List<RequiredRedConnection> requiredRedConnections
) {

    public record RequiredRedConnection(
            String fromType,
            String toType,
            String description
    ) {
    }
}

