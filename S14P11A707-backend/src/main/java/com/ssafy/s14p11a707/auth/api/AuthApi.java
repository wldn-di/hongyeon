package com.ssafy.s14p11a707.auth.api;

import com.ssafy.s14p11a707.auth.dto.AuthMeResponse;
import com.ssafy.s14p11a707.auth.service.AuthService;
import com.ssafy.s14p11a707.security.CurrentUserIdResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthApi implements AuthApiDoc {

    private final AuthService authService;
    private final CurrentUserIdResolver currentUserIdResolver;

    @GetMapping("/login")
    @Override
    public ResponseEntity<Void> login(
            @RequestParam(value = "redirect", required = false) String redirect,
            HttpServletRequest request
    ) {
        URI location = authService.startLogin(redirect, request);
        return ResponseEntity.status(HttpStatus.FOUND).location(location).build();
    }

    @GetMapping("/me")
    @Override
    public ResponseEntity<AuthMeResponse> me(@AuthenticationPrincipal OidcUser oidcUser) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        return ResponseEntity.ok(authService.me(userId));
    }

    @PostMapping("/refresh")
    @Override
    public ResponseEntity<Void> refresh(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) {
        AuthService.RefreshResult result = authService.refresh(request, response, authentication);
        if (result == AuthService.RefreshResult.UNAUTHORIZED) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout")
    @Override
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        return ResponseEntity.noContent().build();
    }
}
