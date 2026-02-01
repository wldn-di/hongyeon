package com.ssafy.s14p11a707.scenario.v2.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/**
 * 시나리오 생성 v2 요청 DTO
 * <p>
 * v2 생성 파이프라인의 입력(제목/장르/용의자 수/유저 시놉시스 등)을 담는다.
 * 프레젠테이션 계층에서 수신한 값은 {@link com.ssafy.s14p11a707.scenario.v2.service.ScenarioV2Service}로 전달되어
 * {@link com.ssafy.s14p11a707.scenario.v2.graph.ScenarioV2GraphRunner} 실행의 기준 데이터로 사용된다.
 * </p>
 * <p><b>설계 메모</b></p>
 * <ul>
 *   <li>v1 DTO({@link com.ssafy.s14p11a707.scenario.dto.ScenarioCreateRequest})와 혼용하지 않고 v2 전용으로 분리한다.</li>
 *   <li>{@code style}은 이미지 생성 프롬프트에 부가적으로 반영되는 선택 입력이다.</li>
 * </ul>
 *
 * @param title 시나리오 제목(유저 입력)
 * @param genre 장르(유저 입력)
 * @param suspectCount 용의자 수(피해자 제외)
 * @param userSynopsis 유저가 제공한 짧은 시놉시스/아이디어
 * @param style 이미지 생성 스타일(선택)
 * @see ScenarioV2CreateResponse
 */
public record ScenarioV2CreateRequest(
        @NotBlank String title,
        @NotBlank String genre,
        @Min(1) int suspectCount,
        @NotBlank String userSynopsis,
        String style
) {
}
