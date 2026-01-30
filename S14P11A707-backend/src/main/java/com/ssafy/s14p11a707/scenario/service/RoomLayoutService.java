package com.ssafy.s14p11a707.scenario.service;

import com.fasterxml.jackson.databind.JsonNode;

public interface RoomLayoutService {

    JsonNode generateRandomLayout(String roomType);
}

