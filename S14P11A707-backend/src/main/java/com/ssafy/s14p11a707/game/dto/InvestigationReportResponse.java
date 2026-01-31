package com.ssafy.s14p11a707.game.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.game.entity.ChatMessage;
import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.game.entity.GameSession.Status;
import java.time.Instant;
import java.util.List;
import java.util.stream.StreamSupport;

public record InvestigationReportResponse(
        long sessionId,
        long scenarioId,
        long userId,
        String playerName,
        String scenarioTitle,
        String rankGrade,
        int finalScore,
        long playTimeMinutes,
        String summary,
        String aiComment,
        Stats stats,
        List<KeyTalk> keyTalks
) {

    public static InvestigationReportResponse from(GameSession session, JsonNode report) {

        JsonNode resultNode = report.path("result");
        JsonNode statsNode = report.path("stats");
        JsonNode keyTalksNode = report.path("key_talks");

        String playerName =
                session.getUser() != null && session.getUser().getNickname() != null
                        ? session.getUser().getNickname()
                        : "익명 탐정";

        String scenarioTitle =
                session.getScenario() != null
                        ? session.getScenario().getTitle()
                        : "알 수 없는 시나리오";

        String summary =
                resultNode.path("summary").asText(
                        session.getStatus() == Status.COMPLETED
                                ? "사건 해결"
                                : "사건 진행 중"
                );

        List<KeyTalk> keyTalks =
                keyTalksNode.isArray()
                        ? StreamSupport.stream(keyTalksNode.spliterator(), false)
                        .limit(5)
                        .map(node -> new KeyTalk(
                                node.path("suspect_id").asLong(0),
                                node.path("content").asText(""),
                                Instant.parse(
                                        node.path("created_at")
                                                .asText(Instant.EPOCH.toString())
                                )
                        ))
                        .toList()
                        : List.of();

        return new InvestigationReportResponse(
                session.getId(),
                session.getScenario() != null ? session.getScenario().getId() : 0,
                session.getUser() != null ? session.getUser().getId() : 0,
                playerName,
                scenarioTitle,
                resultNode.path("rank_grade").asText("F"),
                resultNode.path("final_score").asInt(0),
                session.getPlayTime() != null ? session.getPlayTime() / 60 : 0,
                summary,
                resultNode.path("ai_comment").asText(null),
                new Stats(
                        statsNode.path("total_interrogations").asInt(0),
                        statsNode.path("clues_collected").asInt(0)
                ),
                keyTalks
        );
    }
    public record Stats(
            int totalInterrogations,
            int cluesCollected ) {

    } public record KeyTalk(
            long suspectId,
            String content,
            Instant createdAt ) {

    }
}
