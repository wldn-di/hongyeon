package com.ssafy.s14p11a707.user.api.v2;

import com.ssafy.s14p11a707.scenario.dto.ScenarioListResponse;
import com.ssafy.s14p11a707.user.dto.BookshelfSessionResponse;
import com.ssafy.s14p11a707.user.dto.BookshelfStatsResponse;
import com.ssafy.s14p11a707.user.service.v2.UserServiceV2;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v2/users/me")
public class UserMeApiV2 implements UserMeApiV2Doc {

    private final UserServiceV2 userService;

    @GetMapping("/bookshelf/stats")
    @Override
    public ResponseEntity<BookshelfStatsResponse> getMyBookshelfStats(
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return ResponseEntity.ok(userService.getMyBookshelfStats(oidcUser));
    }

    @GetMapping("/bookshelf/sessions")
    @Override
    public ResponseEntity<BookshelfSessionResponse> getMyBookshelfSessions(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(userService.getMyBookshelfSessions(oidcUser, pageable));
    }

    @GetMapping("/scenarios")
    @Override
    public ResponseEntity<ScenarioListResponse> getMyScenarios(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(userService.getMyScenarios(oidcUser, pageable));
    }
}
