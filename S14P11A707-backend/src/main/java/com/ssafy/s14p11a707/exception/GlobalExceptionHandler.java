package com.ssafy.s14p11a707.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestTimeoutException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String REQUEST_LOG_FORMAT = "[{}] {} {} - {}";

    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ErrorResponse> handleBaseException(BaseException e, HttpServletRequest request) {

        HttpStatus httpStatus = e.getHttpStatus();

        if (httpStatus.is5xxServerError()) {
            logError(e.getErrorCode(), request, e.getMessage(), e);
        } else {
            logWarn(e.getErrorCode(), request, e.getMessage());
        }

        if (isSseRequest(request)) {
            return ResponseEntity.status(httpStatus).body(null);
        }

        ErrorResponse response = new ErrorResponse(e.getErrorCode(), request.getRequestURI());
        return ResponseEntity
                .status(httpStatus)
                .body(response);
    }

    @ExceptionHandler({
            BindException.class,
            HandlerMethodValidationException.class,
            HttpMessageNotReadableException.class
    })
    public ResponseEntity<ErrorResponse> handleInvalidInput(Exception e, HttpServletRequest request) {
        String logDetail = summarizeInvalidInput(e);
        logInfo(request, logDetail);

        ErrorResponse response = new ErrorResponse(ErrorCode.INVALID_INPUT_VALUE, request.getRequestURI());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException e, HttpServletRequest request) {
        logWarn(ErrorCode.ACCESS_DENIED, request, e.getMessage());
        ErrorResponse response = new ErrorResponse(ErrorCode.ACCESS_DENIED, request.getRequestURI());
        return ResponseEntity
                .status(ErrorCode.ACCESS_DENIED.getHttpStatus())
                .body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e, HttpServletRequest request) {
        if (isSseRequest(request)) {
            if (e instanceof AsyncRequestTimeoutException) {
                log.info(REQUEST_LOG_FORMAT, "SSE_TIMEOUT", request.getMethod(), request.getRequestURI(), "async timeout");
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(null);
            }
            logWarn(ErrorCode.INTERNAL_SERVER_ERROR, request, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }

        logError(ErrorCode.INTERNAL_SERVER_ERROR, request, e.getMessage(), e);

        ErrorResponse response = new ErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR, request.getRequestURI());
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }


    private static boolean isSseRequest(HttpServletRequest request) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("text/event-stream")) {
            return true;
        }

        String uri = request.getRequestURI();
        return uri != null && uri.contains("/stream");
    }

    private static String summarizeInvalidInput(Exception e) {
        if (e instanceof BindException bindException) {
            return bindException.getBindingResult().getFieldErrors().stream()
                    .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                    .reduce((left, right) -> left + ", " + right)
                    .orElse("잘못된 입력 값입니다.");
        }

        if (e instanceof HttpMessageNotReadableException) {
            return "요청 본문 형식을 확인해주세요.";
        }

        String message = e.getMessage();
        return (message == null || message.isBlank()) ? "잘못된 입력 값입니다." : message;
    }

    private static void logInfo(HttpServletRequest request, String detail) {
        log.info(REQUEST_LOG_FORMAT, ErrorCode.INVALID_INPUT_VALUE.getCode(), request.getMethod(), request.getRequestURI(), detail);
    }

    private static void logWarn(ErrorCode errorCode, HttpServletRequest request, String detail) {
        log.warn(REQUEST_LOG_FORMAT, errorCode.getCode(), request.getMethod(), request.getRequestURI(), detail);
    }

    private static void logError(ErrorCode errorCode, HttpServletRequest request, String detail, Throwable throwable) {
        log.error(REQUEST_LOG_FORMAT, errorCode.getCode(), request.getMethod(), request.getRequestURI(), detail, throwable);
    }
}
