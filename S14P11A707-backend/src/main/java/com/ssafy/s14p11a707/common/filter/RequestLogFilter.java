package com.ssafy.s14p11a707.common.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
public class RequestLogFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String method = request.getMethod();
        String uri = request.getRequestURI();
        String qs = request.getQueryString();
        String full = (qs == null) ? uri : (uri + "?" + qs);

        log.info("[REQ] {} {} from={} ua={}",
                method, full,
                request.getRemoteAddr(),
                request.getHeader("User-Agent")
        );

        filterChain.doFilter(request, response);
    }
}
