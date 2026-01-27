package com.ssafy.s14p11a707.config;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
public class VectorStoreConfig {

	private final EmbeddingModel embeddingModel;

	public VectorStoreConfig(EmbeddingModel embeddingModel) {
		this.embeddingModel = embeddingModel;
	}

	@Bean
	VectorStore vectorStore(DataSource dataSource, JdbcTemplate jdbcTemplate) {
		return PgVectorStore.builder(jdbcTemplate, embeddingModel)
				.build();

		//return SimpleVectorStore.builder(embeddingModel).build();
	}
}
