package com.ssafy.s14p11a707.scenario.v2.graph;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateRequest;
import com.ssafy.s14p11a707.scenario.v2.image.ScenarioV2ImageJob;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * 시나리오 생성 v2 파이프라인 상태 컨테이너
 * <p>
 * {@link ScenarioV2GraphRunner}가 노드 간에 전달하는 실행 컨텍스트로,
 * LLM 출력(JSON 문자열/트리), 검증/평가 결과, 재시도 횟수, 영속화된 엔티티 ID,
 * 이미지 생성 작업 목록 등을 보관한다.
 * </p>
 * <p><b>설계 메모</b></p>
 * <ul>
 *   <li>단일 요청(단일 시나리오 생성 작업) 범위에서만 사용되는 <i>in-memory</i> 상태다.</li>
 *   <li>스프링 싱글턴 빈이 아니며, 노드 실행 스레드 내에서만 사용되는 것을 전제로 한다.</li>
 * </ul>
 *
 * @see ScenarioV2GraphRunner
 * @see com.ssafy.s14p11a707.scenario.v2.node.ScenarioV2Node
 */
@Getter
@Setter
public class ScenarioV2State {

    private final long userId;
    private final long scenarioId;
    private final ScenarioV2CreateRequest request;

    private String timelineJson;
    private String scenarioJson;
    private String charactersJson;
    private String roomsJson;

    private JsonNode draftJson;
    private String validationReport;

    private int critiqueScore;
    private String critiqueFeedback;
    private int retryCount;

    private Long victimId;
    private List<Long> suspectIds;
    private List<Long> clueIds;

    private List<ScenarioV2ImageJob> imageJobs;

    /**
     * 상태 객체를 초기화하고 요청 정보를 바인딩
     * <p>
     * 그래프 실행의 식별자({@code userId}, {@code scenarioId})와 입력 DTO를 보관한다.
     * </p>
     *
     * @param userId SSE 라우팅에 사용되는 사용자 식별자(id)
     * @param scenarioId 생성 대상 시나리오 식별자(id)
     * @param request 사용자 입력 DTO
     */
    public ScenarioV2State(long userId, long scenarioId, ScenarioV2CreateRequest request) {
        this.userId = userId;
        this.scenarioId = scenarioId;
        this.request = request;
    }
}
