package com.ssafy.s14p11a707.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.info.GitProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String TITLE = "S14P11A707 API";
    private static final String DEFAULT_VERSION = "0.0.1-SNAPSHOT";

    @Bean
    public OpenAPI openAPI(ObjectProvider<GitProperties> gitProvider) {
        GitProperties git = gitProvider.getIfAvailable();
        String version = resolveVersion();

        return new OpenAPI()
                .info(new Info()
                        .title(TITLE)
                        .version(version)
                        .description(gitDescription(git)));
    }

    private static String resolveVersion() {
        Package pkg = OpenApiConfig.class.getPackage();
        String version = (pkg != null) ? pkg.getImplementationVersion() : null;
        return (version != null && !version.isBlank()) ? version : DEFAULT_VERSION;
    }

    private static String gitDescription(GitProperties git) {
        if (git == null) {
            return null;
        }

        StringBuilder sb = new StringBuilder("## Git\n\n");

        if (git.getBranch() != null && !git.getBranch().isBlank()) {
            sb.append("- Branch: ").append(git.getBranch()).append("\n");
        }
        if (git.getCommitId() != null && !git.getCommitId().isBlank()) {
            sb.append("- Commit: `").append(git.getCommitId()).append("`\n");
        }

        String commitTime = git.get("commit.time");
        if (commitTime != null && !commitTime.isBlank()) {
            sb.append("- Commit Time: ").append(commitTime).append("\n");
        }
        String commitUser = git.get("commit.user.name");
        if (commitUser != null && !commitUser.isBlank()) {
            sb.append("- Commit User: ").append(commitUser).append("\n");
        }
        String commitMessage = git.get("commit.message.short");
        if (commitMessage != null && !commitMessage.isBlank()) {
            sb.append("- Message: ").append(commitMessage).append("\n");
        }

        sb.append("\n")
                .append("See `/actuator/info` for full details.\n");
        return sb.toString();
    }
}
