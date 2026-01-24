package com.ssafy.s14p11a707.scenario.service.impl;

import com.ssafy.s14p11a707.mock.MockFixtures;
import com.ssafy.s14p11a707.scenario.dto.RoomListResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioCreateRequest;
import com.ssafy.s14p11a707.scenario.dto.ScenarioCreateResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioDeleteResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioDetailResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioListResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioRankingResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioStatusResponse;
import com.ssafy.s14p11a707.scenario.dto.SuspectListResponse;
import com.ssafy.s14p11a707.scenario.dto.VictimResponse;
import com.ssafy.s14p11a707.scenario.service.ScenarioService;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public class ScenarioServiceMockImpl implements ScenarioService {

    private static final AtomicLong CREATED_SCENARIO_ID_SEQUENCE = new AtomicLong(9000L);
    private static final ConcurrentMap<Long, CreatedScenario> CREATED = new ConcurrentHashMap<>();

    @Override
    public ScenarioListResponse listScenarios() {
        List<MockFixtures.ScenarioFixture> base = MockFixtures.scenarios();
        List<MockFixtures.ScenarioFixture> createdCompleted = CREATED.values().stream()
                .filter(c -> c.status().equals("COMPLETED"))
                .map(CreatedScenario::scenario)
                .sorted(Comparator.comparingLong(MockFixtures.ScenarioFixture::id).reversed())
                .toList();

        return MockFixtures.scenarioListResponse(concat(createdCompleted, base));
    }

    @Override
    public ScenarioListResponse searchScenarios() {
        return listScenarios();
    }

    @Override
    public ScenarioDetailResponse getScenario(long scenarioId) {
        MockFixtures.ScenarioFixture created = createdScenarioOrNull(scenarioId);
        if (created != null) {
            return MockFixtures.scenarioDetailResponse(created);
        }
        return MockFixtures.scenarioDetailResponse(scenarioId);
    }

    @Override
    public ScenarioStatusResponse getScenarioStatus(long scenarioId) {
        CreatedScenario created = CREATED.get(scenarioId);
        if (created == null) {
            return new ScenarioStatusResponse(scenarioId, "COMPLETED", 100, "시나리오 준비 완료");
        }

        return created.statusResponse();
    }

    @Override
    public ScenarioCreateResponse createScenario(ScenarioCreateRequest request) {
        long scenarioId = CREATED_SCENARIO_ID_SEQUENCE.incrementAndGet();
        int estimatedSeconds = Math.max(20, Math.min(120, 25 + (request == null ? 0 : request.suspectCount() * 10)));

        MockFixtures.ScenarioFixture scenario = generateScenario(scenarioId, request);
        CREATED.put(scenarioId, new CreatedScenario(scenario, Instant.now(), estimatedSeconds));

        return new ScenarioCreateResponse(scenarioId, "GENERATING", estimatedSeconds);
    }

    @Override
    public ScenarioDeleteResponse deleteScenario(long scenarioId) {
        CREATED.remove(scenarioId);
        return new ScenarioDeleteResponse(scenarioId, true);
    }

    @Override
    public ScenarioRankingResponse getScenarioRankings(long scenarioId) {
        MockFixtures.ScenarioFixture created = createdScenarioOrNull(scenarioId);
        if (created != null) {
            return new ScenarioRankingResponse(created.id(), List.of());
        }
        return MockFixtures.scenarioRankingResponse(scenarioId);
    }

    @Override
    public RoomListResponse getRooms(long scenarioId) {
        MockFixtures.ScenarioFixture created = createdScenarioOrNull(scenarioId);
        if (created != null) {
            return MockFixtures.roomListResponse(created);
        }
        return MockFixtures.roomListResponse(scenarioId);
    }

    @Override
    public VictimResponse getVictim(long scenarioId) {
        MockFixtures.ScenarioFixture created = createdScenarioOrNull(scenarioId);
        if (created != null) {
            return MockFixtures.victimResponse(created);
        }
        return MockFixtures.victimResponse(scenarioId);
    }

    @Override
    public SuspectListResponse getSuspects(long scenarioId) {
        MockFixtures.ScenarioFixture created = createdScenarioOrNull(scenarioId);
        if (created != null) {
            return MockFixtures.suspectListResponse(created);
        }
        return MockFixtures.suspectListResponse(scenarioId);
    }

    private static MockFixtures.ScenarioFixture createdScenarioOrNull(long scenarioId) {
        CreatedScenario created = CREATED.get(scenarioId);
        if (created == null) return null;
        if (!created.status().equals("COMPLETED")) return null;
        return created.scenario();
    }

    private static List<MockFixtures.ScenarioFixture> concat(List<MockFixtures.ScenarioFixture> first, List<MockFixtures.ScenarioFixture> second) {
        if (first.isEmpty()) return second;
        if (second.isEmpty()) return first;

        List<MockFixtures.ScenarioFixture> merged = new java.util.ArrayList<>(first.size() + second.size());
        merged.addAll(first);
        merged.addAll(second);
        return List.copyOf(merged);
    }

    private static MockFixtures.ScenarioFixture generateScenario(long scenarioId, ScenarioCreateRequest request) {
        String title = request == null || request.title() == null || request.title().isBlank()
                ? "새 사건 #" + scenarioId
                : request.title().trim();
        String genre = request == null || request.genre() == null || request.genre().isBlank()
                ? "미스터리"
                : request.genre().trim();
        int suspectCount = request == null ? 4 : Math.max(2, Math.min(6, request.suspectCount()));
        String synopsis = request == null || request.synopsis() == null || request.synopsis().isBlank()
                ? "의문의 사건이 발생했다. 제한된 공간, 제한된 시간. 당신의 추리가 필요하다."
                : request.synopsis().trim();

        long victimId = scenarioId * 100 + 1;
        MockFixtures.VictimFixture victim = new MockFixtures.VictimFixture(
                victimId,
                pickName(scenarioId, "민재", "서윤", "도윤", "지우", "하진", "유나") + " " + pickName(scenarioId + 7, "김", "박", "이", "최", "정", "강"),
                25 + (int) (scenarioId % 25),
                (scenarioId % 2 == 0) ? "여" : "남",
                pickOne(scenarioId, "연구원", "기획자", "교수", "프리랜서", "CEO", "작가"),
                "사건 현장(미상)",
                "최근 2시간 이내",
                "조사 중",
                "요약: " + synopsis,
                "https://example.com/portraits/victim_generated_" + scenarioId + ".jpg"
        );

        List<MockFixtures.RoomFixture> rooms = List.of(
                new MockFixtures.RoomFixture(
                        scenarioId * 100 + 21,
                        1,
                        "SCENE",
                        "현장",
                        "사건의 중심. 작은 단서들이 흩어져 있다.",
                        "가장 먼저 현장을 훑고, ‘이상한 점’을 찾는 게 좋아요.",
                        MockFixtures.scenario(1).rooms().getFirst().objects()
                ),
                new MockFixtures.RoomFixture(
                        scenarioId * 100 + 22,
                        2,
                        "OFFICE",
                        "사무실",
                        "기록과 흔적이 남아 있는 공간. 누군가 지우려 한 흔적도 보인다.",
                        "기록은 거짓말을 못 해요. 누락된 부분이 특히 중요해요.",
                        MockFixtures.scenario(2).rooms().getFirst().objects()
                ),
                new MockFixtures.RoomFixture(
                        scenarioId * 100 + 23,
                        3,
                        "HIDDEN",
                        "비밀 공간",
                        "숨겨진 공간. 진실에 가까울수록 공기가 무겁다.",
                        "여기까지 왔다면, 이미 절반은 풀었어요.",
                        MockFixtures.scenario(5).rooms().getFirst().objects()
                )
        );

        List<MockFixtures.SuspectFixture> suspects = java.util.stream.IntStream.range(0, suspectCount)
                .mapToObj(i -> {
                    long suspectId = scenarioId * 100 + 40 + i;
                    String name = pickName(suspectId, "지호", "서준", "하늘", "가은", "태훈", "민지") + " "
                            + pickName(suspectId + 13, "김", "박", "이", "최", "정", "강");
                    String occupation = pickOne(suspectId, "동료", "친구", "경비", "기자", "가족", "협력자");
                    String oneLiner = switch (i) {
                        case 0 -> "가장 먼저 현장을 발견했다";
                        case 1 -> "피해자와 마지막으로 통화했다";
                        case 2 -> "알리바이가 애매하다";
                        default -> "사건과 얽힌 사정이 있어 보인다";
                    };

                    return new MockFixtures.SuspectFixture(
                            suspectId,
                            name,
                            20 + (i * 5),
                            (i % 2 == 0) ? "남" : "여",
                            occupation,
                            oneLiner,
                            "https://example.com/portraits/suspect_generated_" + suspectId + ".jpg",
                            i + 1,
                            "짧게 대답하지만 핵심을 피한다.",
                            Map.of(),
                            List.of(
                                    "그날은 평소처럼… 별일 없었습니다.",
                                    "저도 놀랐어요. 정말이에요.",
                                    "확실한 건, 누군가 거짓말을 하고 있다는 겁니다."
                            )
                    );
                })
                .toList();

        List<MockFixtures.ClueFixture> clues = List.of(
                new MockFixtures.ClueFixture(
                        scenarioId * 100 + 60,
                        rooms.getFirst().id(),
                        1,
                        "뒤틀린 시간 기록",
                        "MEDIUM",
                        "기록이 한 번 수정된 흔적이 있다.",
                        "https://example.com/clues/generated_time_" + scenarioId + ".jpg",
                        "시간이 뒤틀리면 알리바이도 뒤틀려요."
                ),
                new MockFixtures.ClueFixture(
                        scenarioId * 100 + 61,
                        rooms.get(1).id(),
                        2,
                        "의심스러운 계약 조항",
                        "HIGH",
                        "누군가에게 불리한 조항이 표시돼 있다.",
                        "https://example.com/clues/generated_contract_" + scenarioId + ".jpg",
                        "계약은 동기를 만든다—그리고 누군가를 궁지로 몰아요."
                ),
                new MockFixtures.ClueFixture(
                        scenarioId * 100 + 62,
                        rooms.get(2).id(),
                        3,
                        "현장에 남은 도구",
                        "CRITICAL",
                        "손잡이에 지문을 지우려 한 자국이 있다.",
                        "https://example.com/clues/generated_tool_" + scenarioId + ".jpg",
                        "이게 흉기라면, 범인은 급했을 거예요."
                )
        );

        MockFixtures.TruthFixture truth = new MockFixtures.TruthFixture(
                suspects.getFirst().id(),
                clues.getLast().id(),
                3,
                "진실이 드러나면 모든 게 무너진다. 그는 위기를 막기 위해 범행을 선택했다.",
                "도구로 가격해 살해",
                List.of("도구", "가격", "흉기"),
                List.of("위기", "은폐", "비밀")
        );

        return new MockFixtures.ScenarioFixture(
                scenarioId,
                title,
                synopsis,
                genre,
                "https://example.com/thumbnails/generated_" + scenarioId + ".jpg",
                0,
                new java.math.BigDecimal("0.0"),
                new java.math.BigDecimal("0.0"),
                synopsis,
                victim,
                suspects,
                rooms,
                clues,
                truth,
                List.of(),
                List.of()
        );
    }

    private static String pickOne(long seed, String... values) {
        if (values == null || values.length == 0) return "미상";
        int idx = (int) Math.floorMod(seed, values.length);
        return values[idx];
    }

    private static String pickName(long seed, String... candidates) {
        return pickOne(seed, candidates);
    }

    private record CreatedScenario(
            MockFixtures.ScenarioFixture scenario,
            Instant startedAt,
            int estimatedSeconds
    ) {
        ScenarioStatusResponse statusResponse() {
            long elapsed = Duration.between(startedAt, Instant.now()).toSeconds();
            int progress = (int) Math.min(100, (elapsed * 100L) / Math.max(1, estimatedSeconds));

            if (progress >= 100) {
                return new ScenarioStatusResponse(scenario.id(), "COMPLETED", 100, "시나리오 생성 완료");
            }

            String message = (progress < 40)
                    ? "AI가 사건의 배경을 구성 중입니다…"
                    : (progress < 80)
                    ? "AI가 인물과 단서를 생성 중입니다…"
                    : "AI가 최종 검수를 진행 중입니다…";
            return new ScenarioStatusResponse(scenario.id(), "GENERATING", progress, message);
        }

        String status() {
            ScenarioStatusResponse status = statusResponse();
            return status.status();
        }
    }
}
