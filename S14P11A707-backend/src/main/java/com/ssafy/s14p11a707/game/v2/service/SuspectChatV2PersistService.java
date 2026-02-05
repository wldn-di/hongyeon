package com.ssafy.s14p11a707.game.v2.service;

import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.game.entity.ChatMessage;
import com.ssafy.s14p11a707.game.entity.EventLog;
import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.game.entity.SessionSuspectState;
import com.ssafy.s14p11a707.game.entity.SessionSuspectStateId;
import com.ssafy.s14p11a707.game.repository.ChatMessageRepository;
import com.ssafy.s14p11a707.game.repository.EventLogRepository;
import com.ssafy.s14p11a707.game.repository.GameSessionRepository;
import com.ssafy.s14p11a707.game.repository.SessionSuspectStateRepository;
import com.ssafy.s14p11a707.scenario.entity.Suspect;
import com.ssafy.s14p11a707.scenario.repository.SuspectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.ssafy.s14p11a707.game.entity.EventLog.EventType.CHAT_STARTED;
import static com.ssafy.s14p11a707.game.entity.GameSession.Status.PLAYING;

@Service
@RequiredArgsConstructor
public class SuspectChatV2PersistService {

    private final GameSessionRepository gameSessionRepository;
    private final SuspectRepository suspectRepository;
    private final SessionSuspectStateRepository sessionSuspectStateRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final EventLogRepository eventLogRepository;

    @Transactional
    public SuspectChatV2PersistResult persist(
            SuspectChatV2Context context,
            String reply,
            boolean keyTalk,
            boolean aiSuccess
    ) {
        GameSession session = gameSessionRepository.findById(context.sessionId())
                .orElseThrow(() -> new BaseException(ErrorCode.SESSION_NOT_FOUND));
        validatePlaying(session);

        int currentHealth = session.getHealth() != null ? session.getHealth() : 100;
        if (currentHealth <= 0) {
            throw new BaseException(ErrorCode.HEALTH_DEPLETED);
        }

        Suspect suspect = suspectRepository.findById(context.suspectId())
                .orElseThrow(() -> new BaseException(ErrorCode.SUSPECT_NOT_FOUND));
        if (suspect.getScenario().getId() != session.getScenario().getId()) {
            throw new BaseException(ErrorCode.INVALID_INPUT_VALUE);
        }

        int responseLevel = upsertInterrogationLevel(session, suspect, context.usedClueId(), context.weaknessClueId());

        ChatMessage userMessageEntity = ChatMessage.builder()
                .session(session)
                .suspect(suspect)
                .role("user")
                .content(context.userMessage())
                .usedClueId(context.usedClueId())
                .responseLevel(null)
                .keyTalk(false)
                .build();
        chatMessageRepository.save(userMessageEntity);

        ChatMessage assistantMessageEntity = ChatMessage.builder()
                .session(session)
                .suspect(suspect)
                .role("suspect")
                .content(reply)
                .usedClueId(null)
                .responseLevel(responseLevel)
                .keyTalk(aiSuccess && keyTalk)
                .build();
        chatMessageRepository.save(assistantMessageEntity);

        int health = currentHealth;
        if (aiSuccess) {
            health = Math.max(0, health - 5);
        }

        session.setHealth(health);
        session.updateProgress();
        saveChatStartedLog(session, suspect.getName());

        return new SuspectChatV2PersistResult(responseLevel, health);
    }

    private int upsertInterrogationLevel(
            GameSession session,
            Suspect suspect,
            Long usedClueId,
            Long weaknessClueId
    ) {
        SessionSuspectStateId stateId = new SessionSuspectStateId(session.getId(), suspect.getId());
        SessionSuspectState state = sessionSuspectStateRepository.findById(stateId).orElse(null);

        int currentLevel = state != null ? state.getCurrentInterrogationLevel() : 1;
        int newLevel = currentLevel;
        if (newLevel < 2 && usedClueId != null && usedClueId.equals(weaknessClueId)) {
            newLevel = 2;
        }

        if (state == null) {
            state = SessionSuspectState.builder()
                    .session(session)
                    .suspect(suspect)
                    .currentInterrogationLevel(newLevel)
                    .secretRevealed(false)
                    .build();
            sessionSuspectStateRepository.save(state);
            return newLevel;
        }

        if (newLevel != currentLevel) {
            state.setCurrentInterrogationLevel(newLevel);
            sessionSuspectStateRepository.save(state);
        }
        return newLevel;
    }

    private void validatePlaying(GameSession session) {
        if (session.getStatus() != PLAYING) {
            throw new BaseException(ErrorCode.INVALID_INPUT_VALUE);
        }
    }

    private void saveChatStartedLog(GameSession session, String suspectName) {
        EventLog eventLog = EventLog.builder()
                .session(session)
                .eventType(CHAT_STARTED)
                .eventName("용의자 심문")
                .displayMessage(suspectName + "에 대한 심문을 시작합니다.")
                .build();
        eventLogRepository.save(eventLog);
    }
}

