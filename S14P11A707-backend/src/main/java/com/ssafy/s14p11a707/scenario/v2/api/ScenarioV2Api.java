package com.ssafy.s14p11a707.scenario.v2.api;

import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateRequest;
import com.ssafy.s14p11a707.scenario.v2.dto.ScenarioV2CreateResponse;
import com.ssafy.s14p11a707.scenario.v2.service.ScenarioV2Service;
import com.ssafy.s14p11a707.scenario.v2.service.ScenarioV2StreamService;
import com.ssafy.s14p11a707.security.CurrentUserIdResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v2/scenarios")
public class ScenarioV2Api implements ScenarioV2ApiDoc {

    private final ScenarioV2Service scenarioV2Service;
    private final ScenarioV2StreamService scenarioV2StreamService;
    private final CurrentUserIdResolver currentUserIdResolver;

    @PostMapping
    @Override
    public ResponseEntity<ScenarioV2CreateResponse> createScenario(
            @Valid @RequestBody ScenarioV2CreateRequest request,
            @AuthenticationPrincipal OidcUser oidcUser
    ) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        return ResponseEntity.ok(scenarioV2Service.createScenario(request, userId));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Override
    public SseEmitter connect(@AuthenticationPrincipal OidcUser oidcUser) {
        long userId = currentUserIdResolver.requireUserId(oidcUser);
        return scenarioV2StreamService.connect(userId);
    }
}
