package com.ssafy.s14p11a707.common.api;

import com.ssafy.s14p11a707.common.dto.DebugResponse;
import com.ssafy.s14p11a707.common.dto.DebugResponse.ClueDto;
import com.ssafy.s14p11a707.common.dto.DebugResponse.GameSessionDto;
import com.ssafy.s14p11a707.common.dto.DebugResponse.RoomDto;
import com.ssafy.s14p11a707.common.dto.DebugResponse.ScenarioDto;
import com.ssafy.s14p11a707.common.dto.DebugResponse.SuspectDto;
import com.ssafy.s14p11a707.common.dto.DebugResponse.VictimDto;
import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.game.dto.ClueListResponse;
import com.ssafy.s14p11a707.game.dto.DiscoveredClueResponse;
import com.ssafy.s14p11a707.game.repository.DiscoveredClueRepository;
import com.ssafy.s14p11a707.game.repository.GameSessionRepository;
import com.ssafy.s14p11a707.game.service.GameSessionService;
import com.ssafy.s14p11a707.scenario.repository.ClueRepository;
import com.ssafy.s14p11a707.scenario.repository.RoomRepository;
import com.ssafy.s14p11a707.scenario.repository.ScenarioRepository;
import com.ssafy.s14p11a707.scenario.repository.SuspectRepository;
import com.ssafy.s14p11a707.scenario.repository.VictimRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/debug")
@Transactional(readOnly = true)
public class DebugApi implements DebugApiDoc {

    private final ScenarioRepository scenarioRepository;
    private final VictimRepository victimRepository;
    private final SuspectRepository suspectRepository;
    private final ClueRepository clueRepository;
    private final RoomRepository roomRepository;
    private final GameSessionRepository gameSessionRepository;
    private final DiscoveredClueRepository discoveredClueRepository;
    private final GameSessionService gameSessionService;

    @GetMapping("/scenarios/{scenarioId}")
    @Override
    public ResponseEntity<ScenarioDto> getScenario(@PathVariable long scenarioId) {
        var scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new BaseException(ErrorCode.SCENARIO_NOT_FOUND));
        return ResponseEntity.ok(ScenarioDto.from(scenario));
    }

    @GetMapping("/users/{userId}/scenarios")
    @Override
    public ResponseEntity<List<ScenarioDto>> getScenariosByUser(@PathVariable long userId) {
        var scenarios = scenarioRepository.findByCreatorId(userId);
        return ResponseEntity.ok(scenarios.stream().map(ScenarioDto::from).toList());
    }

    @GetMapping("/sessions/{sessionId}/discoveredclues")
    @Override
    public ResponseEntity<ClueListResponse> getDiscoveredCluesBySession(
            @PathVariable long sessionId,
            @AuthenticationPrincipal OidcUser oidcUser){
        return ResponseEntity.ok(gameSessionService.getDiscoveredClues(sessionId));
    }

    @GetMapping("/scenarios/{scenarioId}/victim")
    @Override
    public ResponseEntity<VictimDto> getVictim(@PathVariable long scenarioId) {
        var victim = victimRepository.findByScenarioId(scenarioId)
                .orElseThrow(() -> new BaseException(ErrorCode.VICTIM_NOT_FOUND));
        return ResponseEntity.ok(VictimDto.from(victim));
    }

    @GetMapping("/scenarios/{scenarioId}/suspects")
    @Override
    public ResponseEntity<List<SuspectDto>> getSuspects(@PathVariable long scenarioId) {
        var suspects = suspectRepository.findByScenarioIdOrderByDisplayOrderAsc(scenarioId);
        return ResponseEntity.ok(suspects.stream().map(SuspectDto::from).toList());
    }

    @GetMapping("/scenarios/{scenarioId}/clues")
    @Override
    public ResponseEntity<List<ClueDto>> getClues(@PathVariable long scenarioId) {
        var clues = clueRepository.findByScenarioId(scenarioId);
        return ResponseEntity.ok(clues.stream().map(ClueDto::from).toList());
    }

    @GetMapping("/scenarios/{scenarioId}/rooms")
    @Override
    public ResponseEntity<List<RoomDto>> getRooms(@PathVariable long scenarioId) {
        var rooms = roomRepository.findByScenarioIdOrderByFloorNumberAsc(scenarioId);
        return ResponseEntity.ok(rooms.stream().map(RoomDto::from).toList());
    }

    @GetMapping("/scenarios/{scenarioId}/sessions")
    @Override
    public ResponseEntity<List<GameSessionDto>> getSessionsByScenario(@PathVariable long scenarioId) {
        var sessions = gameSessionRepository.findByScenarioId(scenarioId);
        return ResponseEntity.ok(sessions.stream().map(GameSessionDto::from).toList());
    }

    @GetMapping("/users/{userId}/sessions")
    @Override
    public ResponseEntity<List<GameSessionDto>> getSessionsByUser(@PathVariable long userId) {
        var sessions = gameSessionRepository.findByUserId(userId);
        return ResponseEntity.ok(sessions.stream().map(GameSessionDto::from).toList());
    }

    @GetMapping("/scenarios/{scenarioId}/full")
    @Override
    public ResponseEntity<DebugResponse.FullScenarioData> getFullScenarioData(@PathVariable long scenarioId) {
        var scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new BaseException(ErrorCode.SCENARIO_NOT_FOUND));

        var victim = victimRepository.findByScenarioId(scenarioId).orElse(null);
        var suspects = suspectRepository.findByScenarioIdOrderByDisplayOrderAsc(scenarioId);
        var clues = clueRepository.findByScenarioId(scenarioId);
        var rooms = roomRepository.findByScenarioIdOrderByFloorNumberAsc(scenarioId);
        var sessions = gameSessionRepository.findByScenarioId(scenarioId);

        return ResponseEntity.ok(new DebugResponse.FullScenarioData(
                ScenarioDto.from(scenario),
                victim != null ? VictimDto.from(victim) : null,
                suspects.stream().map(SuspectDto::from).toList(),
                clues.stream().map(ClueDto::from).toList(),
                rooms.stream().map(RoomDto::from).toList(),
                sessions.stream().map(GameSessionDto::from).toList()
        ));
    }
}
