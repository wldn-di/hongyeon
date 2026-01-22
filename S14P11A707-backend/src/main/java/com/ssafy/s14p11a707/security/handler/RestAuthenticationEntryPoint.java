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
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

/**
 * REST API 인증 실패 엔트리 포인트
 * <p>
 * Spring Security 기본 동작(로그인 페이지로 리다이렉트) 대신,
 * JSON 형태의 401 응답을 반환하기 위해 사용한다.
 * </p>
 *
 * @see com.ssafy.s14p11a707.config.SecurityConfig
 * @see ErrorResponse
 */
@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    /**
     * 미인증 요청에 대해 401 JSON 응답 작성
     * <p>
     * {@link ErrorCode#UNAUTHORIZED}를 사용해 {@link ErrorResponse} 바디를 구성하고,
     * 응답에 JSON으로 직렬화하여 기록한다.
     * </p>
     *
     * @param request 현재 요청
     * @param response 현재 응답
     * @param authException 인증 예외
     * @throws IOException 응답 쓰기 중 I/O 예외 발생 시
     */
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException {
        ErrorResponse body = new ErrorResponse(ErrorCode.UNAUTHORIZED, request.getRequestURI());
        response.setStatus(ErrorCode.UNAUTHORIZED.getHttpStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
