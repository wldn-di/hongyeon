package com.ssafy.s14p11a707.scenario.v2.image;

/**
 * 시나리오 v2 이미지 생성 작업 단위
 * <p>
 * {@link com.ssafy.s14p11a707.scenario.v2.node.ImagePromptNode}가 도메인 엔티티를 조회하여 생성할 이미지 목록을 구성할 때 사용한다.
 * 각 작업은 {@link com.ssafy.s14p11a707.scenario.v2.node.ImageBatchNode}에서 병렬로 실행되며,
 * 생성된 URL은 {@link ScenarioV2ImageUrlUpdater}를 통해 엔티티 필드에 반영된다.
 * </p>
 *
 * @param target 이미지 적용 대상({@link Target})
 * @param targetId 대상 엔티티 식별자(id)
 * @param objectKey 객체 스토리지에 저장할 경로/키
 * @param prompt 이미지 생성 프롬프트(텍스트)
 * @see ScenarioV2ObjectStorageService
 * @see ScenarioV2ImageUrlUpdater
 */
public record ScenarioV2ImageJob(
        Target target,
        long targetId,
        String objectKey,
        String prompt
) {

    /**
     * 이미지 적용 대상 구분
     * <p>
     * 생성된 이미지 URL을 어느 엔티티의 어떤 필드에 기록할지 결정하기 위한 타입이다.
     * </p>
     * <p><b>필드 매핑</b></p>
     * <ul>
     *   <li>{@link #SCENARIO_THUMBNAIL}: {@link com.ssafy.s14p11a707.scenario.entity.Scenario#setThumbnailUrl(String)}</li>
     *   <li>{@link #VICTIM_PORTRAIT}: {@link com.ssafy.s14p11a707.scenario.entity.Victim#setPortraitUrl(String)}</li>
     *   <li>{@link #SUSPECT_PORTRAIT}: {@link com.ssafy.s14p11a707.scenario.entity.Suspect#setPortraitUrl(String)}</li>
     *   <li>{@link #CLUE_IMAGE}: {@link com.ssafy.s14p11a707.scenario.entity.Clue#setDetailImageUrl(String)}</li>
     *   <li>{@link #ROOM_BACKGROUND}: {@link com.ssafy.s14p11a707.scenario.entity.Room#setBackgroundImageUrl(String)}</li>
     * </ul>
     *
     * @see ScenarioV2ImageUrlUpdater
     */
    public enum Target {
        SCENARIO_THUMBNAIL,
        VICTIM_PORTRAIT,
        SUSPECT_PORTRAIT,
        CLUE_IMAGE,
        ROOM_BACKGROUND
    }
}
