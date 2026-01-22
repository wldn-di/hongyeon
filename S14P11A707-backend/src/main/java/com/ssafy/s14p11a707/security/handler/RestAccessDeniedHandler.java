package com.ssafy.s14p11a707.security.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

/**
 * REST API 권한 거부(403) 응답 처리기
 * <p>
 * 인증은 되었지만 권한이 부족한 요청에 대해,
 * JSON 형태의 403 응답을 반환하기 위해 사용한다.
 * </p>
 *
 * @see com.ssafy.s14p11a707.config.SecurityConfig
 * @see ErrorResponse
 */
@Component
@RequiredArgsConstructor
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    /**
     * 접근 거부 요청에 대해 403 JSON 응답 작성
     * <p>
     * {@link ErrorCode#ACCESS_DENIED}를 사용해 {@link ErrorResponse} 바디를 구성하고,
     * 응답에 JSON으로 직렬화하여 기록한다.
     * </p>
     *
     * @param request 현재 요청
     * @param response 현재 응답
     * @param accessDeniedException 접근 거부 예외
     * @throws IOException 응답 쓰기 중 I/O 예외 발생 시
     */
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException {
        ErrorResponse body = new ErrorResponse(ErrorCode.ACCESS_DENIED, request.getRequestURI());
        response.setStatus(ErrorCode.ACCESS_DENIED.getHttpStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
