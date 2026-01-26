package com.ssafy.s14p11a707.game.dto;

import com.ssafy.s14p11a707.game.entity.ChatMessage;
import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.game.entity.GameSession.Status;
import java.time.Instant;
import java.util.List;

public record InvestigationReportResponse(
        long sessionId,
        long scenarioId,
        long userId,
        String rankGrade,
        int finalScore,
        String summary,
        String aiComment,
        Stats stats,
        List<KeyTalk> keyTalks
) {

    public static InvestigationReportResponse from(
            GameSession session,
            int totalInterrogations,
            int cluesCollected,
            List<ChatMessage> keyTalkMessages
    ) {
        String rankGrade = session.getRankGrade() != null ? session.getRankGrade().name() : "F";
        int score = session.getFinalScore() != null ? session.getFinalScore() : 0;
        String scenarioTitle = session.getScenario().getTitle();

        String summary = session.getStatus() == Status.COMPLETED
                ? "사건 해결: " + scenarioTitle + " — 결정적 단서들을 연결해 진실에 도달했습니다."
                : "사건 진행 중: " + scenarioTitle + " — 아직 풀리지 않은 연결고리가 남아 있습니다.";

        // ai-comment(예시)
        String aiComment = session.getStatus() == Status.COMPLETED
                ? "단서의 중요도를 잘 구분했고, 보드 연결이 명확했습니다."
                : "결정적 단서를 더 확보하거나, 보드에서 연결을 정리하면 추리가 쉬워질 거예요.";

        return new InvestigationReportResponse(
                session.getId(),
                session.getScenario().getId(),
                session.getUser().getId(),
                rankGrade,
                score,
                summary,
                aiComment,
                new Stats(totalInterrogations, cluesCollected),
                keyTalkMessages.stream().limit(5).map(KeyTalk::from).toList()
        );
    }

    public record Stats(
            int totalInterrogations,
            int cluesCollected
    ) {
    }

    public record KeyTalk(
            long suspectId,
            String content,
            Instant createdAt
    ) {
        public static KeyTalk from(ChatMessage message) {
            return new KeyTalk(
                    message.getSuspect() != null ? message.getSuspect().getId() : 0,
                    message.getContent(),
                    message.getCreatedAt()
            );
        }
    }
}
