package com.ssafy.s14p11a707;

import org.springframework.ai.model.openai.autoconfigure.OpenAiEmbeddingAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.retry.annotation.EnableRetry;

@EnableCaching
@EnableRetry
@SpringBootApplication(exclude = {OpenAiEmbeddingAutoConfiguration.class})
public class S14P11A707Application {

    public static void main(String[] args) {
        SpringApplication.run(S14P11A707Application.class, args);
    }

}