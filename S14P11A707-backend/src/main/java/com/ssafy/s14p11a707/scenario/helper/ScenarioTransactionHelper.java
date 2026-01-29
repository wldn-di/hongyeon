package com.ssafy.s14p11a707.scenario.helper;

import com.ssafy.s14p11a707.scenario.repository.ScenarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class ScenarioTransactionHelper {

    private final ScenarioRepository scenarioRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(Long scenarioId, String errorMessage) {
        scenarioRepository.findById(scenarioId).ifPresent(scenario -> {
            scenario.failGeneration(errorMessage);
        });
    }
}