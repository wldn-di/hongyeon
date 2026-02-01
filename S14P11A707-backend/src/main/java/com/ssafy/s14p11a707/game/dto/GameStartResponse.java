package com.ssafy.s14p11a707.game.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.game.entity.DiscoveredClue;
import com.ssafy.s14p11a707.game.entity.EventLog;
import com.ssafy.s14p11a707.game.entity.GameSession;
import com.ssafy.s14p11a707.scenario.entity.Clue;
import com.ssafy.s14p11a707.scenario.entity.Room;
import com.ssafy.s14p11a707.scenario.entity.Scenario;
import com.ssafy.s14p11a707.scenario.entity.Victim;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

public record GameStartResponse(
        long sessionId,
        long scenarioId,
        long userId,
        String status,
        boolean alreadyPlaying,
        Instant startedAt,
        ScenarioItem scenario,
        VictimItem victim,
        CurrentRoom currentRoom,
        EventLogItem eventLog
) {

    public static GameStartResponse from(
            GameSession session,
            Scenario scenarioEntity,
            Victim victimEntity,
            Room roomEntity,
            EventLog startLog
    ) {
        return new GameStartResponse(
                session.getId(),
                scenarioEntity.getId(),
                session.getUser().getId(),
                session.getStatus().name(),
                false,
                session.getStartedAt(),
                ScenarioItem.from(scenarioEntity),
                victimEntity != null ? VictimItem.from(victimEntity) : null,
                roomEntity != null ? CurrentRoom.from(roomEntity) : null,
                startLog != null ? EventLogItem.from(startLog) : null
        );
    }

    public record ScenarioItem(
            String title,
            String opening
    ) {
        public static ScenarioItem from(Scenario entity) {
            // storyConfigJson에서 narration.opening 추출
            String opening = null;
            JsonNode storyConfig = entity.getStoryConfigJson();
            if (storyConfig != null) {
                JsonNode narration = storyConfig.path("narration");
                if (!narration.isMissingNode()) {
                    JsonNode openingNode = narration.path("opening");
                    if (!openingNode.isMissingNode()) {
                        opening = openingNode.asText();
                    }
                }
            }
            // narration.opening이 없으면 synopsis를 fallback으로 사용
            if (opening == null || opening.isBlank()) {
                opening = entity.getSynopsis();
            }
            return new ScenarioItem(entity.getTitle(), opening);
        }
    }
    public static GameStartResponse alreadyPlaying(GameSession session) {
        return new GameStartResponse(
                session.getId(),
                session.getScenario().getId(),
                session.getUser().getId(),
                session.getStatus().name(),
                true,
                session.getStartedAt(),
                null,
                null,
                null,
                null
        );
    }
    public record VictimItem(
            String name,
            int age,
            String gender,
            String occupation,
            String discoveryLocation,
            String estimatedDeathTime,
            String causeOfDeath,
            String portraitUrl
    ) {
        public static VictimItem from(Victim entity) {
            return new VictimItem(
                    entity.getName(),
                    entity.getAge() != null ? entity.getAge() : 0,
                    entity.getGender(),
                    entity.getOccupation(),
                    entity.getDiscoveryLocation(),
                    entity.getEstimatedDeathTime(),
                    entity.getCauseOfDeath(),
                    entity.getPortraitUrl()
            );
        }
    }

    public record CurrentRoom(
            int floorNumber,
            String roomName,
            String roomType,
            @ArraySchema(schema = @Schema(implementation = Object.class))
            JsonNode objects
    ) {
        public static CurrentRoom from(Room entity) {
            return new CurrentRoom(
                    entity.getFloorNumber(),
                    entity.getRoomName(),
                    entity.getRoomType(),
                    entity.getObjectJson()
            );
        }
    }

    public record EventLogItem(
            String type,
            String message,
            Instant createdAt
    ) {
        public static EventLogItem from(EventLog entity) {
            return new EventLogItem(
                    entity.getEventType().name(),
                    entity.getDisplayMessage(),
                    entity.getCreatedAt()
            );
        }
    }
}
