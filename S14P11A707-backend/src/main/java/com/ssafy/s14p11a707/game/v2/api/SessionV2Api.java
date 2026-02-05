package com.ssafy.s14p11a707.game.v2.api;

import com.ssafy.s14p11a707.game.dto.SuspectChatRequest;
import com.ssafy.s14p11a707.game.dto.SuspectChatResponse;
import com.ssafy.s14p11a707.game.v2.service.SuspectChatV2Service;
import com.ssafy.s14p11a707.security.CurrentUserIdResolver;
import com.ssafy.s14p11a707.security.authorization.GameSessionAccessPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v2/sessions")
public class SessionV2Api implements SessionV2ApiDoc {

    private final SuspectChatV2Service suspectChatV2Service;
    private final GameSessionAccessPolicy gameSessionAccessPolicy;
    private final CurrentUserIdResolver currentUserIdResolver;

    @PostMapping("/{sessionId}/suspects/{suspectId}/chat")
    @Override
    public ResponseEntity<SuspectChatResponse> chatWithSuspect(
            @PathVariable long sessionId,
            @PathVariable long suspectId,
            @RequestBody SuspectChatRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        gameSessionAccessPolicy.assertSessionOwner(userId, sessionId);
        return ResponseEntity.ok(suspectChatV2Service.chatWithSuspect(sessionId, suspectId, request));
    }
}

