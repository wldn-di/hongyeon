package com.ssafy.s14p11a707.common.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Component
public class RequestLogFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String requestId = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        long startedAt = System.nanoTime();

        String method = request.getMethod();
        String uri = request.getRequestURI();
        String qs = request.getQueryString();
        String full = (qs == null) ? uri : (uri + "?" + qs);

        log.info("[REQ] id={} {} {} from={} ua={}",
                requestId,
                method,
                full,
                request.getRemoteAddr(),
                request.getHeader("User-Agent")
        );

        Exception thrown = null;
        try {
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            thrown = e;
            throw e;
        } finally {
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000L;
            int status = response.getStatus();

            boolean isChat = uri != null && uri.contains("/api/sessions") && uri.contains("/chat");
            boolean isSlow = elapsedMs >= 2000;
            boolean isError = status >= 400 || thrown != null;

            if (isChat || isSlow || isError) {
                log.info("[RES] id={} {} {} status={} elapsedMs={} error={}",
                        requestId,
                        method,
                        full,
                        status,
                        elapsedMs,
                        thrown == null ? null : thrown.getClass().getSimpleName()
                );
            } else {
                log.debug("[RES] id={} {} {} status={} elapsedMs={}",
                        requestId,
                        method,
                        full,
                        status,
                        elapsedMs
                );
            }
        }
    }
}
