package com.ssafy.s14p11a707.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "REVIEW-001", "리뷰를 찾을 수 없습니다."),
    REVIEW_ALREADY_EXISTS(HttpStatus.CONFLICT, "REVIEW-002", "이미 해당 시나리오에 리뷰를 작성하셨습니다."),
    REVIEW_ALREADY_DELETED(HttpStatus.BAD_REQUEST,"REVIEW-003","이미 삭제된 리뷰입니다."),

    SCENARIO_NOT_FOUND(HttpStatus.NOT_FOUND, "SCENARIO-001", "시나리오를 찾을 수 없습니다."),
    SCENARIO_NOT_READY(HttpStatus.BAD_REQUEST, "SCENARIO-002", "시나리오가 아직 준비되지 않았습니다."),
    SCENARIO_ALREADY_GENERATING(HttpStatus.CONFLICT,"SCENARIO-003", "이미 생성중인 시나리오가 존재합니다."),


    SESSION_NOT_FOUND(HttpStatus.NOT_FOUND, "SESSION-001", "게임 세션을 찾을 수 없습니다."),
    SESSION_ALREADY_EXISTS(HttpStatus.CONFLICT, "SESSION-002", "이미 진행 중인 게임이 있습니다."),
    SESSION_NOT_PLAYING(HttpStatus.CONFLICT,"SESSION-003","진행 중인 게임이 아닙니다."),
    HEALTH_DEPLETED(HttpStatus.BAD_REQUEST, "SESSION-004", "체력이 모두 소진되어 더 이상 채팅할 수 없습니다."),
    REPORT_NOT_FOUND(HttpStatus.NOT_FOUND,"SESSION-005","수사보고서를 찾을 수 없습니다."),
    INVALID_SESSION_STATUS(HttpStatus.BAD_REQUEST,"SESSION-005","비정상적인 세션 접근입니다."),

    CLUE_NOT_FOUND(HttpStatus.NOT_FOUND, "CLUE-001", "단서를 찾을 수 없습니다."),
    CLUE_ALREADY_DISCOVERED(HttpStatus.CONFLICT, "CLUE-002", "이미 획득한 단서입니다."),

    ROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "ROOM-001", "방을 찾을 수 없습니다."),
    VICTIM_NOT_FOUND(HttpStatus.NOT_FOUND, "VICTIM-001", "피해자를 찾을 수 없습니다."),
    SUSPECT_NOT_FOUND(HttpStatus.NOT_FOUND,"SUSPECT-001", "용의자를 찾을 수 없습니다."),

    NICKNAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "USER-001", "이미 사용 중인 닉네임입니다."),

    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON-001", "서버 내부 오류가 발생했습니다."),
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "COMMON-002", "잘못된 요청 값입니다."),
    NOTNULL_INPUT_VALUE(HttpStatus.BAD_REQUEST, "COMMON-003", "필수 입력 값이 누락되었습니다."),

    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "AUTH-001", "로그인이 필요합니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "AUTH-002", "해당 기능에 접근할 권한이 없습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
