package com.ssafy.s14p11a707.security.authorization;

import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.scenario.repository.ScenarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ScenarioAccessPolicy {

    private final ScenarioRepository scenarioRepository;

    public void assertScenarioOwner(long userId, long scenarioId) {
        var scenario = scenarioRepository.findByIdWithCreator(scenarioId)
                .orElseThrow(() -> new BaseException(ErrorCode.SCENARIO_NOT_FOUND));
        if (scenario.getCreator().getId() != userId) {
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }
    }
}

