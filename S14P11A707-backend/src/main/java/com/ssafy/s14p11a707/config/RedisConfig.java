package com.ssafy.s14p11a707.config;

import com.ssafy.s14p11a707.scenario.v2.event.ScenarioV2RedisSubscriber;
import java.time.Duration;
import java.util.Map;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration(proxyBeanMethods = false)
@EnableCaching
public class RedisConfig {

    public static final String SCENARIO_TOP10_PLAY_COUNT = "scenarioTop10PlayCount";
    public static final String SCENARIO_TOP10_RATING = "scenarioTop10Rating";
    public static final String SCENARIO_V2_EVENTS_TOPIC = "scenario.v2.events";

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        RedisCacheConfiguration ttl5m = defaultConfig.entryTtl(Duration.ofMinutes(5));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(Map.of(
                        SCENARIO_TOP10_PLAY_COUNT, ttl5m,
                        SCENARIO_TOP10_RATING, ttl5m
                ))
                .build();
    }

    @Bean
    public ChannelTopic scenarioV2EventsTopic() {
        return new ChannelTopic(SCENARIO_V2_EVENTS_TOPIC);
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            ChannelTopic scenarioV2EventsTopic,
            ScenarioV2RedisSubscriber scenarioV2RedisSubscriber
    ) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(scenarioV2RedisSubscriber, scenarioV2EventsTopic);
        return container;
    }
}
