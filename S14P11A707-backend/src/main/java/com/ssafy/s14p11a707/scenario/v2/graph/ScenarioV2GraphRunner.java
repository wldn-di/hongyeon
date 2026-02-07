package com.ssafy.s14p11a707.scenario.v2.graph;

import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateRequest;
import com.ssafy.s14p11a707.scenario.v2.node.CharactersCluesTruthNode;
import com.ssafy.s14p11a707.scenario.v2.node.CritiqueNode;
import com.ssafy.s14p11a707.scenario.v2.node.FinalizeNode;
import com.ssafy.s14p11a707.scenario.v2.node.ImageBatchNode;
import com.ssafy.s14p11a707.scenario.v2.node.ImagePromptNode;
import com.ssafy.s14p11a707.scenario.v2.node.PersistNode;
import com.ssafy.s14p11a707.scenario.v2.node.RefineNode;
import com.ssafy.s14p11a707.scenario.v2.node.RoomsNode;
import com.ssafy.s14p11a707.scenario.v2.node.ScenarioBaseNode;
import com.ssafy.s14p11a707.scenario.v2.node.ScenarioV2Node;
import com.ssafy.s14p11a707.scenario.v2.node.TimelineNode;
import com.ssafy.s14p11a707.scenario.v2.node.ValidateNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 시나리오 생성 v2 그래프 실행기
 * <p>
 * v2 생성 파이프라인을 <b>고정된 노드 순서</b>로 오케스트레이션하며,
 * 초안 정합성 확인/개연성 평가/보강을 루프 형태로 반복한 뒤 영속화 및 이미지 처리를 수행한다.
 * </p>
 * <p><b>루프 전략</b></p>
 * <ul>
 *   <li>정적 검증({@link ValidateNode}) → LLM 평가({@link CritiqueNode}) → (필요 시) 보강({@link RefineNode}) 순으로 수행</li>
 *   <li>평가 점수가 {@code PASS_SCORE} 이상이면 통과</li>
 *   <li>최대 {@code MAX_RETRY}회까지 보강 후 다음 단계로 진행</li>
 * </ul>
 * <p><b>설계 메모</b></p>
 * <ul>
 *   <li>노드 자체는 상태를 보관하지 않는 <i>stateless</i> 컴포넌트로 설계한다.</li>
 *   <li>진행 상황 이벤트는 각 노드에서 {@link com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2EventPublisher}로 발행한다.</li>
 * </ul>
 *
 * @see ScenarioV2State
 * @see TimelineNode
 * @see ScenarioBaseNode
 * @see CharactersCluesTruthNode
 * @see RoomsNode
 * @see ValidateNode
 * @see CritiqueNode
 * @see RefineNode
 * @see PersistNode
 * @see ImagePromptNode
 * @see ImageBatchNode
 * @see FinalizeNode
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ScenarioV2GraphRunner {

    private static final int PASS_SCORE = 82;
    private static final int MAX_RETRY = 2;

    private final TimelineNode timelineNode;
    private final ScenarioBaseNode scenarioBaseNode;
    private final CharactersCluesTruthNode charactersCluesTruthNode;
    private final RoomsNode roomsNode;
    private final ValidateNode validateNode;
    private final CritiqueNode critiqueNode;
    private final RefineNode refineNode;
    private final PersistNode persistNode;
    private final ImagePromptNode imagePromptNode;
    private final ImageBatchNode imageBatchNode;
    private final FinalizeNode finalizeNode;

    /**
     * v2 생성 그래프를 실행하고 최종 상태 반환
     * <p>
     * {@link ScenarioV2State}를 초기화한 뒤 노드들을 순차 실행하며,
     * 개연성 점수/재시도 횟수에 따라 보강 루프를 수행한다.
     * </p>
     *
     * @param userId SSE 라우팅에 사용되는 사용자 식별자(id)
     * @param scenarioId 생성 대상 시나리오 식별자(id)
     * @param request 사용자 입력 DTO
     * @return 그래프 실행 이후의 상태 객체
     * @throws RuntimeException 노드 실행 중 발생한 예외가 호출자(비동기 작업)로 전파될 수 있음
     */
    public ScenarioV2State run(long userId, long scenarioId, ScenarioV2CreateRequest request) {
        ScenarioV2State state = new ScenarioV2State(userId, scenarioId, request);

        log.info(
                "[v2] graph started. userId={}, scenarioId={}, title={}, genre={}, suspectCount={}",
                userId,
                scenarioId,
                safe(request.title()),
                safe(request.genre()),
                request.suspectCount()
        );

        state = runNode("TimelineNode", timelineNode, state);
        state = runNode("ScenarioBaseNode", scenarioBaseNode, state);
        state = runNode("CharactersCluesTruthNode", charactersCluesTruthNode, state);
        state = runNode("RoomsNode", roomsNode, state);

        int fixAttempts = 0;
        while (true) {
            state = runNode("ValidateNode", validateNode, state);

            String report = state.getValidationReport();
            boolean validationOk = "OK".equals(report);
            if (!validationOk) {
                log.info(
                        "[v2] validation checkpoint. scenarioId={}, attempts={}/{}, report={}",
                        scenarioId,
                        fixAttempts,
                        MAX_RETRY,
                        summarize(report, 160)
                );

                if (fixAttempts >= MAX_RETRY) {
                    throw new IllegalStateException("validation failed after retries: " + summarize(report, 500));
                }

                fixAttempts++;
                state = repairForValidationIssues(state, report);
                continue;
            }

            state = runNode("CritiqueNode", critiqueNode, state);
            boolean scoreOk = state.getCritiqueScore() >= PASS_SCORE;

            log.info(
                    "[v2] critique checkpoint. scenarioId={}, score={}, retryCount={}, attempts={}/{}, validationReport={}",
                    scenarioId,
                    state.getCritiqueScore(),
                    state.getRetryCount(),
                    fixAttempts,
                    MAX_RETRY,
                    summarize(report, 160)
            );

            if (scoreOk) {
                break;
            }

            if (fixAttempts >= MAX_RETRY) {
                log.warn(
                        "[v2] critique did not reach pass score, but validation OK. proceeding. scenarioId={}, score={}, retryCount={}, attempts={}",
                        scenarioId,
                        state.getCritiqueScore(),
                        state.getRetryCount(),
                        fixAttempts
                );
                break;
            }

            fixAttempts++;
            state = runNode("RefineNode", refineNode, state);
        }

        state = runNode("PersistNode", persistNode, state);
        state = runNode("ImagePromptNode", imagePromptNode, state);
        state = runNode("ImageBatchNode", imageBatchNode, state);
        state = runNode("FinalizeNode", finalizeNode, state);

        log.info(
                "[v2] graph finished. scenarioId={}, retryCount={}, score={}, victimId={}, suspects={}, clues={}, imageJobs={}",
                scenarioId,
                state.getRetryCount(),
                state.getCritiqueScore(),
                state.getVictimId(),
                state.getSuspectIds() == null ? null : state.getSuspectIds().size(),
                state.getClueIds() == null ? null : state.getClueIds().size(),
                state.getImageJobs() == null ? null : state.getImageJobs().size()
        );
        return state;
    }

    private ScenarioV2State runNode(String nodeName, ScenarioV2Node node, ScenarioV2State state) {
        long startedAt = System.nanoTime();
        log.info("[v2] node started. scenarioId={}, node={}, retryCount={}, score={}", state.getScenarioId(), nodeName, state.getRetryCount(), state.getCritiqueScore());
        try {
            ScenarioV2State next = node.execute(state);
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000L;
            log.info(
                    "[v2] node finished. scenarioId={}, node={}, elapsedMs={}, summary={}",
                    next.getScenarioId(),
                    nodeName,
                    elapsedMs,
                    stateSummary(next)
            );
            return next;
        } catch (Exception e) {
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000L;
            log.error(
                    "[v2] node failed. scenarioId={}, node={}, elapsedMs={}, retryCount={}, score={}, summary={}",
                    state.getScenarioId(),
                    nodeName,
                    elapsedMs,
                    state.getRetryCount(),
                    state.getCritiqueScore(),
                    stateSummary(state),
                    e
            );
            throw e;
        }
    }

    private ScenarioV2State repairForValidationIssues(ScenarioV2State state, String report) {
        String safeReport = report == null ? "" : report;
        log.warn(
                "[v2] validation failed. running targeted regeneration. scenarioId={}, report={}",
                state.getScenarioId(),
                summarize(safeReport, 200)
        );

        boolean scenarioMetaIssue = safeReport.contains("scenario.title") || safeReport.contains("scenario.synopsisDetail");
        boolean suspectsOrCulpritIssue = safeReport.contains("suspects")
                || safeReport.contains("suspect must")
                || safeReport.contains("is_culprit")
                || safeReport.contains("weakness_clue")
                || safeReport.contains("ai_config_json");
        boolean cluesIssue = safeReport.contains("clues") || safeReport.contains("truth_config_json");
        boolean roomsIssue = safeReport.contains("rooms");

        if (scenarioMetaIssue) {
            state = runNode("ScenarioBaseNode", scenarioBaseNode, state);
            state = runNode("CharactersCluesTruthNode", charactersCluesTruthNode, state);
            state = runNode("RoomsNode", roomsNode, state);
            state.setDraftJson(null);
            return state;
        }

        if (suspectsOrCulpritIssue || cluesIssue) {
            state = runNode("CharactersCluesTruthNode", charactersCluesTruthNode, state);
            state = runNode("RoomsNode", roomsNode, state);
            state.setDraftJson(null);
            return state;
        }

        if (roomsIssue) {
            state = runNode("RoomsNode", roomsNode, state);
            state.setDraftJson(null);
            return state;
        }

        log.warn("[v2] validation issues not categorized. falling back to RefineNode. scenarioId={}", state.getScenarioId());
        return runNode("RefineNode", refineNode, state);
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    private static String summarize(String value, int maxLen) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.length() <= maxLen) {
            return trimmed;
        }
        return trimmed.substring(0, maxLen) + "...";
    }

    private static int len(String value) {
        return value == null ? 0 : value.length();
    }

    private static String stateSummary(ScenarioV2State state) {
        return "timelineJsonLen=" + len(state.getTimelineJson())
                + ", scenarioJsonLen=" + len(state.getScenarioJson())
                + ", charactersJsonLen=" + len(state.getCharactersJson())
                + ", roomsJsonLen=" + len(state.getRoomsJson())
                + ", draftJson=" + (state.getDraftJson() == null ? "null" : "present")
                + ", validationReportLen=" + len(state.getValidationReport())
                + ", imageJobs=" + (state.getImageJobs() == null ? "null" : state.getImageJobs().size());
    }
}
