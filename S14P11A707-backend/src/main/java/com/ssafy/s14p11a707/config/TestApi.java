package com.ssafy.s14p11a707.config;

import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 테스트 전용 API (운영 환경에서 비활성화)
 */
@Profile("!prod")
@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestApi {

    private final JdbcTemplate jdbc;

    /**
     * DB 상태 조회 (시나리오, 게임세션, 용의자 목록)
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        List<Map<String, Object>> scenarios = jdbc.queryForList(
                "SELECT id, title, genre, suspect_count, generation_status, created_at FROM scenarios ORDER BY id DESC");

        List<Map<String, Object>> sessions = jdbc.queryForList(
                "SELECT id, scenario_id, user_id, health, status, created_at FROM game_sessions ORDER BY id DESC");

        List<Map<String, Object>> suspects = jdbc.queryForList(
                "SELECT id, name, scenario_id, is_culprit FROM suspects ORDER BY scenario_id, id");

        return ResponseEntity.ok(Map.of(
                "scenarios", scenarios,
                "sessions", sessions,
                "suspects", suspects
        ));
    }

    /**
     * GENERATING 상태 시나리오를 FAILED로 강제 전환
     */
    @PostMapping("/reset-generating")
    public ResponseEntity<Map<String, Object>> resetGenerating() {
        int updated = jdbc.update(
                "UPDATE scenarios SET generation_status = 'FAILED', generation_error = NULL WHERE generation_status = 'GENERATING'");
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    /**
     * 게임세션 Health를 100으로 리셋
     */
    @PostMapping("/reset-health/{sessionId}")
    public ResponseEntity<Map<String, Object>> resetHealth(@PathVariable long sessionId) {
        int updated = jdbc.update("UPDATE game_sessions SET health = 100 WHERE id = ?", sessionId);
        return ResponseEntity.ok(Map.of("updated", updated, "sessionId", sessionId));
    }
}
