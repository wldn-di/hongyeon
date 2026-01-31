package com.ssafy.s14p11a707.common.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.scenario.entity.Clue;
import com.ssafy.s14p11a707.scenario.entity.Room;
import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.scenario.entity.Suspect;
import com.ssafy.s14p11a707.scenario.entity.Victim;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class DebugResponse {

    public record ScenarioDto(
            long id,
            Long creatorId,
            String title,
            String userSynopsis,
            String synopsis,
            Integer suspectCount,
            String genre,
            String synopsisDetail,
            String thumbnailUrl,
            String generationStatus,
            String generationError,
            JsonNode storyConfigJson,
            JsonNode truthConfigJson,
            int playCount,
            BigDecimal avgRating,
            BigDecimal avgDifficulty,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static ScenarioDto from(Scenario entity) {
            return new ScenarioDto(
                    entity.getId(),
                    entity.getCreator() != null ? entity.getCreator().getId() : null,
                    entity.getTitle(),
                    entity.getUserSynopsis(),
                    entity.getSynopsis(),
                    entity.getSuspectCount(),
                    entity.getGenre(),
                    entity.getSynopsisDetail(),
                    entity.getThumbnailUrl(),
                    entity.getGenerationStatus() != null ? entity.getGenerationStatus().name() : null,
                    entity.getGenerationError(),
                    entity.getStoryConfigJson(),
                    entity.getTruthConfigJson(),
                    entity.getPlayCount(),
                    entity.getAvgRating(),
                    entity.getAvgDifficulty(),
                    entity.getCreatedAt(),
                    entity.getUpdatedAt()
            );
        }
    }

    public record VictimDto(
            long id,
            long scenarioId,
            String name,
            Integer age,
            String gender,
            String occupation,
            String background,
            String discoveryLocation,
            String estimatedDeathTime,
            String causeOfDeath,
            JsonNode victimDetailJson,
            String portraitUrl
    ) {
        public static VictimDto from(Victim entity) {
            return new VictimDto(
                    entity.getId(),
                    entity.getScenario().getId(),
                    entity.getName(),
                    entity.getAge(),
                    entity.getGender(),
                    entity.getOccupation(),
                    entity.getBackground(),
                    entity.getDiscoveryLocation(),
                    entity.getEstimatedDeathTime(),
                    entity.getCauseOfDeath(),
                    entity.getVictimDetailJson(),
                    entity.getPortraitUrl()
            );
        }
    }

    public record SuspectDto(
            long id,
            long scenarioId,
            String name,
            Integer age,
            String gender,
            String occupation,
            String oneLiner,
            boolean isCulprit,
            String motive,
            Integer displayOrder,
            String portraitUrl,
            JsonNode aiConfigJson
    ) {
        public static SuspectDto from(Suspect entity) {
            return new SuspectDto(
                    entity.getId(),
                    entity.getScenario().getId(),
                    entity.getName(),
                    entity.getAge(),
                    entity.getGender(),
                    entity.getOccupation(),
                    entity.getOneLiner(),
                    entity.isCulprit(),
                    entity.getMotive(),
                    entity.getDisplayOrder(),
                    entity.getPortraitUrl(),
                    entity.getAiConfigJson()
            );
        }
    }

    public record ClueDto(
            long id,
            long scenarioId,
            Long roomId,
            Integer roomFloorNumber,
            String name,
            String description,
            String detailImageUrl,
            String assistantComment,
            JsonNode clueDetailJson,
            JsonNode transformJson
    ) {
        public static ClueDto from(Clue entity) {
            return new ClueDto(
                    entity.getId(),
                    entity.getScenario().getId(),
                    entity.getRoom() != null ? entity.getRoom().getId() : null,
                    entity.getRoom() != null ? entity.getRoom().getFloorNumber() : null,
                    entity.getName(),
                    entity.getDescription(),
                    entity.getDetailImageUrl(),
                    entity.getAssistantComment(),
                    entity.getClueDetailJson(),
                    entity.getTransformJson()
            );
        }
    }

    public record RoomDto(
            long id,
            long scenarioId,
            int floorNumber,
            String roomType,
            String roomName,
            String description,
            String assistantComment,
            JsonNode objectJson
    ) {
        public static RoomDto from(Room entity) {
            return new RoomDto(
                    entity.getId(),
                    entity.getScenario().getId(),
                    entity.getFloorNumber(),
                    entity.getRoomType(),
                    entity.getRoomName(),
                    entity.getDescription(),
                    entity.getAssistantComment(),
                    entity.getObjectJson()
            );
        }
    }

    public record GameSessionDto(
            long id,
            long scenarioId,
            long userId,
            String status,
            Integer currentFloor,
            JsonNode visitedFloorsJson,
            Integer health,
            Integer submitAttempts,
            Boolean hasCleared,
            Integer finalScore,
            String rankGrade,
            JsonNode resultReportJson,
            Instant startedAt,
            Instant completedAt,
            Long playTime,
            Instant lastSavedAt,
            Instant expiresAt,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static GameSessionDto from(GameSession entity) {
            return new GameSessionDto(
                    entity.getId(),
                    entity.getScenario().getId(),
                    entity.getUser().getId(),
                    entity.getStatus() != null ? entity.getStatus().name() : null,
                    entity.getCurrentFloor(),
                    entity.getVisitedFloorsJson(),
                    entity.getHealth(),
                    entity.getSubmitAttempts(),
                    entity.getHasCleared(),
                    entity.getFinalScore(),
                    entity.getRankGrade() != null ? entity.getRankGrade().name() : null,
                    entity.getResultReportJson(),
                    entity.getStartedAt(),
                    entity.getCompletedAt(),
                    entity.getPlayTime(),
                    entity.getLastSavedAt(),
                    entity.getExpiresAt(),
                    entity.getCreatedAt(),
                    entity.getUpdatedAt()
            );
        }
    }

    public record FullScenarioData(
            ScenarioDto scenario,
            VictimDto victim,
            List<SuspectDto> suspects,
            List<ClueDto> clues,
            List<RoomDto> rooms,
            List<GameSessionDto> sessions
    ) {
    }
}
