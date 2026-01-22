package com.ssafy.s14p11a707.exception;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        String code,
        String message,
        @JsonFormat(shape = JsonFormat.Shape.STRING,
                    pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
                    timezone = "Asia/Seoul")
        Instant timestamp,
        String path
) {
    public ErrorResponse(ErrorCode errorCode, String path) {
        this(errorCode.getCode(), errorCode.getMessage(), Instant.now(), path);
    }
}
