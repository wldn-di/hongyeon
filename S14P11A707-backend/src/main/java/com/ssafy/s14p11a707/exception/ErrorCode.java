package com.ssafy.s14p11a707.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON-001", "서버 내부 오류가 발생했습니다."),
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "COMMON-002", "잘못된 요청 값입니다."),
    NOTNULL_INPUT_VALUE(HttpStatus.BAD_REQUEST, "COMMON-003", "필수 입력 값이 누락되었습니다."),

    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "AUTH-001", "로그인이 필요합니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "AUTH-002", "해당 기능에 접근할 권한이 없습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
