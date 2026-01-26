package com.ssafy.s14p11a707.user.service.v1.impl;

import com.ssafy.s14p11a707.mock.MockFixtures;
import com.ssafy.s14p11a707.mock.MockSessionStore;
import com.ssafy.s14p11a707.ranking.dto.GlobalRankingResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioListResponse;
import com.ssafy.s14p11a707.user.dto.ActiveSessionListResponse;
import com.ssafy.s14p11a707.user.dto.BookshelfStatsResponse;
import com.ssafy.s14p11a707.user.dto.BookshelfStatusResponse;
import com.ssafy.s14p11a707.user.service.v1.UserV1Service;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserV1ServiceMockImpl implements UserV1Service {

    private final MockSessionStore sessionStore;

    @Override
    public BookshelfStatsResponse getMyBookshelfStats() {
        return new BookshelfStatsResponse(
                MockFixtures.meUserId(),
                27,
                14,
                14f / 27f,
                4
        );
    }

    @Override
    public BookshelfStatusResponse getMyBookshelfSessions() {
        long userId = MockFixtures.meUserId();

        List<BookshelfStatusResponse.Item> items = sessionStore.listActiveSessions(userId).stream()
                .map(s -> {
                    MockFixtures.ScenarioFixture scenario = MockFixtures.scenario(s.scenarioId());
                    return new BookshelfStatusResponse.Item(
                            s.sessionId(),
                            s.status(),
                            s.playTime(),
                            Instant.now(),
                            s.scenarioId(),
                            scenario.title(),
                            scenario.synopsis(),
                            scenario.genre(),
                            "MEDIUM",
                            scenario.thumbnailUrl(),
                            null,
                            null
                    );
                })
                .toList();

        return new BookshelfStatusResponse(
                items,
                1,
                items.size(),
                0
        );
    }

    @Override
    public GlobalRankingResponse getMyRankings() {
        return MockFixtures.globalRankingResponse();
    }

    @Override
    public ScenarioListResponse getMyScenarios() {
        return MockFixtures.scenarioListResponse(MockFixtures.scenarios());
    }

    @Override
    public ScenarioListResponse getMyBookshelfFailed() {
        return MockFixtures.scenarioListResponse(MockFixtures.scenarios());
    }

    @Override
    public ScenarioListResponse getMyBookshelfCompleted() {
        return MockFixtures.scenarioListResponse(MockFixtures.scenarios());
    }

    @Override
    public ActiveSessionListResponse getMyActiveSessions() {
        long userId = MockFixtures.meUserId();
        List<ActiveSessionListResponse.Item> items = sessionStore.listActiveSessions(userId).stream()
                .map(s -> {
                    MockFixtures.ScenarioFixture scenario = MockFixtures.scenario(s.scenarioId());
                    return new ActiveSessionListResponse.Item(
                            s.sessionId(),
                            s.scenarioId(),
                            scenario.title(),
                            scenario.thumbnailUrl(),
                            s.status(),
                            s.currentFloor(),
                            s.health(),
                            s.submitAttempts(),
                            s.lastSavedAt(),
                            s.expiresAt()
                    );
                })
                .toList();

        return new ActiveSessionListResponse(
                items,
                1,
                items.size(),
                0
        );
    }
}
