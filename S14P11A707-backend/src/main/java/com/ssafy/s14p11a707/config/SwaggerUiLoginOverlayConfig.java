package com.ssafy.s14p11a707.config;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springdoc.core.properties.SwaggerUiConfigProperties;
import org.springdoc.core.properties.SwaggerUiOAuthProperties;
import org.springdoc.core.providers.ObjectMapperProvider;
import org.springdoc.webmvc.ui.SwaggerIndexPageTransformer;
import org.springdoc.webmvc.ui.SwaggerIndexTransformer;
import org.springdoc.webmvc.ui.SwaggerWelcomeCommon;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.resource.ResourceTransformerChain;
import org.springframework.web.servlet.resource.TransformedResource;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "springdoc.swagger-ui.enabled", matchIfMissing = true)
public class SwaggerUiLoginOverlayConfig {

    @Bean
    public SwaggerIndexTransformer swaggerIndexTransformer(
            SwaggerUiConfigProperties swaggerUiConfigProperties,
            SwaggerUiOAuthProperties swaggerUiOAuthProperties,
            SwaggerWelcomeCommon swaggerWelcomeCommon,
            ObjectMapperProvider objectMapperProvider
    ) {
        return new SwaggerIndexPageTransformer(
                swaggerUiConfigProperties,
                swaggerUiOAuthProperties,
                swaggerWelcomeCommon,
                objectMapperProvider
        ) {
            @Override
            public @NonNull Resource transform(
                    @NonNull HttpServletRequest request,
                    @NonNull Resource resource,
                    @NonNull ResourceTransformerChain transformerChain
            ) throws IOException {
                Resource transformed = super.transform(request, resource, transformerChain);

                String html = new String(transformed.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                String injected = injectLoginBar(html);
                if (injected.equals(html)) {
                    return transformed;
                }

                return new TransformedResource(resource, injected.getBytes(StandardCharsets.UTF_8));
            }
        };
    }

    private static String injectLoginBar(String html) {
        String marker = "<div id=\"swagger-ui\"></div>";
        int idx = html.indexOf(marker);
        if (idx < 0) {
            return html;
        }

        return html.substring(0, idx)
                + swaggerLoginBarHtml()
                + html.substring(idx);
    }

    private static String swaggerLoginBarHtml() {
        return """
                <div id="swagger-auth-bar" style="position: sticky; top: 0; z-index: 9999; background: #111; color: #fff; padding: 10px 12px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple SD Gothic Neo', 'Noto Sans KR'; display: flex; gap: 10px; align-items: center;">
                  <a href="/api/auth/login?redirect=/swagger-ui/index.html" style="display: inline-flex; align-items: center; gap: 8px; background: #4285F4; color: #fff; border-radius: 10px; padding: 8px 10px; text-decoration: none; font-size: 13px; font-weight: 600;">
                    Google 로그인
                  </a>
                  <button id="swagger-refresh" type="button" style="background: #fff; color: #111; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 8px 10px; font-size: 13px; cursor: pointer;">
                    Refresh
                  </button>
                  <button id="swagger-logout" type="button" style="background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.25); border-radius: 10px; padding: 8px 10px; font-size: 13px; cursor: pointer;">
                    Logout
                  </button>
                  <span style="margin-left: auto; opacity: 0.85; font-size: 12px;">
                    쿠키 기반 인증: 로그인 후 Try it out 사용
                  </span>
                </div>
                <script>
                  (() => {
                    const post = async (url) => {
                      try {
                        await fetch(url, { method: "POST", credentials: "include" });
                      } finally {
                        window.location.reload();
                      }
                    };

                    const refreshBtn = document.getElementById("swagger-refresh");
                    if (refreshBtn) refreshBtn.addEventListener("click", () => post("/api/auth/refresh"));

                    const logoutBtn = document.getElementById("swagger-logout");
                    if (logoutBtn) logoutBtn.addEventListener("click", () => post("/api/auth/logout"));
                  })();
                </script>
                """;
    }
}
