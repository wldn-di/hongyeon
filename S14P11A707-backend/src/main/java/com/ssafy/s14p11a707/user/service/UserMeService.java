package com.ssafy.s14p11a707.user.service;

import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.game.entity.GameSession.RankGrade;
import com.ssafy.s14p11a707.game.entity.GameSession.Status;
import com.ssafy.s14p11a707.game.repository.GameSessionRepository;
import com.ssafy.s14p11a707.scenario.dto.ScenarioListResponse;
import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.scenario.repository.ScenarioRepository;
import com.ssafy.s14p11a707.user.dto.BookshelfSessionResponse;
import com.ssafy.s14p11a707.user.dto.BookshelfStatsResponse;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.repository.UserRepository;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Primary
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserMeService {

    private final UserRepository userRepository;
    private final GameSessionRepository gameSessionRepository;
    private final ScenarioRepository scenarioRepository;

    public BookshelfStatsResponse getMyBookshelfStats(OidcUser oidcUser) {
        User user = getUser(oidcUser);

        int sRankCount = gameSessionRepository.countByUserAndRankGrade(user, RankGrade.S);
        float clearRate = user.getTotalAttempts() > 0
                ? (float) user.getTotalClears() / user.getTotalAttempts()
                : 0f;

        return new BookshelfStatsResponse(
                user.getId(),
                user.getTotalAttempts(),
                user.getTotalClears(),
                clearRate,
                sRankCount
        );
    }

    public BookshelfSessionResponse getMyBookshelfSessions(OidcUser oidcUser, Pageable pageable) {
        User user = getUser(oidcUser);

        Page<GameSession> sessionPage = gameSessionRepository.findByUserAndStatusIn(
                user, List.of(Status.COMPLETED, Status.PLAYING, Status.FAILED), pageable
        );

        List<BookshelfSessionResponse.Item> items = sessionPage.getContent().stream()
                .map(session -> {
                    Scenario scenario = session.getScenario();
                    Status status = session.getStatus();

                    return new BookshelfSessionResponse.Item(
                            session.getId(),
                            scenario.getId(),
                            scenario.getTitle(),
                            scenario.getSynopsis(),
                            scenario.getThumbnailUrl(),
                            status.name(),
                            // playTime: COMPLETED, FAILED
                            (status == Status.COMPLETED || status == Status.FAILED)
                                    ? session.getPlayTime() : null,
                            // rankGrade: COMPLETED only
                            (status == Status.COMPLETED && session.getRankGrade() != null)
                                    ? session.getRankGrade().name() : null,
                            // lastSavedAt: PLAYING only
                            (status == Status.PLAYING) ? session.getLastSavedAt() : null,
                            // expiresAt: PLAYING only
                            (status == Status.PLAYING) ? session.getExpiresAt() : null,
                            // hasReport: COMPLETED only (resultReportJson 존재 여부)
                            (status == Status.COMPLETED && session.getResultReportJson() != null)
                    );
                })
                .toList();

        return new BookshelfSessionResponse(
                items,
                sessionPage.getTotalPages(),
                sessionPage.getTotalElements(),
                sessionPage.getNumber()
        );
    }

    public ScenarioListResponse getMyScenarios(OidcUser oidcUser, Pageable pageable) {
        User user = getUser(oidcUser);

        Page<Scenario> scenarioPage = scenarioRepository.findByCreator(user, pageable);

        List<ScenarioListResponse.Item> items = scenarioPage.getContent().stream()
                .map(scenario -> new ScenarioListResponse.Item(
                        scenario.getId(),
                        scenario.getTitle(),
                        scenario.getSynopsis(),
                        scenario.getGenre(),
                        scenario.getThumbnailUrl(),
                        scenario.getPlayCount(),
                        scenario.getAvgRating(),
                        scenario.getAvgDifficulty(),
                        scenario.getGenerationStatus() != null ? scenario.getGenerationStatus().name() : null,
                        null,
                        scenario.getGenerationError()
                ))
                .toList();

        return new ScenarioListResponse(
                items,
                scenarioPage.getTotalPages(),
                scenarioPage.getTotalElements(),
                scenarioPage.getNumber()
        );
    }

    private User getUser(OidcUser oidcUser) {
        if (oidcUser == null) {
            throw new BaseException(ErrorCode.UNAUTHORIZED);
        }
        String googleId = oidcUser.getSubject();
        return userRepository.findByGoogleId(googleId)
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));
    }
}
