package com.ssafy.s14p11a707.game.dto;

import java.util.List;

public record GameSaveRequest(
        int currentFloor,
        List<Integer> visitedFloors,
        int health,
        long playTime
) {
}

