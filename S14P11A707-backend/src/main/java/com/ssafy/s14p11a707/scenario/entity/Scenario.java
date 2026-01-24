package com.ssafy.s14p11a707.scenario.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.common.entity.BaseEntity;
import com.ssafy.s14p11a707.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 500)
    private String synopsis;

    @Column(nullable = false)
    private int suspectCount;

    @Lob
    private String synopsisDetail;

    @Column(length = 50)
    private String genre;

    @Column(length = 2048)
    private String thumbnailUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode storyConfigJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode truthConfigJson;

    @Column(nullable = false)
    private int playCount;

    private BigDecimal avgRating;

    private BigDecimal avgDifficulty;

    @Builder
    public Scenario(
            User creator,
            String title,
            String synopsis,
            int suspectCount,
            String synopsisDetail,
            String genre,
            String thumbnailUrl,
            JsonNode storyConfigJson,
            JsonNode truthConfigJson,
            int playCount,
            BigDecimal avgRating,
            BigDecimal avgDifficulty
    ) {
        this.creator = creator;
        this.title = title;
        this.synopsis = synopsis;
        this.suspectCount = suspectCount;
        this.synopsisDetail = synopsisDetail;
        this.genre = genre;
        this.thumbnailUrl = thumbnailUrl;
        this.storyConfigJson = storyConfigJson;
        this.truthConfigJson = truthConfigJson;
        this.playCount = playCount;
        this.avgRating = avgRating;
        this.avgDifficulty = avgDifficulty;
    }
}
