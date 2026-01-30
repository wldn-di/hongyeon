package com.ssafy.s14p11a707.common.api;

import com.ssafy.s14p11a707.common.dto.DebugResponse;
import com.ssafy.s14p11a707.game.dto.ClueListResponse;
import com.ssafy.s14p11a707.game.dto.DiscoveredClueResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@Tag(name = "Debug", description = "시나리오 데이터 디버깅 API (개발용)")
public interface DebugApiDoc {

    @Operation(summary = "게임 세션 목록 조회 (유저별)", description = "유저 ID로 해당 유저의 게임 세션 목록을 조회합니다.")
    ResponseEntity<List<DebugResponse.GameSessionDto>> getSessionsByUser(
            @Parameter(description = "유저 ID") long userId
    );

    @Operation(summary = "유저의 시나리오 목록 조회", description = "유저 ID로 해당 유저가 생성한 시나리오 목록을 조회합니다.")
    ResponseEntity<List<DebugResponse.ScenarioDto>> getScenariosByUser(
            @Parameter(description = "유저 ID") long userId
    );

    @Operation(summary = "세션의 인벤토리 목록 조회", description = "세션 ID로 해당 세션의 획득 단서 목록을 조회합니다.")
    ResponseEntity<ClueListResponse> getDiscoveredCluesBySession(
            @Parameter(description = "세션 ID") long sessionId,
            @Parameter(hidden = true) @AuthenticationPrincipal OidcUser oidcUser);

    @Operation(summary = "시나리오 조회", description = "시나리오 ID로 시나리오 정보를 조회합니다.")
    ResponseEntity<DebugResponse.ScenarioDto> getScenario(
            @Parameter(description = "시나리오 ID") long scenarioId
    );

    @Operation(summary = "피해자 조회", description = "시나리오 ID로 피해자 정보를 조회합니다.")
    ResponseEntity<DebugResponse.VictimDto> getVictim(
            @Parameter(description = "시나리오 ID") long scenarioId
    );

    @Operation(summary = "용의자 목록 조회", description = "시나리오 ID로 용의자 목록을 조회합니다.")
    ResponseEntity<List<DebugResponse.SuspectDto>> getSuspects(
            @Parameter(description = "시나리오 ID") long scenarioId
    );

    @Operation(summary = "단서 목록 조회", description = "시나리오 ID로 단서 목록을 조회합니다.")
    ResponseEntity<List<DebugResponse.ClueDto>> getClues(
            @Parameter(description = "시나리오 ID") long scenarioId
    );

    @Operation(summary = "방 목록 조회", description = "시나리오 ID로 방 목록을 조회합니다.")
    ResponseEntity<List<DebugResponse.RoomDto>> getRooms(
            @Parameter(description = "시나리오 ID") long scenarioId
    );

    @Operation(summary = "게임 세션 목록 조회 (시나리오별)", description = "시나리오 ID로 해당 시나리오의 게임 세션 목록을 조회합니다.")
    ResponseEntity<List<DebugResponse.GameSessionDto>> getSessionsByScenario(
            @Parameter(description = "시나리오 ID") long scenarioId
    );

    @Operation(summary = "시나리오 전체 데이터 조회", description = "시나리오 ID로 시나리오 관련 모든 데이터를 한번에 조회합니다.")
    ResponseEntity<DebugResponse.FullScenarioData> getFullScenarioData(
            @Parameter(description = "시나리오 ID") long scenarioId
    );
}
