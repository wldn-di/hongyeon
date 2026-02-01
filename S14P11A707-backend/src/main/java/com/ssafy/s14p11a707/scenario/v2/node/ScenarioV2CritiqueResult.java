package com.ssafy.s14p11a707.scenario.v2.node;

import java.util.List;

/**
 * 시나리오 v2 개연성 평가 결과 DTO
 * <p>
 * {@link CritiqueNode}가 LLM을 통해 산출한 점수/피드백/필수 수정사항을 표현한다.
 * {@link com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2State}의 개연성 루프 판단에 사용된다.
 * </p>
 *
 * @param score 개연성 점수(0~100)
 * @param feedback 종합 피드백(자유 텍스트)
 * @param mustFix 반드시 수정되어야 하는 항목 목록
 * @see CritiqueNode
 * @see RefineNode
 */
public record ScenarioV2CritiqueResult(
        int score,
        String feedback,
        List<String> mustFix
) {
}
