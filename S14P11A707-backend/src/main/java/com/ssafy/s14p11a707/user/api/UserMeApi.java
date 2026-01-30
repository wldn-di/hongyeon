package com.ssafy.s14p11a707.user.api;

import com.ssafy.s14p11a707.auth.dto.AuthMeResponse;
import com.ssafy.s14p11a707.scenario.dto.ScenarioListResponse;
import com.ssafy.s14p11a707.security.CurrentUserIdResolver;
import com.ssafy.s14p11a707.user.dto.BookshelfSessionResponse;
import com.ssafy.s14p11a707.user.dto.BookshelfStatsResponse;
import com.ssafy.s14p11a707.user.dto.UserNicknameUpdateRequest;
import com.ssafy.s14p11a707.user.service.UserMeService;
import com.ssafy.s14p11a707.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users/me")
public class UserMeApi implements UserMeApiDoc {

    private final UserMeService userMeService;
    private final UserService userService;
    private final CurrentUserIdResolver currentUserIdResolver;

    @GetMapping("/bookshelf/stats")
    @Override
    public ResponseEntity<BookshelfStatsResponse> getMyBookshelfStats(
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        return ResponseEntity.ok(userMeService.getMyBookshelfStats(userId));
    }

    @GetMapping("/bookshelf/sessions")
    @Override
    public ResponseEntity<BookshelfSessionResponse> getMyBookshelfSessions(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        return ResponseEntity.ok(userMeService.getMyBookshelfSessions(userId, pageable));
    }

    @GetMapping("/scenarios")
    @Override
    public ResponseEntity<ScenarioListResponse> getMyScenarios(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        return ResponseEntity.ok(userMeService.getMyScenarios(userId, pageable));
    }

    @PatchMapping("/nickname")
    @Override
    public ResponseEntity<AuthMeResponse> updateMyNickname(
            @AuthenticationPrincipal OidcUser oidcUser,
            @Valid @RequestBody UserNicknameUpdateRequest request
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        return ResponseEntity.ok(AuthMeResponse.from(userService.changeNickname(userId, request.nickname())));
    }
}
