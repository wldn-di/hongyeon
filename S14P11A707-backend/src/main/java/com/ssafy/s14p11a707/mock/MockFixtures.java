package com.ssafy.s14p11a707.mock;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ssafy.s14p11a707.review.dto.ReviewListResponse;
import com.ssafy.s14p11a707.ranking.dto.GlobalRankingResponse;
import com.ssafy.s14p11a707.scenario.dto.RoomListResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioDetailResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioListResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioRankingResponse;
import com.ssafy.s14p11a707.scenario.dto.SuspectListResponse;
import com.ssafy.s14p11a707.scenario.dto.VictimResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

public final class MockFixtures {

    private static final JsonNodeFactory JSON = JsonNodeFactory.instance;

    public static final Instant BASE_TIME = Instant.parse("2026-01-24T00:00:00Z");

    private static final long ME_USER_ID = 1L;

    private static final List<UserFixture> USERS = List.of(
            new UserFixture(1L, "홍연탐정"),
            new UserFixture(2L, "수사반장"),
            new UserFixture(3L, "단서수집가"),
            new UserFixture(4L, "밤샘추리"),
            new UserFixture(5L, "메모장"),
            new UserFixture(6L, "노련한형사"),
            new UserFixture(7L, "미스터리러버"),
            new UserFixture(8L, "진실추적자"),
            new UserFixture(9L, "추리왕"),
            new UserFixture(10L, "한줄추리"),
            new UserFixture(11L, "암호해독"),
            new UserFixture(12L, "스포일러경계")
    );

    private static final List<ScenarioFixture> SCENARIOS = List.of(
            scenarioGreenhouse(),
            scenarioMuseum(),
            scenarioTrain(),
            scenarioResort(),
            scenarioLibrary()
    );

    private MockFixtures() {
    }

    public static long meUserId() {
        return ME_USER_ID;
    }

    public static List<UserFixture> users() {
        return USERS;
    }

    public static String nicknameOf(long userId) {
        return USERS.stream()
                .filter(u -> u.id() == userId)
                .map(UserFixture::nickname)
                .findFirst()
                .orElse("게스트" + userId);
    }

    public static List<ScenarioFixture> scenarios() {
        return SCENARIOS;
    }

    public static ScenarioFixture scenario(long scenarioId) {
        return SCENARIOS.stream()
                .filter(s -> s.id() == scenarioId)
                .findFirst()
                .orElse(SCENARIOS.getFirst());
    }

    public static ScenarioListResponse scenarioListResponse() {
        return scenarioListResponse(SCENARIOS);
    }

    public static ScenarioListResponse scenarioListResponse(List<ScenarioFixture> scenarios) {
        List<ScenarioListResponse.Item> content = scenarios.stream()
                .map(s -> new ScenarioListResponse.Item(
                        s.id(),
                        s.title(),
                        s.synopsis(),
                        s.genre(),
                        s.thumbnailUrl(),
                        s.playCount(),
                        s.avgRating(),
                        s.avgDifficulty()
                ))
                .toList();

        return new ScenarioListResponse(
                content,
                1,
                content.size(),
                0
        );
    }

    public static ScenarioDetailResponse scenarioDetailResponse(long scenarioId) {
        return scenarioDetailResponse(scenario(scenarioId));
    }

    public static ScenarioDetailResponse scenarioDetailResponse(ScenarioFixture scenario) {
        return new ScenarioDetailResponse(
                scenario.id(),
                scenario.title(),
                scenario.synopsis(),
                scenario.genre(),
                scenario.thumbnailUrl(),
                scenario.playCount(),
                scenario.avgRating(),
                scenario.avgDifficulty(),
                new ScenarioDetailResponse.Victim(
                        scenario.victim().id(),
                        scenario.victim().name(),
                        scenario.victim().age(),
                        scenario.victim().gender(),
                        scenario.victim().occupation(),
                        scenario.victim().discoveryLocation(),
                        scenario.victim().estimatedDeathTime(),
                        scenario.victim().causeOfDeath(),
                        scenario.victim().portraitUrl()
                ),
                scenario.suspects().stream()
                        .sorted(Comparator.comparingInt(SuspectFixture::displayOrder))
                        .map(s -> new ScenarioDetailResponse.Suspect(
                                s.id(),
                                s.name(),
                                s.age(),
                                s.gender(),
                                s.occupation(),
                                s.oneLiner(),
                                s.portraitUrl(),
                                s.displayOrder()
                        ))
                        .toList(),
                scenario.topRankings().stream()
                        .sorted(Comparator.comparingInt(TopRankingFixture::rank))
                        .map(r -> new ScenarioDetailResponse.TopRanking(
                                r.rank(),
                                r.userId(),
                                nicknameOf(r.userId()),
                                r.score(),
                                r.clearTime(),
                                r.rankGrade()
                        ))
                        .toList()
        );
    }

    public static RoomListResponse roomListResponse(long scenarioId) {
        return roomListResponse(scenario(scenarioId));
    }

    public static RoomListResponse roomListResponse(ScenarioFixture scenario) {
        return new RoomListResponse(
                scenario.id(),
                scenario.rooms().stream()
                        .sorted(Comparator.comparingInt(RoomFixture::floorNumber))
                        .map(r -> new RoomListResponse.Room(
                                r.id(),
                                r.floorNumber(),
                                r.roomType(),
                                r.roomName(),
                                r.description(),
                                r.assistantComment(),
                                r.objects()
                        ))
                        .toList()
        );
    }

    public static VictimResponse victimResponse(long scenarioId) {
        return victimResponse(scenario(scenarioId));
    }

    public static VictimResponse victimResponse(ScenarioFixture scenario) {
        VictimFixture v = scenario.victim();
        return new VictimResponse(
                scenario.id(),
                new VictimResponse.Victim(
                        v.id(),
                        v.name(),
                        v.age(),
                        v.gender(),
                        v.occupation(),
                        v.discoveryLocation(),
                        v.estimatedDeathTime(),
                        v.causeOfDeath(),
                        v.background(),
                        v.portraitUrl()
                )
        );
    }

    public static SuspectListResponse suspectListResponse(long scenarioId) {
        return suspectListResponse(scenario(scenarioId));
    }

    public static SuspectListResponse suspectListResponse(ScenarioFixture scenario) {
        return new SuspectListResponse(
                scenario.id(),
                scenario.suspects().stream()
                        .sorted(Comparator.comparingInt(SuspectFixture::displayOrder))
                        .map(s -> new SuspectListResponse.Suspect(
                                s.id(),
                                s.name(),
                                s.age(),
                                s.gender(),
                                s.occupation(),
                                s.oneLiner(),
                                s.portraitUrl(),
                                s.displayOrder()
                        ))
                        .toList()
        );
    }

    public static ScenarioRankingResponse scenarioRankingResponse(long scenarioId) {
        ScenarioFixture scenario = scenario(scenarioId);
        List<ScenarioRankingResponse.Ranking> rankings = scenarioRankingsFor(scenario).stream()
                .sorted(Comparator.comparingInt(ScenarioRankingResponse.Ranking::rank))
                .toList();

        return new ScenarioRankingResponse(scenario.id(), rankings);
    }

    public static ReviewListResponse reviewListResponse(long scenarioId) {
        ScenarioFixture scenario = scenario(scenarioId);
        List<ReviewListResponse.Item> items = scenario.reviews().stream()
                .sorted(Comparator.comparing(ReviewFixture::createdAt).reversed())
                .map(r -> new ReviewListResponse.Item(
                        r.reviewId(),
                        r.userId(),
                        nicknameOf(r.userId()),
                        r.rating(),
                        r.difficulty(),
                        r.content(),
                        r.isSpoiler(),
                        r.createdAt()
                ))
                .toList();

        return new ReviewListResponse(
                scenario.id(),
                items,
                1,
                items.size(),
                0
        );
    }

    public static GlobalRankingResponse globalRankingResponse() {
        List<GlobalRankingResponse.RankEntry> top10 = USERS.stream()
                .limit(10)
                .map(u -> new GlobalRankingResponse.RankEntry(
                        0,
                        u.id(),
                        u.nickname(),
                        mockGlobalScore(u.id())
                ))
                .sorted(Comparator.comparingLong(GlobalRankingResponse.RankEntry::value).reversed())
                .toList();

        List<GlobalRankingResponse.RankEntry> ranked = rankize(top10);
        GlobalRankingResponse.RankEntry myRank = ranked.stream()
                .filter(e -> e.userId() == ME_USER_ID)
                .findFirst()
                .orElse(ranked.getFirst());

        return new GlobalRankingResponse("SCORE", ranked, myRank);
    }

    public static Optional<ClueFixture> findClue(long scenarioId, long clueId) {
        return scenario(scenarioId).clues().stream()
                .filter(c -> c.id() == clueId)
                .findFirst();
    }

    public static Optional<RoomFixture> findRoomByFloor(long scenarioId, int floorNumber) {
        return scenario(scenarioId).rooms().stream()
                .filter(r -> r.floorNumber() == floorNumber)
                .findFirst();
    }

    public static Optional<SuspectFixture> findSuspect(long scenarioId, long suspectId) {
        return scenario(scenarioId).suspects().stream()
                .filter(s -> s.id() == suspectId)
                .findFirst();
    }

    public static int maxFloor(long scenarioId) {
        return scenario(scenarioId).rooms().stream()
                .mapToInt(RoomFixture::floorNumber)
                .max()
                .orElse(1);
    }

    public static Set<Integer> floors(long scenarioId) {
        return scenario(scenarioId).rooms().stream()
                .map(RoomFixture::floorNumber)
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
    }

    public static long pickDefaultWeaponClue(long scenarioId) {
        return scenario(scenarioId).truth().weaponClueId();
    }

    public static long pickDefaultCulprit(long scenarioId) {
        return scenario(scenarioId).truth().culpritSuspectId();
    }

    public static TruthFixture truth(long scenarioId) {
        return scenario(scenarioId).truth();
    }

    private static List<ScenarioRankingResponse.Ranking> scenarioRankingsFor(ScenarioFixture scenario) {
        int baseScore = switch ((int) scenario.id()) {
            case 1 -> 980;
            case 2 -> 940;
            case 3 -> 910;
            case 4 -> 960;
            default -> 930;
        };

        record Raw(long userId, String nickname, int score, long clearTime, String rankGrade) {
        }

        List<Raw> sorted = USERS.stream()
                .limit(10)
                .map(u -> new Raw(
                        u.id(),
                        u.nickname(),
                        baseScore - (int) (u.id() * 7),
                        280L + (u.id() * 13),
                        gradeByScore(baseScore - (int) (u.id() * 7))
                ))
                .sorted(Comparator.comparingInt(Raw::score).reversed())
                .toList();

        return java.util.stream.IntStream.range(0, sorted.size())
                .mapToObj(i -> {
                    Raw r = sorted.get(i);
                    return new ScenarioRankingResponse.Ranking(i + 1, r.userId(), r.nickname(), r.score(), r.clearTime(), r.rankGrade());
                })
                .toList();
    }

    private static String gradeByScore(int score) {
        if (score >= 950) return "S";
        if (score >= 900) return "A";
        if (score >= 850) return "B";
        if (score >= 800) return "C";
        if (score >= 750) return "D";
        return "F";
    }

    private static long mockGlobalScore(long userId) {
        return 12_000L - (userId * 733L);
    }

    private static List<GlobalRankingResponse.RankEntry> rankize(List<GlobalRankingResponse.RankEntry> entries) {
        return java.util.stream.IntStream.range(0, entries.size())
                .mapToObj(i -> {
                    GlobalRankingResponse.RankEntry e = entries.get(i);
                    return new GlobalRankingResponse.RankEntry(i + 1, e.userId(), e.nickname(), e.value());
                })
                .toList();
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }

    private static ScenarioFixture scenarioGreenhouse() {
        long scenarioId = 1L;

        List<RoomFixture> rooms = List.of(
                new RoomFixture(
                        121L,
                        1,
                        "LOBBY",
                        "현관 로비",
                        "비가 억수같이 쏟아지는 밤. 젖은 발자국이 로비 바닥에 흩어져 있다.",
                        "발자국의 방향을 따라가면 누군가 급하게 움직인 흔적이 보여요.",
                        roomObjects(Map.of(
                                "spots", List.of(
                                        Map.of("name", "우산꽂이", "hint", "몇 개가 비어 있다"),
                                        Map.of("name", "벽난로", "hint", "재가 아직 따뜻하다"),
                                        Map.of("name", "분전함", "hint", "2층 온실 쪽 라인이 눈에 띈다")
                                )
                        ))
                ),
                new RoomFixture(
                        122L,
                        2,
                        "GREENHOUSE",
                        "유리온실",
                        "난초와 희귀식물이 가득한 온실. 달콤한 향과 함께 어딘가 날카로운 냄새가 섞여 있다.",
                        "향이 너무 강해요. 뭔가를 가리기 위한 연출일 수도 있어요.",
                        roomObjects(Map.of(
                                "spots", List.of(
                                        Map.of("name", "찻잔과 티포트", "hint", "잔 가장자리에 희미한 흰 가루"),
                                        Map.of("name", "비료 보관함", "hint", "찢어진 봉지와 작은 유리병"),
                                        Map.of("name", "CCTV 사각지대", "hint", "유독 어두운 구석")
                                )
                        ))
                ),
                new RoomFixture(
                        123L,
                        3,
                        "STUDY",
                        "서재",
                        "연구 서류와 수상한 계약서가 뒤섞여 있다. 누군가 급히 서랍을 뒤진 흔적이 보인다.",
                        "찢긴 페이지가 있다면, 누군가 ‘지우고 싶은 진실’이 있었겠죠.",
                        roomObjects(Map.of(
                                "spots", List.of(
                                        Map.of("name", "연구 노트", "hint", "페이지가 몇 장 뜯겨 나갔다"),
                                        Map.of("name", "금고", "hint", "비밀번호 흔적이 남아 있다"),
                                        Map.of("name", "서랍", "hint", "잠금장치가 부러져 있다")
                                )
                        ))
                )
        );

        VictimFixture victim = new VictimFixture(
                101L,
                "서진우",
                42,
                "남",
                "식물학자",
                "저택 2층 유리온실",
                "전날 23:00~00:00",
                "청산가리 중독",
                "희귀 난초 연구로 유명한 식물학자. 최근 공동연구 계약을 두고 주변과 마찰이 잦았다.",
                "https://example.com/portraits/victim_greenhouse.jpg"
        );

        List<SuspectFixture> suspects = List.of(
                new SuspectFixture(
                        111L,
                        "윤하린",
                        38,
                        "여",
                        "비서",
                        "약과 일정까지 관리하던 사람",
                        "https://example.com/portraits/suspect_yoonharin.jpg",
                        1,
                        "정확한 말투로 사실만 말하려 든다.",
                        Map.of(
                                133L, "…그 잔은 제가 치운 게 맞아요. 하지만 그 안에 뭐가 들어있었는지는 몰라요.",
                                136L, "연구 노트요? 저는 연구 내용엔 손댄 적 없어요."
                        ),
                        List.of(
                                "저는 그날 밤 1층에서 손님 응대 중이었어요.",
                                "진우 선생님은 요즘 누군가를 심하게 경계했어요.",
                                "온실 열쇠는 경비실에도 예비가 있어요."
                        )
                ),
                new SuspectFixture(
                        112L,
                        "정태오",
                        45,
                        "남",
                        "형사(지인)",
                        "초대받지 않았는데 나타난 형사",
                        "https://example.com/portraits/suspect_jungtaeo.jpg",
                        2,
                        "상대의 반응을 살피며 질문을 되묻는다.",
                        Map.of(
                                132L, "초대장 뒷면? 시간이 적힌 메모라면 알리바이와 바로 연결돼요.",
                                135L, "CCTV가 꺼졌다면 누군가 계획적으로 움직였다는 뜻이죠."
                        ),
                        List.of(
                                "형사라고 해서 다 아는 건 아니에요. 대신 패턴을 봅니다.",
                                "이 집, 밤엔 유독 조용하더군요. 너무 조용해서 수상해요.",
                                "당신이 찾는 건 ‘누가’가 아니라 ‘왜 지금’일지도 몰라요."
                        )
                ),
                new SuspectFixture(
                        113L,
                        "박지수",
                        34,
                        "남",
                        "경비원",
                        "감시카메라가 꺼진 시간대가 있다",
                        "https://example.com/portraits/suspect_parkjisoo.jpg",
                        3,
                        "거칠지만 숨기려는 게 있는 듯하다.",
                        Map.of(
                                135L, "그 스위치는… 점검하다가 내려간 겁니다. 일부러 끈 거 아니에요.",
                                131L, "우산? 비 오면 다들 로비에 두고 가잖아요."
                        ),
                        List.of(
                                "온실 쪽은 자주 경보가 울려서… 솔직히 귀찮았어요.",
                                "난 그날 23시 넘어서 2층을 돌았고, 이상은 없었어요.",
                                "누가 열쇠를 가져갔는지는… 글쎄요."
                        )
                ),
                new SuspectFixture(
                        114L,
                        "최미선",
                        40,
                        "여",
                        "공동연구자",
                        "연구 결과를 빼앗겼다고 말한다",
                        "https://example.com/portraits/suspect_choimisun.jpg",
                        4,
                        "차분하지만 질문이 깊어지면 흔들린다.",
                        Map.of(
                                133L, "아몬드 향이라니… 그건 흔한 향이 아니에요. 누가 그런 짓을 했을까요?",
                                136L, "찢긴 페이지가 있다면, 진실이 지워진 거겠죠. 누군가에게 불리한."
                        ),
                        List.of(
                                "계약 문제로 다퉜던 건 사실이에요. 하지만 살인은 아니죠.",
                                "온실의 차는… 진우가 좋아하던 취미였어요.",
                                "사람은 결과를 위해 어디까지 갈 수 있을까요?"
                        )
                )
        );

        List<ClueFixture> clues = List.of(
                new ClueFixture(
                        131L,
                        121L,
                        1,
                        "젖은 우산",
                        "LOW",
                        "우산 끝이 흙투성이로 젖어 있다. 로비 바닥에 남은 발자국과 흙 색이 닮았다.",
                        "https://example.com/clues/umbrella.jpg",
                        "흙이 온실 화분의 흙과 비슷해 보여요. 누군가 온실을 다녀온 흔적일 수 있어요."
                ),
                new ClueFixture(
                        132L,
                        121L,
                        1,
                        "초대장 뒷면의 낙서",
                        "MEDIUM",
                        "연필로 눌러쓴 자국이 남아 있다. '00:15'라는 숫자가 희미하게 보인다.",
                        "https://example.com/clues/invitation.jpg",
                        "시간이 특정되면 알리바이도 특정돼요. 00:15에 누가 어디 있었는지요."
                ),
                new ClueFixture(
                        133L,
                        122L,
                        2,
                        "찻잔의 아몬드 향",
                        "CRITICAL",
                        "찻잔 안쪽에 달콤한 아몬드 향이 남아 있다. 약간의 흰 가루도 보인다.",
                        "https://example.com/clues/teacup.jpg",
                        "아몬드 향은 특정 독극물의 특징으로 알려져 있어요. 독살 가능성이 커 보여요."
                ),
                new ClueFixture(
                        134L,
                        122L,
                        2,
                        "분쇄된 비료 봉지",
                        "HIGH",
                        "찢어진 비료 봉지 옆에 작은 유리병이 있다. 라벨은 떼어져 있다.",
                        "https://example.com/clues/fertilizer.jpg",
                        "라벨을 떼었다는 건 ‘정체를 숨기려’ 했다는 뜻일지도요."
                ),
                new ClueFixture(
                        135L,
                        122L,
                        2,
                        "꺼진 CCTV 스위치",
                        "MEDIUM",
                        "분전함 안의 스위치 하나가 내려가 있다. 손때가 묻어 최근에 건드린 듯하다.",
                        "https://example.com/clues/switch.jpg",
                        "우연히 내려간 스위치치곤 너무 ‘딱 그 시간대’예요."
                ),
                new ClueFixture(
                        136L,
                        123L,
                        3,
                        "연구 노트의 찢긴 페이지",
                        "HIGH",
                        "계약 조건과 연구 데이터 일부가 담긴 페이지가 뜯겨 나갔다. 찢긴 조각은 보이지 않는다.",
                        "https://example.com/clues/notepage.jpg",
                        "누군가 ‘증거가 될 문장’만 골라 없앤 느낌이에요."
                ),
                new ClueFixture(
                        137L,
                        123L,
                        3,
                        "부러진 서랍 잠금장치",
                        "LOW",
                        "서랍 잠금장치가 억지로 부러져 있다. 안에는 비어 있는 서류철만 남아 있다.",
                        "https://example.com/clues/drawer.jpg",
                        "훔쳐간 게 ‘돈’이 아니라 ‘서류’라면, 동기가 명확해질 수 있어요."
                )
        );

        TruthFixture truth = new TruthFixture(
                114L,
                133L,
                2,
                "공동연구 계약에서 배제된 분노로 진실을 없애고 성과를 되찾으려 했다.",
                "청산가리 계열 독극물로 독살",
                List.of("청산가리", "독살", "찻잔"),
                List.of("계약", "성과", "복수")
        );

        List<TopRankingFixture> topRankings = List.of(
                new TopRankingFixture(1, 3L, 980, 312L, "S"),
                new TopRankingFixture(2, 7L, 945, 364L, "A"),
                new TopRankingFixture(3, 1L, 932, 401L, "A")
        );

        List<ReviewFixture> reviews = List.of(
                new ReviewFixture(10001L, 2L, 5, 4,
                        "온실 분위기가 진짜 좋고 단서 연결이 깔끔했어요. 마지막 제출할 때 긴장감 있음.",
                        false, BASE_TIME.minusSeconds(3600 * 20L)),
                new ReviewFixture(10002L, 8L, 4, 3,
                        "CCTV 스위치 단서가 힌트로 딱 좋았어요. 다만 동기 설명이 조금 더 있었으면!",
                        false, BASE_TIME.minusSeconds(3600 * 28L)),
                new ReviewFixture(10003L, 12L, 5, 5,
                        "스포일러) 찻잔이 핵심일 줄 알았지만 서류 쪽이 더 중요했네요. 재밌었습니다.",
                        true, BASE_TIME.minusSeconds(3600 * 40L)),
                new ReviewFixture(10004L, 5L, 4, 2,
                        "난이도 적당. 보드 기능으로 정리하면서 하니까 훨씬 쉬움.",
                        false, BASE_TIME.minusSeconds(3600 * 52L)),
                new ReviewFixture(10005L, 10L, 3, 3,
                        "스토리 전개는 좋은데 용의자 대사 분량이 조금 짧게 느껴졌어요.",
                        false, BASE_TIME.minusSeconds(3600 * 70L)),
                new ReviewFixture(10006L, 9L, 5, 4,
                        "추리 게임 좋아하면 무조건 추천. 단서-동기-수단 연결이 탄탄함.",
                        false, BASE_TIME.minusSeconds(3600 * 90L))
        );

        return new ScenarioFixture(
                scenarioId,
                "유리온실의 초대",
                "부유한 식물학자가 자신의 저택 유리온실에서 숨진 채 발견된다. 초대받은 네 명, 그리고 꺼진 CCTV.",
                "미스터리",
                "https://example.com/thumbnails/greenhouse.jpg",
                18324,
                bd("4.6"),
                bd("3.2"),
                "비 내리는 밤, 당신은 저택으로 호출된다. 온실에 남은 달콤한 향—그리고 숨겨진 진실을 찾아라.",
                victim,
                suspects,
                rooms,
                clues,
                truth,
                topRankings,
                reviews
        );
    }

    private static ScenarioFixture scenarioMuseum() {
        long scenarioId = 2L;

        List<RoomFixture> rooms = List.of(
                new RoomFixture(
                        221L,
                        1,
                        "LOBBY",
                        "미술관 로비",
                        "폐관 후인데도 안내 데스크 불빛이 희미하게 남아 있다. 바닥엔 끌린 자국이 보인다.",
                        "끌린 자국이 전시실 방향으로 이어져요. 시신이 옮겨졌을 가능성도 있어요.",
                        roomObjects(Map.of(
                                "spots", List.of(
                                        Map.of("name", "안내 데스크", "hint", "출입 기록지에 빈 칸이 있다"),
                                        Map.of("name", "보안 게이트", "hint", "경보 로그가 삭제됨"),
                                        Map.of("name", "CCTV 모니터", "hint", "22:05 구간만 끊겨 있다")
                                )
                        ))
                ),
                new RoomFixture(
                        222L,
                        2,
                        "EXHIBITION",
                        "고전 조각 전시실",
                        "청동 조각상들이 줄지어 서 있다. 그중 하나의 받침이 유난히 깨끗하다.",
                        "깨끗한 건 누군가 닦았다는 뜻일까요? 피나 지문을 지우려 했을지도요.",
                        roomObjects(Map.of(
                                "spots", List.of(
                                        Map.of("name", "청동 조각상", "hint", "받침 모서리에 미세한 균열"),
                                        Map.of("name", "바닥의 파편", "hint", "유리 조각이 섞여 있다"),
                                        Map.of("name", "작품 설명 패널", "hint", "교체된 나사")
                                )
                        ))
                ),
                new RoomFixture(
                        223L,
                        3,
                        "STORAGE",
                        "수장고",
                        "작품 포장재와 도구들이 가득한 공간. 번호표가 붙은 상자 하나가 비어 있다.",
                        "사라진 건 작품일까요, 아니면 ‘도구’일까요? 목록과 맞춰봐야겠어요.",
                        roomObjects(Map.of(
                                "spots", List.of(
                                        Map.of("name", "포장 상자", "hint", "번호표만 남아 있다"),
                                        Map.of("name", "공구함", "hint", "망치 자리가 비어 있다"),
                                        Map.of("name", "폐기물 봉투", "hint", "유리 파편이 잔뜩")
                                )
                        ))
                )
        );

        VictimFixture victim = new VictimFixture(
                201L,
                "김선영",
                33,
                "여",
                "큐레이터",
                "2층 고전 조각 전시실",
                "당일 21:30~22:00",
                "둔기에 의한 두부 손상",
                "위작 스캔들 의혹을 조사하던 큐레이터. 폐관 후 누군가와 단둘이 만날 예정이었다.",
                "https://example.com/portraits/victim_museum.jpg"
        );

        List<SuspectFixture> suspects = List.of(
                new SuspectFixture(
                        211L,
                        "장도윤",
                        29,
                        "남",
                        "보안요원",
                        "22:05에 CCTV가 끊긴 이유를 모른다고 한다",
                        "https://example.com/portraits/suspect_security.jpg",
                        1,
                        "직업적으로 침착하지만 방어적이다.",
                        Map.of(
                                233L, "그 조각상 받침은 제가 닦지 않았습니다. 전시실 청소는 외주예요.",
                                232L, "출입 기록지요? 그건 매번 인턴이 작성해요."
                        ),
                        List.of(
                                "전 1층에서 순찰 돌고 있었어요. 경보가 울린 적은 없었습니다.",
                                "그 시간대에 들어간 사람은… 기록지에 남아야 하는데요.",
                                "CCTV가 끊긴 건 내부 네트워크 문제일 수 있어요."
                        )
                ),
                new SuspectFixture(
                        212L,
                        "서민규",
                        52,
                        "남",
                        "후원자",
                        "전시 취소 소문에 예민하게 반응한다",
                        "https://example.com/portraits/suspect_donor.jpg",
                        2,
                        "권위적인 말투로 상황을 통제하려 한다.",
                        Map.of(
                                236L, "수장고요? 전 그런 음침한 곳엔 안 갑니다. 시간 낭비죠.",
                                231L, "위작이라니… 그건 큐레이터의 오해였을 겁니다."
                        ),
                        List.of(
                                "내 이름이 걸린 전시입니다. 문제가 생기면 곤란해요.",
                                "그날 밤, 선영 씨와 단둘이 이야기한 건 맞습니다.",
                                "협박처럼 들리겠지만… 진실이 항상 좋은 건 아니죠."
                        )
                ),
                new SuspectFixture(
                        213L,
                        "배유진",
                        36,
                        "여",
                        "작가",
                        "작품 설치 이후로 수장고 출입이 잦았다",
                        "https://example.com/portraits/suspect_artist.jpg",
                        3,
                        "감정적이지만 핵심을 찌르는 말을 한다.",
                        Map.of(
                                234L, "유리 파편이요? 제 작품 일부가 깨진 건 사실이에요. 하지만 사람을 해치진 않았어요.",
                                233L, "받침 균열… 그럼 ‘그걸’ 들었다는 뜻인데."
                        ),
                        List.of(
                                "전시가 취소되면 전 끝이에요. 하지만 살인은… 아니에요.",
                                "선영 씨는 마지막에 누군가를 만나러 간다고 했어요.",
                                "후원자와 말다툼하는 걸 봤어요. 분위기가 살벌했죠."
                        )
                ),
                new SuspectFixture(
                        214L,
                        "이정호",
                        23,
                        "남",
                        "인턴",
                        "기록지 작성 담당인데 글씨가 어설프다",
                        "https://example.com/portraits/suspect_intern.jpg",
                        4,
                        "긴장하면 말을 더듬고 자주 변명한다.",
                        Map.of(
                                232L, "기록지… 제가 썼어요. 근데… 그 시간대는 잘 기억이 안 나서요.",
                                235L, "공구함? 전 건드린 적 없어요. 진짜예요."
                        ),
                        List.of(
                                "전시실엔 21시 전에 마지막으로 들어갔어요.",
                                "누가 제 자리에 앉아 있던 것 같았는데… 착각이었을까요?",
                                "그날 CCTV가 끊겼다는 건 저도 지금 알았어요."
                        )
                )
        );

        List<ClueFixture> clues = List.of(
                new ClueFixture(
                        231L,
                        221L,
                        1,
                        "찢긴 계약서 사본",
                        "HIGH",
                        "후원 계약서의 일부가 찢겨 있다. '위작'이라는 단어가 포함된 조항이 강조돼 있다.",
                        "https://example.com/clues/contract.jpg",
                        "누군가 계약 조건을 숨기고 싶었던 걸까요?"
                ),
                new ClueFixture(
                        232L,
                        221L,
                        1,
                        "출입 기록지의 빈 칸",
                        "MEDIUM",
                        "22:00~22:10 구간이 비어 있다. 다른 칸과 필체가 미묘하게 다르다.",
                        "https://example.com/clues/logbook.jpg",
                        "누락은 실수일 수도, 의도일 수도 있어요. ‘누가 그 시간대에 있었는지’가 중요해요."
                ),
                new ClueFixture(
                        233L,
                        222L,
                        2,
                        "깨끗한 청동 받침",
                        "CRITICAL",
                        "피가 묻었을 법한 받침이 유독 깨끗하다. 모서리에 미세한 균열과 손자국이 남아 있다.",
                        "https://example.com/clues/pedestal.jpg",
                        "지워진 흔적은 곧 있었던 흔적이에요. 둔기로 쓰였을 가능성이 커 보여요."
                ),
                new ClueFixture(
                        234L,
                        222L,
                        2,
                        "바닥의 유리 파편",
                        "LOW",
                        "전시실 한쪽에 유리 파편이 모여 있다. 깨진 액자 조각으로 보인다.",
                        "https://example.com/clues/glass.jpg",
                        "사건을 숨기기 위해 일부러 깨뜨렸을 수도 있어요."
                ),
                new ClueFixture(
                        235L,
                        223L,
                        3,
                        "공구함의 빈 자리",
                        "HIGH",
                        "공구함에서 망치 자리가 비어 있다. 최근에 꺼낸 듯한 먼지 패턴이 보인다.",
                        "https://example.com/clues/toolbox.jpg",
                        "흉기 후보예요. 누가 공구함에 접근할 수 있었을까요?"
                ),
                new ClueFixture(
                        236L,
                        223L,
                        3,
                        "빈 포장 상자",
                        "MEDIUM",
                        "번호표가 붙은 상자가 비어 있다. 내부에 검은 천 조각이 남아 있다.",
                        "https://example.com/clues/box.jpg",
                        "사라진 물건이 무엇인지 알면 동기도 드러날 거예요."
                ),
                new ClueFixture(
                        237L,
                        223L,
                        3,
                        "삭제된 경보 로그",
                        "MEDIUM",
                        "보안 시스템에서 특정 시간대 로그가 삭제되어 있다. 수동 삭제 흔적이 남아 있다.",
                        "https://example.com/clues/alarm.jpg",
                        "기술에 익숙한 사람이 손댄 것 같아요. 보안요원? 아니면 내부자?"
                )
        );

        TruthFixture truth = new TruthFixture(
                212L,
                233L,
                2,
                "위작 스캔들이 터지면 모든 후원이 무너진다. 그는 이를 막기 위해 큐레이터를 침묵시켰다.",
                "청동 받침으로 가격해 살해",
                List.of("받침", "가격", "둔기"),
                List.of("위작", "스캔들", "후원")
        );

        List<TopRankingFixture> topRankings = List.of(
                new TopRankingFixture(1, 6L, 948, 329L, "A"),
                new TopRankingFixture(2, 4L, 922, 358L, "A"),
                new TopRankingFixture(3, 1L, 910, 390L, "A")
        );

        List<ReviewFixture> reviews = List.of(
                new ReviewFixture(20001L, 7L, 5, 4,
                        "전시실 오브젝트가 잘 구성돼 있어서 탐색하는 재미가 컸어요.",
                        false, BASE_TIME.minusSeconds(3600 * 22L)),
                new ReviewFixture(20002L, 11L, 4, 4,
                        "계약서 단서가 핵심이네요. 마지막에 딱 맞춰서 풀었습니다.",
                        false, BASE_TIME.minusSeconds(3600 * 35L)),
                new ReviewFixture(20003L, 12L, 5, 5,
                        "스포일러) 후원자 쪽이 너무 수상했는데도 속아 넘어갈 뻔…",
                        true, BASE_TIME.minusSeconds(3600 * 41L)),
                new ReviewFixture(20004L, 9L, 4, 3,
                        "난이도 중상. 기록지 필체 디테일 좋았어요.",
                        false, BASE_TIME.minusSeconds(3600 * 58L)),
                new ReviewFixture(20005L, 3L, 5, 4,
                        "보드로 연결하면서 하니까 단서 정리가 잘 됨!",
                        false, BASE_TIME.minusSeconds(3600 * 66L))
        );

        return new ScenarioFixture(
                scenarioId,
                "한밤의 전시관",
                "폐관 후 미술관에서 큐레이터가 쓰러진다. 끊긴 CCTV, 빈 기록지, 그리고 지워진 계약 조항.",
                "스릴러",
                "https://example.com/thumbnails/museum.jpg",
                12107,
                bd("4.4"),
                bd("3.8"),
                "문이 잠긴 미술관. 진실은 작품처럼 가려져 있다. 당신은 ‘지워진 흔적’을 복원해야 한다.",
                victim,
                suspects,
                rooms,
                clues,
                truth,
                topRankings,
                reviews
        );
    }

    private static ScenarioFixture scenarioTrain() {
        long scenarioId = 3L;

        List<RoomFixture> rooms = List.of(
                new RoomFixture(
                        321L,
                        1,
                        "ENGINE",
                        "기관사실",
                        "폭우로 열차가 긴급 정차했다. 기관사실엔 젖은 장갑 한 짝이 놓여 있다.",
                        "장갑은 누군가가 비를 맞으며 이동했다는 뜻일 수 있어요.",
                        roomObjects(Map.of(
                                "spots", List.of(
                                        Map.of("name", "운행 기록기", "hint", "정차 사유가 수정됨"),
                                        Map.of("name", "무전기", "hint", "기록이 지워짐"),
                                        Map.of("name", "젖은 장갑", "hint", "왼손용")
                                )
                        ))
                ),
                new RoomFixture(
                        322L,
                        2,
                        "DINING",
                        "식당칸",
                        "따뜻한 커피 냄새가 남아 있다. 누군가 급히 뛰쳐나간 듯 의자가 넘어져 있다.",
                        "사라진 사람은 누구와 마지막으로 마주쳤을까요? 식당칸이 힌트예요.",
                        roomObjects(Map.of(
                                "spots", List.of(
                                        Map.of("name", "영수증 더미", "hint", "한 건이 찢겨 있다"),
                                        Map.of("name", "커피잔", "hint", "입술 자국이 두 개"),
                                        Map.of("name", "넘어진 의자", "hint", "바닥에 긁힌 자국")
                                )
                        ))
                ),
                new RoomFixture(
                        323L,
                        3,
                        "CAR_7",
                        "7호차 객실",
                        "승객들의 짐이 그대로 남아 있다. 창문 잠금장치가 느슨하다.",
                        "창문이 열렸다면… 바깥의 폭우와 바람이 모든 걸 바꿨겠죠.",
                        roomObjects(Map.of(
                                "spots", List.of(
                                        Map.of("name", "창문 잠금장치", "hint", "나사가 빠짐"),
                                        Map.of("name", "찢긴 신문", "hint", "기사 일부가 사라짐"),
                                        Map.of("name", "짐칸 문", "hint", "발로 찬 흔적")
                                )
                        ))
                ),
                new RoomFixture(
                        324L,
                        4,
                        "LUGGAGE",
                        "짐칸",
                        "어두운 짐칸. 물이 스며든 바닥에 끌린 자국이 선명하다.",
                        "끌린 자국은 ‘혼자 움직이지 못했던 누군가’를 암시해요.",
                        roomObjects(Map.of(
                                "spots", List.of(
                                        Map.of("name", "연결 통로", "hint", "볼트가 풀려 있다"),
                                        Map.of("name", "로프", "hint", "끝이 젖어 있다"),
                                        Map.of("name", "바닥 자국", "hint", "무거운 짐이 끌린 흔적")
                                )
                        ))
                )
        );

        VictimFixture victim = new VictimFixture(
                301L,
                "이도현",
                29,
                "남",
                "기자",
                "열차 외부 선로 인근(다음 역 진입 전)",
                "당일 23:10~23:40",
                "추락사",
                "사회면 단독을 노리던 기자. 익명 제보를 받았고, 열차에서 누군가를 만나기로 했다.",
                "https://example.com/portraits/victim_train.jpg"
        );

        List<SuspectFixture> suspects = List.of(
                new SuspectFixture(
                        311L,
                        "강세진",
                        41,
                        "여",
                        "기관사",
                        "정차 사유를 설명하는 말이 바뀐다",
                        "https://example.com/portraits/suspect_driver.jpg",
                        1,
                        "일을 우선시하지만 거짓말엔 서툴다.",
                        Map.of(
                                331L, "운행 기록기요? 그건 시스템이 자동으로 남기는 거라 제가 건드릴 수 없어요.",
                                336L, "연결 볼트? 점검 대상이긴 합니다만…"
                        ),
                        List.of(
                                "정차는 안전 때문이었어요. 폭우가 심했으니까요.",
                                "7호차 쪽에서 소란이 있었다는 건 들었습니다.",
                                "누가 통로로 나갔는지는… 어두워서 잘."
                        )
                ),
                new SuspectFixture(
                        312L,
                        "문태경",
                        35,
                        "남",
                        "차장",
                        "승객 리스트가 일부 누락되어 있다",
                        "https://example.com/portraits/suspect_conductor.jpg",
                        2,
                        "규정을 강조하지만 본인은 예외를 만든다.",
                        Map.of(
                                333L, "승객 리스트가 누락? 그럴 리가… 제가 확인했는데요.",
                                334L, "창문 잠금 나사요? 정차 중에 누가 열었을 수도 있겠네요."
                        ),
                        List.of(
                                "승객 안전이 최우선입니다. 그게 제 일이고요.",
                                "기자? 그런 직업 가진 승객은 기억에 없는데…",
                                "정차 중 이동은 금지였어요. 다들 알고 있었을 텐데."
                        )
                ),
                new SuspectFixture(
                        313L,
                        "하윤서",
                        27,
                        "여",
                        "카페 직원",
                        "커피잔에 두 사람의 흔적이 남아 있다",
                        "https://example.com/portraits/suspect_cafe.jpg",
                        3,
                        "친절하지만 정보를 흘리듯 말한다.",
                        Map.of(
                                332L, "입술 자국이 두 개요? 그럼 두 분이 같이 있었겠네요.",
                                337L, "로프는 짐칸에서만 쓰는데… 누가 가져갔을까요?"
                        ),
                        List.of(
                                "정차 직전에 7호차 쪽에서 주문이 들어왔어요.",
                                "그 남자… 기자라고 했던 것 같아요. 전화 통화도 길게 했고요.",
                                "폭우 때문에 문이 잘 안 닫혔던 적이 있어요."
                        )
                ),
                new SuspectFixture(
                        314L,
                        "조현우",
                        33,
                        "남",
                        "승객(투자자)",
                        "익명 제보와 관련된 인물로 보인다",
                        "https://example.com/portraits/suspect_investor.jpg",
                        4,
                        "말을 아끼고 질문을 되받아친다.",
                        Map.of(
                                335L, "찢긴 신문? 전 그런 걸 읽을 시간이 없었어요.",
                                332L, "커피잔? 전 커피 안 마십니다."
                        ),
                        List.of(
                                "전 그냥 이동 중이었습니다. 제보니 뭐니, 몰라요.",
                                "기자랑 만난 적 없습니다.",
                                "불필요한 오해는 피하고 싶군요."
                        )
                ),
                new SuspectFixture(
                        315L,
                        "서유라",
                        31,
                        "여",
                        "승객(의사)",
                        "초동 대응을 했다고 주장한다",
                        "https://example.com/portraits/suspect_doctor.jpg",
                        5,
                        "분석적으로 말하지만, 감정이 새어 나온다.",
                        Map.of(
                                338L, "끌린 자국이 있었다면… 그건 이미 의식이 없었을 수도 있겠네요.",
                                334L, "창문이 열렸다면 저체온이 먼저 왔을 거예요."
                        ),
                        List.of(
                                "전 발견 당시 사람을 보지 못했어요. 모두 공포에 휩싸였고요.",
                                "정차 중 누군가 밖으로 나가는 건 위험합니다.",
                                "한 가지 확실한 건… ‘우연’은 아니었다는 거예요."
                        )
                )
        );

        List<ClueFixture> clues = List.of(
                new ClueFixture(
                        331L,
                        321L,
                        1,
                        "수정된 운행 기록",
                        "HIGH",
                        "운행 기록기에서 정차 사유가 여러 번 수정된 흔적이 있다.",
                        "https://example.com/clues/train_log.jpg",
                        "정차가 ‘우연’이 아니었을 가능성이 있어요."
                ),
                new ClueFixture(
                        332L,
                        322L,
                        2,
                        "입술 자국이 두 개인 커피잔",
                        "MEDIUM",
                        "같은 잔에 서로 다른 립스틱/입술 자국이 겹쳐 있다.",
                        "https://example.com/clues/coffee.jpg",
                        "마지막 동행자가 있었다는 뜻이에요. 누굴까요?"
                ),
                new ClueFixture(
                        333L,
                        322L,
                        2,
                        "찢긴 영수증 조각",
                        "LOW",
                        "영수증 하단이 찢겨 있다. 카드 승인 번호 일부가 남아 있다.",
                        "https://example.com/clues/receipt.jpg",
                        "승인 번호로 시간을 역추적할 수 있겠어요."
                ),
                new ClueFixture(
                        334L,
                        323L,
                        3,
                        "느슨한 창문 잠금장치",
                        "HIGH",
                        "나사가 빠져 창문이 쉽게 열릴 상태다. 금속 표면에 장갑 섬유가 묻어 있다.",
                        "https://example.com/clues/window.jpg",
                        "누군가 의도적으로 열 수 있게 만들어뒀어요."
                ),
                new ClueFixture(
                        335L,
                        323L,
                        3,
                        "찢긴 신문 기사",
                        "MEDIUM",
                        "특정 기업 이름이 적힌 부분만 찢겨 나갔다.",
                        "https://example.com/clues/newspaper.jpg",
                        "숨기고 싶은 이름이 있다면, 동기도 따라오죠."
                ),
                new ClueFixture(
                        336L,
                        324L,
                        4,
                        "풀린 연결 통로 볼트",
                        "CRITICAL",
                        "연결 통로의 볼트가 풀려 있다. 급히 조립한 듯 나사산이 망가졌다.",
                        "https://example.com/clues/bolt.jpg",
                        "사람이 미끄러지거나 떨어지도록 만든 장치일 수 있어요."
                ),
                new ClueFixture(
                        337L,
                        324L,
                        4,
                        "젖은 로프",
                        "MEDIUM",
                        "로프 끝부분이 특히 젖어 있고, 진흙이 묻어 있다.",
                        "https://example.com/clues/rope.jpg",
                        "밖으로 끌어냈거나, 무언가를 묶어 옮긴 흔적일 수 있어요."
                ),
                new ClueFixture(
                        338L,
                        324L,
                        4,
                        "바닥의 끌린 자국",
                        "LOW",
                        "무거운 짐이 끌린 듯한 자국이 일정한 방향으로 이어진다.",
                        "https://example.com/clues/drag.jpg",
                        "사건이 한 곳에서만 일어나지 않았다는 뜻이에요."
                )
        );

        TruthFixture truth = new TruthFixture(
                314L,
                336L,
                4,
                "기자가 쥔 제보를 막기 위해 열차를 ‘통제’하려 했다. 그는 추락을 사고로 꾸몄다.",
                "연결 통로 볼트를 풀어 추락 유도",
                List.of("볼트", "추락", "통로"),
                List.of("제보", "은폐", "협박")
        );

        List<TopRankingFixture> topRankings = List.of(
                new TopRankingFixture(1, 9L, 918, 412L, "A"),
                new TopRankingFixture(2, 3L, 904, 438L, "A"),
                new TopRankingFixture(3, 1L, 892, 470L, "B")
        );

        List<ReviewFixture> reviews = List.of(
                new ReviewFixture(30001L, 4L, 5, 5,
                        "긴장감 최고… 이동(층/칸) 구조가 신선해요.",
                        false, BASE_TIME.minusSeconds(3600 * 25L)),
                new ReviewFixture(30002L, 2L, 4, 4,
                        "연결 통로 볼트 단서 발견하고 소름.",
                        false, BASE_TIME.minusSeconds(3600 * 33L)),
                new ReviewFixture(30003L, 12L, 5, 5,
                        "스포일러) 범인이 진짜 끝까지 뻔뻔해서 더 열받고 재밌음.",
                        true, BASE_TIME.minusSeconds(3600 * 45L)),
                new ReviewFixture(30004L, 8L, 4, 4,
                        "대화에서 힌트를 조금만 더 주면 더 좋을 듯!",
                        false, BASE_TIME.minusSeconds(3600 * 60L)),
                new ReviewFixture(30005L, 11L, 5, 5,
                        "난이도 높지만 납득감 있음. 추천.",
                        false, BASE_TIME.minusSeconds(3600 * 78L))
        );

        return new ScenarioFixture(
                scenarioId,
                "비 오는 날의 7호차",
                "폭우로 정차한 열차. 7호차에서 사라진 기자, 풀린 볼트, 그리고 지워진 기록.",
                "추리",
                "https://example.com/thumbnails/train.jpg",
                8421,
                bd("4.7"),
                bd("4.2"),
                "열차는 멈췄지만 사건은 달린다. 좁은 칸과 어두운 짐칸에서 진실을 찾아라.",
                victim,
                suspects,
                rooms,
                clues,
                truth,
                topRankings,
                reviews
        );
    }

    private static ScenarioFixture scenarioResort() {
        long scenarioId = 4L;

        List<RoomFixture> rooms = List.of(
                new RoomFixture(
                        421L,
                        1,
                        "POOL",
                        "풀사이드",
                        "새벽의 수영장. 물 위로 반짝이는 액세서리 하나가 떠 있다.",
                        "물은 기억을 지우지만, 떠오르는 물건은 기억을 되살려요.",
                        roomObjects(Map.of(
                                "spots", List.of(
                                        Map.of("name", "수영장 배수구", "hint", "평소보다 잠겨 있다"),
                                        Map.of("name", "바 타월", "hint", "향이 강한 세제가 묻음"),
                                        Map.of("name", "구명튜브", "hint", "끈이 끊겨 있다")
                                )
                        ))
                ),
                new RoomFixture(
                        422L,
                        2,
                        "SUITE",
                        "스위트룸",
                        "젖은 발자국이 욕실에서 침실까지 이어진다. 향수 냄새가 과하게 남아 있다.",
                        "향수로 냄새를 덮은 걸까요? 약물 냄새를 숨기려 했을지도요.",
                        roomObjects(Map.of(
                                "spots", List.of(
                                        Map.of("name", "욕실 약장", "hint", "수면제 한 통이 비어 있음"),
                                        Map.of("name", "침대 옆 협탁", "hint", "깨진 스마트워치"),
                                        Map.of("name", "미니바", "hint", "컵 두 개, 얼음이 녹음")
                                )
                        ))
                ),
                new RoomFixture(
                        423L,
                        3,
                        "OFFICE",
                        "관리동",
                        "리조트 운영 서류가 쌓여 있다. ‘협찬 계약’ 파일에 포스트잇이 잔뜩 붙어 있다.",
                        "돈이 오가는 곳엔 거짓말이 따라오죠. 계약서를 봐요.",
                        roomObjects(Map.of(
                                "spots", List.of(
                                        Map.of("name", "협찬 계약서", "hint", "위약금 조항이 강조됨"),
                                        Map.of("name", "CCTV 보관함", "hint", "USB 하나가 사라짐"),
                                        Map.of("name", "열쇠 꾸러미", "hint", "스위트룸 키가 반납되지 않음")
                                )
                        ))
                )
        );

        VictimFixture victim = new VictimFixture(
                401L,
                "오세라",
                26,
                "여",
                "여행 인플루언서",
                "리조트 풀사이드",
                "당일 02:10~03:00",
                "익사(약물 가능)",
                "협찬 문제로 리조트 측과 갈등이 있었다. 전날 밤 파티 이후 홀로 돌아간 것으로 알려졌다.",
                "https://example.com/portraits/victim_resort.jpg"
        );

        List<SuspectFixture> suspects = List.of(
                new SuspectFixture(
                        411L,
                        "장민아",
                        27,
                        "여",
                        "매니저",
                        "피해자의 스케줄과 약을 챙겼다",
                        "https://example.com/portraits/suspect_manager.jpg",
                        1,
                        "감정이 앞서지만 사실을 숨기진 못한다.",
                        Map.of(
                                432L, "스마트워치? 그거… 어제 밤에 깨졌어요. 스트랩이 끊어져서.",
                                431L, "배수구는 평소에도 잠가요. 안전 때문에요."
                        ),
                        List.of(
                                "세라는 요즘 너무 지쳐 있었어요. 잠도 제대로 못 자고…",
                                "파티 이후에 대표랑 말다툼했어요. 제가 말렸는데.",
                                "수면제는… 처방받은 거였어요. 다만 누가 가져갔는지는 몰라요."
                        )
                ),
                new SuspectFixture(
                        412L,
                        "문기석",
                        44,
                        "남",
                        "리조트 대표",
                        "협찬 계약 때문에 위약금이 걸려 있다",
                        "https://example.com/portraits/suspect_ceo.jpg",
                        2,
                        "차분하게 말하지만 계산적이다.",
                        Map.of(
                                433L, "계약서요? 그건 비즈니스일 뿐입니다. 감정과는 무관해요.",
                                434L, "USB가 사라졌다고요? 그건 직원 관리 문제죠."
                        ),
                        List.of(
                                "리조트 이미지는 중요합니다. 허위 폭로는 용납 못 해요.",
                                "그날 밤, 저는 관리동에 있었어요. 직원들과 회의 중이었습니다.",
                                "세라 씨가 위험해 보였다는 건… 아무도 말해주지 않았군요."
                        )
                ),
                new SuspectFixture(
                        413L,
                        "최라희",
                        25,
                        "여",
                        "라이벌 인플루언서",
                        "파티에서 공개적으로 다퉜다",
                        "https://example.com/portraits/suspect_rival.jpg",
                        3,
                        "도발적이지만 결정적 순간엔 움찔한다.",
                        Map.of(
                                432L, "워치가 깨졌으면 물에 빠질 때 더 위험했겠네요. 근데 그게 왜 저랑 관련이죠?",
                                435L, "스위트룸 키요? 전 거기 들어간 적 없어요."
                        ),
                        List.of(
                                "우린 경쟁했어요. 그래도 죽길 바라진 않았죠.",
                                "세라는 협찬 폭로를 준비 중이었어요. 다들 알고 있었잖아요.",
                                "전 풀사이드에서 사진 찍고 있었어요. 증거? 업로드 로그 보면 되죠."
                        )
                ),
                new SuspectFixture(
                        414L,
                        "한준",
                        31,
                        "남",
                        "바텐더",
                        "강한 향의 세제를 쓰는 사람이었다",
                        "https://example.com/portraits/suspect_bartender.jpg",
                        4,
                        "친절하지만 슬쩍 말을 빼는 습관이 있다.",
                        Map.of(
                                431L, "배수구 잠금은 제가 한 게 맞아요. 밤에 안전 문제 때문에요.",
                                436L, "컵 두 개요? 파티 때야 다들 같이 마시니까요."
                        ),
                        List.of(
                                "세라 씨는 마지막에 ‘잠깐 물 좀 마시고 갈게요’라고 했어요.",
                                "강한 향? 청소팀에서 쓰는 걸 제가 가져온 적은 있어요. 얼룩 지우려고.",
                                "저는 그날 새벽까지 바 정리하고 있었어요."
                        )
                )
        );

        List<ClueFixture> clues = List.of(
                new ClueFixture(
                        431L,
                        421L,
                        1,
                        "잠긴 배수구",
                        "MEDIUM",
                        "평소보다 단단히 잠긴 배수구. 내부에 끈 조각이 걸려 있다.",
                        "https://example.com/clues/drain.jpg",
                        "누군가 ‘흐름’을 막아 시간을 벌었을지도 몰라요."
                ),
                new ClueFixture(
                        432L,
                        422L,
                        2,
                        "깨진 스마트워치",
                        "HIGH",
                        "스트랩이 끊어져 있다. 시간 기록이 02:37에서 멈춰 있다.",
                        "https://example.com/clues/watch.jpg",
                        "멈춘 시간이 사건의 핵심일 수 있어요."
                ),
                new ClueFixture(
                        433L,
                        423L,
                        3,
                        "협찬 계약서",
                        "HIGH",
                        "위약금 조항이 굵게 표시돼 있다. ‘부정적 게시물’에 대한 조항이 과도하다.",
                        "https://example.com/clues/sponsor.jpg",
                        "돈이 동기라면, 위약금은 충분히 살인의 이유가 될 수 있어요."
                ),
                new ClueFixture(
                        434L,
                        423L,
                        3,
                        "사라진 USB",
                        "MEDIUM",
                        "CCTV 백업 USB가 있던 자리가 비어 있다. 보관함 문에 지문 자국이 남아 있다.",
                        "https://example.com/clues/usb.jpg",
                        "지워진 영상은 가장 큰 증거일 수 있죠."
                ),
                new ClueFixture(
                        435L,
                        423L,
                        3,
                        "반납되지 않은 키",
                        "LOW",
                        "스위트룸 키 카드가 하나 부족하다. 마지막 기록이 새벽 02:20.",
                        "https://example.com/clues/keycard.jpg",
                        "누군가 방을 드나들었을 가능성이 있어요."
                ),
                new ClueFixture(
                        436L,
                        422L,
                        2,
                        "미니바의 컵 두 개",
                        "LOW",
                        "컵 두 개가 놓여 있고 얼음은 거의 녹아 있다. 한 컵에서 약한 쓴맛이 난다.",
                        "https://example.com/clues/cups.jpg",
                        "음료에 뭔가를 섞었을지도요."
                ),
                new ClueFixture(
                        437L,
                        422L,
                        2,
                        "비어 있는 수면제 통",
                        "CRITICAL",
                        "처방 라벨이 붙은 수면제 통이 비어 있다. 알약 부스러기가 남아 있다.",
                        "https://example.com/clues/pills.jpg",
                        "약물이 개입되면 ‘사고’처럼 꾸미기 쉬워져요."
                )
        );

        TruthFixture truth = new TruthFixture(
                412L,
                437L,
                1,
                "협찬 폭로를 막기 위해 약물을 써서 판단력을 흐리고 사고처럼 꾸몄다.",
                "수면제 투여 후 익사 유도",
                List.of("수면제", "약물", "익사"),
                List.of("협찬", "위약금", "폭로")
        );

        List<TopRankingFixture> topRankings = List.of(
                new TopRankingFixture(1, 7L, 962, 301L, "S"),
                new TopRankingFixture(2, 1L, 938, 332L, "A"),
                new TopRankingFixture(3, 10L, 905, 370L, "A")
        );

        List<ReviewFixture> reviews = List.of(
                new ReviewFixture(40001L, 5L, 4, 3,
                        "배수구/키카드 단서 연결이 좋아요. 분위기 굿.",
                        false, BASE_TIME.minusSeconds(3600 * 18L)),
                new ReviewFixture(40002L, 8L, 5, 4,
                        "약물 쪽으로 의심하면서 풀었는데 딱 맞았어요.",
                        false, BASE_TIME.minusSeconds(3600 * 27L)),
                new ReviewFixture(40003L, 12L, 5, 4,
                        "스포일러) 대표가 너무 냉정해서 더 무서웠음…",
                        true, BASE_TIME.minusSeconds(3600 * 37L)),
                new ReviewFixture(40004L, 2L, 4, 3,
                        "대화 힌트가 조금만 더 있으면 더 좋을 듯!",
                        false, BASE_TIME.minusSeconds(3600 * 48L)),
                new ReviewFixture(40005L, 9L, 5, 4,
                        "보드에 연결하면서 하니까 진짜 탐정 느낌 나요.",
                        false, BASE_TIME.minusSeconds(3600 * 62L))
        );

        return new ScenarioFixture(
                scenarioId,
                "파도 위의 알리바이",
                "리조트 풀사이드에서 인플루언서가 숨진 채 발견된다. 사라진 USB, 비어 있는 수면제, 그리고 위약금.",
                "서스펜스",
                "https://example.com/thumbnails/resort.jpg",
                15602,
                bd("4.3"),
                bd("3.5"),
                "새벽의 수영장. 파도 소리 사이로 거짓말이 밀려온다. 당신의 질문이 알리바이를 무너뜨릴 것이다.",
                victim,
                suspects,
                rooms,
                clues,
                truth,
                topRankings,
                reviews
        );
    }

    private static ScenarioFixture scenarioLibrary() {
        long scenarioId = 5L;

        List<RoomFixture> rooms = List.of(
                new RoomFixture(
                        521L,
                        1,
                        "ENTRANCE",
                        "도서관 입구",
                        "폐관 안내 방송이 끝났지만, 입구 쪽엔 잉크 냄새가 유난히 강하다.",
                        "잉크 냄새는 문서 조작이나 위조를 떠올리게 해요.",
                        roomObjects(Map.of(
                                "spots", List.of(
                                        Map.of("name", "대출 반납함", "hint", "반납 기록이 비어 있다"),
                                        Map.of("name", "경비 일지", "hint", "23:20에 빈 줄"),
                                        Map.of("name", "잉크 얼룩", "hint", "바닥에 마르지 않음")
                                )
                        ))
                ),
                new RoomFixture(
                        522L,
                        2,
                        "ARCHIVE",
                        "고문서 보관실",
                        "잠금문이 반쯤 열려 있다. 보관함 하나가 비어 있고, 손에 묻을 만큼 잉크가 묻어 있다.",
                        "누군가 급히 꺼내고, 급히 지운 흔적이에요. ‘무슨 문서’를요.",
                        roomObjects(Map.of(
                                "spots", List.of(
                                        Map.of("name", "잠금문", "hint", "열쇠 대신 카드로 열림"),
                                        Map.of("name", "빈 보관함", "hint", "라벨만 남아 있음"),
                                        Map.of("name", "세척용 알코올", "hint", "뚜껑이 열려 있음")
                                )
                        ))
                ),
                new RoomFixture(
                        523L,
                        3,
                        "STACKS",
                        "3층 서가",
                        "가장 안쪽 서가에서 시신이 발견됐다. 바닥엔 송곳 같은 날카로운 도구가 굴러다닌다.",
                        "흉기가 현장에 남았다면, 급박했던 상황일 가능성이 커요.",
                        roomObjects(Map.of(
                                "spots", List.of(
                                        Map.of("name", "날카로운 도구", "hint", "손잡이에 잉크가 묻음"),
                                        Map.of("name", "찢긴 메모", "hint", "서명 위치 표시"),
                                        Map.of("name", "서가 틈", "hint", "검은 장갑 조각")
                                )
                        ))
                )
        );

        VictimFixture victim = new VictimFixture(
                501L,
                "백정훈",
                51,
                "남",
                "사서",
                "3층 서가 안쪽",
                "당일 22:40~23:20",
                "경부 자상",
                "도서관의 비밀 보관 문서를 관리하던 사서. 최근 ‘기증 문서’의 진위를 두고 마찰이 있었다.",
                "https://example.com/portraits/victim_library.jpg"
        );

        List<SuspectFixture> suspects = List.of(
                new SuspectFixture(
                        511L,
                        "유지한",
                        28,
                        "남",
                        "경비",
                        "일지에 빈 줄이 있다",
                        "https://example.com/portraits/suspect_guard.jpg",
                        1,
                        "규정을 말하지만 그 규정이 빈틈이다.",
                        Map.of(
                                531L, "경비 일지요? 그 시간대는… 교대 중이었습니다.",
                                536L, "장갑 조각이라면… 제 건 아닙니다."
                        ),
                        List.of(
                                "폐관 후 출입은 금지예요. 하지만 예외는 있죠…",
                                "저는 1층에 있었어요. 방송도 제가 했고요.",
                                "그날 알람이 울렸다면 기록에 남았을 텐데요."
                        )
                ),
                new SuspectFixture(
                        512L,
                        "한서아",
                        39,
                        "여",
                        "출판 편집자",
                        "피해자와 기증 문서로 다퉜다",
                        "https://example.com/portraits/suspect_editor.jpg",
                        2,
                        "정중하지만 단어 선택이 날카롭다.",
                        Map.of(
                                534L, "찢긴 메모가 서명 위치를 표시한다고요? 그럼 누군가 위조를…",
                                532L, "보관실 문이 열려 있었다면, 누가 카드로 열었는지 봐야겠네요."
                        ),
                        List.of(
                                "저는 문서 진위를 확인하러 왔어요. 거래가 걸린 문제니까요.",
                                "정훈 씨는 ‘절대 못 준다’고 했죠. 이유를 끝내 말하지 않았고요.",
                                "전 22시쯤 나갔습니다. 더는 대화가 안 됐거든요."
                        )
                ),
                new SuspectFixture(
                        513L,
                        "박서후",
                        46,
                        "남",
                        "기증자",
                        "문서가 위조라면 모든 게 끝난다",
                        "https://example.com/portraits/suspect_donor2.jpg",
                        3,
                        "상대를 깔보듯 말하지만 속이 급하다.",
                        Map.of(
                                533L, "빈 보관함? 무슨 소리죠. 전 그런 건 몰라요.",
                                535L, "도구에 잉크? 전 잉크는 싫어합니다. 손에 묻잖아요."
                        ),
                        List.of(
                                "그 문서는 진짜입니다. 제가 직접… 구했거든요.",
                                "사서가 괜히 트집을 잡았어요. 저를 모욕했고요.",
                                "전 1층 카페에 있었어요. 사람도 많았고."
                        )
                ),
                new SuspectFixture(
                        514L,
                        "송하나",
                        24,
                        "여",
                        "사서 보조",
                        "반납 기록이 비어 있다",
                        "https://example.com/portraits/suspect_assistant.jpg",
                        4,
                        "눈치를 보며 말하지만 결국 사실을 흘린다.",
                        Map.of(
                                530L, "반납 기록이 비었다고요? 그건… 제가 처리해야 했는데…",
                                534L, "메모는… 정훈 선생님이 급히 썼던 것 같아요."
                        ),
                        List.of(
                                "정훈 선생님은 그날 너무 불안해 보였어요.",
                                "보관실 출입 카드는… 몇 명이 공유하긴 해요.",
                                "전 정말… 아무것도 몰랐어요. 믿어주세요."
                        )
                )
        );

        List<ClueFixture> clues = List.of(
                new ClueFixture(
                        530L,
                        521L,
                        1,
                        "비어 있는 반납 기록",
                        "LOW",
                        "평소라면 남아 있어야 할 반납 로그가 비어 있다. 일부만 삭제된 흔적이다.",
                        "https://example.com/clues/returnlog.jpg",
                        "삭제는 늘 목적이 있어요. 누가 무엇을 숨겼을까요?"
                ),
                new ClueFixture(
                        531L,
                        521L,
                        1,
                        "경비 일지의 빈 줄",
                        "MEDIUM",
                        "23:20 구간이 통째로 비어 있다. 다른 줄과 잉크 농도가 다르다.",
                        "https://example.com/clues/guardlog.jpg",
                        "잉크 농도가 다르다는 건… 나중에 덧썼다는 뜻일지도요."
                ),
                new ClueFixture(
                        532L,
                        522L,
                        2,
                        "열린 보관실 문",
                        "MEDIUM",
                        "잠금문이 반쯤 열려 있다. 카드 리더기에 최신 사용 흔적이 남았다.",
                        "https://example.com/clues/door.jpg",
                        "카드 로그가 있다면 ‘누가’는 금방 좁혀져요."
                ),
                new ClueFixture(
                        533L,
                        522L,
                        2,
                        "빈 고문서 보관함",
                        "HIGH",
                        "라벨만 남아 있고 내용물이 없다. 바닥에 잉크가 흘러 있다.",
                        "https://example.com/clues/archive.jpg",
                        "문서를 훔친 건 ‘돈’ 때문이 아니라 ‘비밀’ 때문일 수 있어요."
                ),
                new ClueFixture(
                        534L,
                        523L,
                        3,
                        "서명 위치가 표시된 찢긴 메모",
                        "HIGH",
                        "‘이 위치에 서명’이라고 적힌 메모 조각. 손글씨가 떨린다.",
                        "https://example.com/clues/note.jpg",
                        "위조 서명을 준비한 흔적이에요."
                ),
                new ClueFixture(
                        535L,
                        523L,
                        3,
                        "잉크가 묻은 송곳",
                        "CRITICAL",
                        "날카로운 송곳. 손잡이에 잉크와 알코올 냄새가 섞여 있다.",
                        "https://example.com/clues/awl.jpg",
                        "흉기이자, 문서를 훼손하는 도구였을지도요."
                ),
                new ClueFixture(
                        536L,
                        523L,
                        3,
                        "검은 장갑 조각",
                        "LOW",
                        "서가 틈에서 나온 장갑 조각. 내부에 젖은 잉크가 묻어 있다.",
                        "https://example.com/clues/glove.jpg",
                        "장갑은 흔적을 남기지 않기 위한 준비였겠죠."
                )
        );

        TruthFixture truth = new TruthFixture(
                513L,
                535L,
                3,
                "기증 문서 위조가 드러나는 걸 막기 위해 사서를 제거하고, 문서를 훔쳐 흔적을 지웠다.",
                "송곳으로 경부를 찔러 살해",
                List.of("송곳", "자상", "흉기"),
                List.of("위조", "문서", "기증")
        );

        List<TopRankingFixture> topRankings = List.of(
                new TopRankingFixture(1, 11L, 936, 318L, "A"),
                new TopRankingFixture(2, 3L, 920, 339L, "A"),
                new TopRankingFixture(3, 1L, 880, 400L, "B")
        );

        List<ReviewFixture> reviews = List.of(
                new ReviewFixture(50001L, 7L, 5, 4,
                        "클래식한 도서관 미스터리라서 좋았어요. 단서가 정직함.",
                        false, BASE_TIME.minusSeconds(3600 * 21L)),
                new ReviewFixture(50002L, 2L, 4, 4,
                        "문서 위조 테마가 신선했음. 대화도 꽤 리얼.",
                        false, BASE_TIME.minusSeconds(3600 * 31L)),
                new ReviewFixture(50003L, 12L, 5, 5,
                        "스포일러) 송곳 단서 뜨는 순간 범인 확신…",
                        true, BASE_TIME.minusSeconds(3600 * 44L)),
                new ReviewFixture(50004L, 9L, 4, 3,
                        "난이도 중. 보드로 정리하면 금방 풀려요.",
                        false, BASE_TIME.minusSeconds(3600 * 55L)),
                new ReviewFixture(50005L, 5L, 5, 4,
                        "분위기 최고. 특히 보관실 묘사가 좋았어요.",
                        false, BASE_TIME.minusSeconds(3600 * 69L))
        );

        return new ScenarioFixture(
                scenarioId,
                "도서관의 잉크 자국",
                "폐관 후 도서관 3층 서가에서 사서가 숨진 채 발견된다. 잉크 냄새, 사라진 문서, 그리고 위조의 흔적.",
                "클래식",
                "https://example.com/thumbnails/library.jpg",
                9733,
                bd("4.5"),
                bd("3.9"),
                "조용한 서가에는 종이 넘기는 소리만 남아야 했다. 잉크 자국이 말하는 진실을 추적하라.",
                victim,
                suspects,
                rooms,
                clues,
                truth,
                topRankings,
                reviews
        );
    }

    private static JsonNode roomObjects(Map<String, Object> payload) {
        ObjectNode root = JSON.objectNode();

        Object spotsValue = payload.get("spots");
        if (spotsValue instanceof List<?> spots) {
            ArrayNode arr = root.putArray("spots");
            for (Object item : spots) {
                if (item instanceof Map<?, ?> map) {
                    ObjectNode spot = arr.addObject();
                    putIfText(spot, "name", map.get("name"));
                    putIfText(spot, "hint", map.get("hint"));
                }
            }
        }

        return root;
    }

    private static void putIfText(ObjectNode node, String field, Object value) {
        if (!(value instanceof String s)) {
            return;
        }
        String trimmed = s.trim();
        if (!trimmed.isBlank()) {
            node.put(field, trimmed);
        }
    }

    public record UserFixture(
            long id,
            String nickname
    ) {
    }

    public record ScenarioFixture(
            long id,
            String title,
            String synopsis,
            String genre,
            String thumbnailUrl,
            int playCount,
            BigDecimal avgRating,
            BigDecimal avgDifficulty,
            String opening,
            VictimFixture victim,
            List<SuspectFixture> suspects,
            List<RoomFixture> rooms,
            List<ClueFixture> clues,
            TruthFixture truth,
            List<TopRankingFixture> topRankings,
            List<ReviewFixture> reviews
    ) {
    }

    public record VictimFixture(
            long id,
            String name,
            int age,
            String gender,
            String occupation,
            String discoveryLocation,
            String estimatedDeathTime,
            String causeOfDeath,
            String background,
            String portraitUrl
    ) {
    }

    public record SuspectFixture(
            long id,
            String name,
            int age,
            String gender,
            String occupation,
            String oneLiner,
            String portraitUrl,
            int displayOrder,
            String speakingStyle,
            Map<Long, String> clueReplies,
            List<String> genericReplies
    ) {
        public String replyFor(Long usedClueId) {
            if (usedClueId == null) {
                return pickGeneric();
            }
            String reply = clueReplies.get(usedClueId);
            if (reply != null && !reply.isBlank()) {
                return reply;
            }
            return pickGeneric();
        }

        private String pickGeneric() {
            if (genericReplies == null || genericReplies.isEmpty()) {
                return "…그건 잘 모르겠네요.";
            }
            int idx = ThreadLocalRandom.current().nextInt(genericReplies.size());
            return genericReplies.get(idx);
        }
    }

    public record RoomFixture(
            long id,
            int floorNumber,
            String roomType,
            String roomName,
            String description,
            String assistantComment,
            JsonNode objects
    ) {
    }

    public record ClueFixture(
            long id,
            long roomId,
            int floorNumber,
            String name,
            String importance,
            String description,
            String detailImageUrl,
            String assistantComment
    ) {
    }

    public record TruthFixture(
            long culpritSuspectId,
            long weaponClueId,
            int locationFloor,
            String motiveAnswer,
            String causeOfDeathAnswer,
            List<String> causeOfDeathKeywords,
            List<String> motiveKeywords
    ) {
    }

    public record TopRankingFixture(
            int rank,
            long userId,
            int score,
            long clearTime,
            String rankGrade
    ) {
    }

    public record ReviewFixture(
            long reviewId,
            long userId,
            int rating,
            int difficulty,
            String content,
            boolean isSpoiler,
            Instant createdAt
    ) {
    }
}
