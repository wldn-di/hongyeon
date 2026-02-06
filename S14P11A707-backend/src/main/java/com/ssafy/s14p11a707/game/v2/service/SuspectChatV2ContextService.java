package com.ssafy.s14p11a707.game.v2.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.game.dto.SuspectChatRequest;
import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.game.entity.SessionSuspectState;
import com.ssafy.s14p11a707.game.entity.SessionSuspectStateId;
import com.ssafy.s14p11a707.game.repository.GameSessionRepository;
import com.ssafy.s14p11a707.game.repository.SessionSuspectStateRepository;
import com.ssafy.s14p11a707.scenario.entity.Clue;
import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.scenario.entity.Suspect;
import com.ssafy.s14p11a707.scenario.entity.Victim;
import com.ssafy.s14p11a707.scenario.repository.ClueRepository;
import com.ssafy.s14p11a707.scenario.repository.SuspectRepository;
import com.ssafy.s14p11a707.scenario.repository.VictimRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.ssafy.s14p11a707.game.entity.GameSession.Status.PLAYING;

@Service
@RequiredArgsConstructor
public class SuspectChatV2ContextService {

    private final GameSessionRepository gameSessionRepository;
    private final SuspectRepository suspectRepository;
    private final VictimRepository victimRepository;
    private final ClueRepository clueRepository;
    private final SessionSuspectStateRepository sessionSuspectStateRepository;

    @Transactional(readOnly = true)
    public SuspectChatV2Context load(long sessionId, long suspectId, SuspectChatRequest request) {
        GameSession session = gameSessionRepository.findByIdWithUserAndScenario(sessionId)
                .orElseThrow(() -> new BaseException(ErrorCode.SESSION_NOT_FOUND));
        validatePlaying(session);

        int currentHealth = session.getHealth() != null ? session.getHealth() : 100;
        if (currentHealth <= 0) {
            throw new BaseException(ErrorCode.HEALTH_DEPLETED);
        }

        Suspect suspect = suspectRepository.findById(suspectId)
                .orElseThrow(() -> new BaseException(ErrorCode.SUSPECT_NOT_FOUND));

        if (suspect.getScenario().getId() != session.getScenario().getId()) {
            throw new BaseException(ErrorCode.INVALID_INPUT_VALUE);
        }

        String scenarioContext = buildScenarioContext(session.getScenario(), suspect);

        JsonNode aiConfig = suspect.getAiConfigJson();
        String personality = aiConfig != null && aiConfig.has("personality")
                ? aiConfig.get("personality").asText()
                : "내성적이고 감정 기복이 심함";

        String speechStyle = aiConfig != null && aiConfig.has("speechStyle")
                ? aiConfig.get("speechStyle").asText()
                : "정중하지만 불안한 말투";

        String level1Lie = "알리바이: 사건 시간에 다른 장소에 있었습니다.";
        String level2Weak = "알리바이가 깨지며 당황하는 상태입니다.";
        Long weaknessClueId = null;

        if (aiConfig != null && aiConfig.has("secret")) {
            JsonNode secret = aiConfig.get("secret");
            if (secret.has("alibi_progression")) {
                JsonNode alibiProgression = secret.get("alibi_progression");
                if (alibiProgression.has("level1_lie")) {
                    level1Lie = alibiProgression.get("level1_lie").asText();
                }
                if (alibiProgression.has("level2_partial")) {
                    level2Weak = alibiProgression.get("level2_partial").asText();
                }
            }
            if (secret.has("weakness_clue")) {
                JsonNode weaknessClue = secret.get("weakness_clue");
                if (weaknessClue.has("id")) {
                    weaknessClueId = weaknessClue.get("id").asLong();
                }
            }
        }

        SessionSuspectStateId stateId = new SessionSuspectStateId(session.getId(), suspect.getId());
        SessionSuspectState state = sessionSuspectStateRepository.findById(stateId).orElse(null);
        int currentInterrogationLevel = state != null ? state.getCurrentInterrogationLevel() : 1;
        String conversationSummary = state != null ? state.getConversationSummary() : null;
        int summarizedMessageCount = state != null ? state.getSummarizedMessageCount() : 0;

        Long usedClueId = request == null ? null : request.usedClueId();
        int promptInterrogationLevel = currentInterrogationLevel;
        if (promptInterrogationLevel < 2 && usedClueId != null && usedClueId.equals(weaknessClueId)) {
            promptInterrogationLevel = 2;
        }

        String userMessage = request == null || request.message() == null ? "" : request.message().trim();
        if (usedClueId != null) {
            Clue clue = clueRepository.findById(usedClueId).orElse(null);
            if (clue != null) {
                userMessage = String.format(
                        "[단서 제시: %s - %s] %s",
                        clue.getName(),
                        clue.getDescription(),
                        userMessage
                );
            } else {
                userMessage = String.format("[단서 ID %d를 제시하며] %s", usedClueId, userMessage);
            }
        }

        String conversationId = "session-" + sessionId + "-suspect-" + suspectId;

        return new SuspectChatV2Context(
                sessionId,
                suspectId,
                conversationId,
                scenarioContext,
                suspect.getName(),
                suspect.getAge() != null ? suspect.getAge() : 30,
                suspect.getGender() != null ? suspect.getGender() : "알 수 없음",
                suspect.getOccupation() != null ? suspect.getOccupation() : "없음",
                suspect.getOneLiner() != null ? suspect.getOneLiner() : "없음",
                suspect.getMotive() != null ? suspect.getMotive() : "없음",
                suspect.isCulprit(),
                personality,
                speechStyle,
                level1Lie,
                level2Weak,
                weaknessClueId,
                currentInterrogationLevel,
                promptInterrogationLevel,
                userMessage,
                usedClueId,
                currentHealth,
                conversationSummary,
                summarizedMessageCount
        );
    }

    private void validatePlaying(GameSession session) {
        if (session.getStatus() != PLAYING) {
            throw new BaseException(ErrorCode.INVALID_INPUT_VALUE);
        }
    }

    @Cacheable(value = "staticSystemContext", key = "#scenario.id + '-' + #currentSuspect.id")
    public String buildScenarioContext(Scenario scenario, Suspect currentSuspect) {
        StringBuilder contextBuilder = new StringBuilder();

        contextBuilder.append("## 상세 줄거리\n");
        if (scenario.getSynopsisDetail() != null && !scenario.getSynopsisDetail().isBlank()) {
            contextBuilder.append(scenario.getSynopsisDetail()).append("\n");
        }

        List<Suspect> suspects = suspectRepository.findByScenarioIdOrderByDisplayOrderAsc(scenario.getId());
        contextBuilder.append("## 용의자 정보\n");
        for (Suspect suspect : suspects) {
            boolean isCurrentSuspect = suspect.getId() == currentSuspect.getId();

            contextBuilder.append(String.format(
                    "- %s (나이: %d, 성별: %s, 직업: %s)\n",
                    suspect.getName(),
                    suspect.getAge() != null ? suspect.getAge() : 0,
                    suspect.getGender() != null ? suspect.getGender() : "알 수 없음",
                    suspect.getOccupation() != null ? suspect.getOccupation() : "알 수 없음"
            ));
            if (suspect.getOneLiner() != null && !suspect.getOneLiner().isBlank()) {
                contextBuilder.append("  성격: ").append(suspect.getOneLiner()).append("\n");
            }

            JsonNode aiConfig = suspect.getAiConfigJson();
            if (aiConfig != null) {
                if (isCurrentSuspect && aiConfig.has("relationship")) {
                    String relationship = aiConfig.get("relationship").asText();
                    if (!relationship.isBlank()) {
                        contextBuilder.append("  관계: ").append(relationship).append("\n");
                    }
                }

                if (isCurrentSuspect) {
                    if (aiConfig.has("secret")) {
                        JsonNode secret = aiConfig.get("secret");
                        if (secret.has("title")) {
                            String secretTitle = secret.get("title").asText();
                            if (!secretTitle.isBlank()) {
                                contextBuilder.append("  비밀: ").append(secretTitle).append("\n");
                            }
                        }
                        if (secret.has("content")) {
                            String secretContent = secret.get("content").asText();
                            if (!secretContent.isBlank()) {
                                contextBuilder.append("    ").append(secretContent).append("\n");
                            }
                        }
                    }

                    if (aiConfig.has("timeline_alibi")) {
                        JsonNode timelineAlibi = aiConfig.get("timeline_alibi");
                        if (timelineAlibi.isArray() && !timelineAlibi.isEmpty()) {
                            contextBuilder.append("  알리바이 타임라인 (당신이 실제로 했던 행동 - 내부 참고용, 유저에게 직접 노출 금지):\n");
                            for (JsonNode alibi : timelineAlibi) {
                                String time = alibi.has("time") ? alibi.get("time").asText() : "";
                                String location = alibi.has("location") ? alibi.get("location").asText() : "";
                                String activity = alibi.has("activity") ? alibi.get("activity").asText() : "";
                                boolean isVerified = alibi.has("is_verified") && alibi.get("is_verified").asBoolean();

                                contextBuilder.append(String.format(
                                        "    - %s: %s (활동: %s, 검증됨: %s)\n",
                                        time, location, activity, isVerified ? "예" : "아니오"
                                ));
                            }
                        }
                    }
                }
            }
        }

        Victim victim = victimRepository.findByScenarioId(scenario.getId()).orElse(null);
        if (victim != null) {
            contextBuilder.append("\n## 피해자 정보\n");
            contextBuilder.append(String.format(
                    """
                            - 이름: %s
                            - 나이: %d
                            - 성별: %s
                            - 직업: %s
                            - 배경: %s
                            - 발견 장소: %s
                            - 추정 사망 시각: %s
                            - 사인: %s
                            """,
                    victim.getName(),
                    victim.getAge() != null ? victim.getAge() : 0,
                    victim.getGender() != null ? victim.getGender() : "알 수 없음",
                    victim.getOccupation() != null ? victim.getOccupation() : "알 수 없음",
                    victim.getBackground() != null ? victim.getBackground() : "",
                    victim.getDiscoveryLocation() != null ? victim.getDiscoveryLocation() : "",
                    victim.getEstimatedDeathTime() != null ? victim.getEstimatedDeathTime() : "",
                    victim.getCauseOfDeath() != null ? victim.getCauseOfDeath() : ""
            ));
        }

        return contextBuilder.toString();
    }
}

