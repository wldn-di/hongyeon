package com.ssafy.s14p11a707.scenario.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.common.entity.BaseEntity;
import com.ssafy.s14p11a707.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Entity
@Table(name = "scenarios")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Scenario extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private User creator;

    @Column(nullable = false, length = 200)
    private String title;

    @Lob
    @Column(nullable = false, columnDefinition = "text")
    private String userSynopsis;

    @Lob
    @Column(columnDefinition = "text")
    private String synopsis;

    private Integer suspectCount;

    @Column(nullable = false, length = 50)
    private String genre;

    @Lob
    @Column(columnDefinition = "text")
    private String synopsisDetail;

    @Setter
    @Column(length = 500)
    private String thumbnailUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private GenerationStatus generationStatus;

    @Lob
    @Column(columnDefinition = "text")
    private String generationError;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode storyConfigJson;

    @Setter
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode truthConfigJson;

    @Column(name = "correct_motive_embedding", columnDefinition = "text")
    private String correctMotiveEmbedding;

    @Column(nullable = false)
    private int playCount;

    private BigDecimal avgRating;

    private BigDecimal avgDifficulty;

    @Builder
    public Scenario(
            User creator,
            String title,
            String userSynopsis,
            String synopsis,
            Integer suspectCount,
            String genre,
            String synopsisDetail,
            String thumbnailUrl,
            GenerationStatus generationStatus,
            String generationError,
            JsonNode storyConfigJson,
            JsonNode truthConfigJson,
            String correctMotiveEmbedding,
            int playCount,
            BigDecimal avgRating,
            BigDecimal avgDifficulty
    ) {
        this.creator = creator;
        this.title = title;
        this.userSynopsis = userSynopsis;
        this.synopsis = synopsis;
        this.suspectCount = suspectCount;
        this.genre = genre;
        this.synopsisDetail = synopsisDetail;
        this.thumbnailUrl = thumbnailUrl;
        this.generationStatus = generationStatus;
        this.generationError = generationError;
        this.storyConfigJson = storyConfigJson;
        this.truthConfigJson = truthConfigJson;
        this.correctMotiveEmbedding = correctMotiveEmbedding;
        this.playCount = playCount;
        this.avgRating = avgRating;
        this.avgDifficulty = avgDifficulty;
    }

    public void updateAverages(BigDecimal avgRating, BigDecimal avgDifficulty) {
        this.avgRating = avgRating;
        this.avgDifficulty = avgDifficulty;
    }

    public void incrementPlayCount() {
        this.playCount++;
    }

    public void completeGeneration(String title, String synopsis, String synopsisDetail,
                                  JsonNode storyConfig, JsonNode truthConfig, String motiveEmbedding) {
        this.title = title;
        this.synopsis = synopsis;
        this.synopsisDetail = synopsisDetail;
        this.storyConfigJson = storyConfig;
        this.truthConfigJson = truthConfig;
        this.correctMotiveEmbedding = motiveEmbedding;
        this.generationStatus = GenerationStatus.COMPLETED;
        this.playCount = 0;
    }

    public void applyGeneratedContent(
            String title,
            String synopsis,
            String synopsisDetail,
            JsonNode storyConfigJson,
            JsonNode truthConfigJson,
            String correctMotiveEmbedding
    ) {
        this.title = title;
        this.synopsis = synopsis;
        this.synopsisDetail = synopsisDetail;
        this.storyConfigJson = storyConfigJson;
        this.truthConfigJson = truthConfigJson;
        this.correctMotiveEmbedding = correctMotiveEmbedding;
        this.generationError = null;
    }

    public enum GenerationStatus {
        GENERATING,
        COMPLETED,
        FAILED
    }

    public void failGeneration(String errorMessage) {
        this.generationStatus = GenerationStatus.FAILED;
        this.generationError = errorMessage;
    }
}
