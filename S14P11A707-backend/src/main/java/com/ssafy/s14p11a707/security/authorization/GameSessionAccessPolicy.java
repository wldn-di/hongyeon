package com.ssafy.s14p11a707.security.authorization;

import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.game.repository.GameSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GameSessionAccessPolicy {

    private final GameSessionRepository gameSessionRepository;

    public void assertSessionOwner(long userId, long sessionId) {

        Long ownerId = requireOwnerId(sessionId);
        if (ownerId == null || ownerId != userId) {
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }
    }

    public void assertCanReadOtherReport(long userId, long sessionId) {
        GameSession session = requireSession(sessionId);
        if (session.getStatus() != GameSession.Status.COMPLETED) {
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }

        boolean hasCompletedScenario = gameSessionRepository.existsByScenarioIdAndUserIdAndStatus(
                session.getScenario().getId(),
                userId,
                GameSession.Status.COMPLETED
        );
        if (!hasCompletedScenario) {
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }
    }

    private GameSession requireSession(long sessionId) {
        return gameSessionRepository.findByIdWithUserAndScenario(sessionId)
                .orElseThrow(() -> new BaseException(ErrorCode.SESSION_NOT_FOUND));
    }

    private Long requireOwnerId(long sessionId) {
        return gameSessionRepository.findOwnerIdById(sessionId)
                .orElseThrow(() -> new BaseException(ErrorCode.SESSION_NOT_FOUND));
    }
}

