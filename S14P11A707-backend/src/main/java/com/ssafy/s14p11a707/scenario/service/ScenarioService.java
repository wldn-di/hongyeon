package com.ssafy.s14p11a707.scenario.service;

import com.ssafy.s14p11a707.scenario.dto.RoomListResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioCreateRequest;
import com.ssafy.s14p11a707.scenario.dto.ScenarioCreateResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioDeleteResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioDetailResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioListRequest;
import com.ssafy.s14p11a707.scenario.dto.ScenarioListResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioRankingResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioStatusResponse;
import com.ssafy.s14p11a707.scenario.dto.SuspectListResponse;
import com.ssafy.s14p11a707.scenario.dto.VictimResponse;

public interface ScenarioService {
    ScenarioListResponse listScenarios(ScenarioListRequest request);

    ScenarioListResponse topScenariosByPlayCount();

    ScenarioListResponse topScenariosByRating();

    ScenarioDetailResponse getScenario(long scenarioId);

    ScenarioStatusResponse getScenarioStatus(long scenarioId);

    ScenarioCreateResponse createScenario(ScenarioCreateRequest request, long userId);

    ScenarioDeleteResponse deleteScenario(long scenarioId);

    ScenarioRankingResponse getScenarioRankings(long scenarioId, Long userId);

    RoomListResponse getRooms(long scenarioId);

    VictimResponse getVictim(long scenarioId);

    SuspectListResponse getSuspects(long scenarioId);
}
