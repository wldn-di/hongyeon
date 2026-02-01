package com.ssafy.s14p11a707.scenario.entity;

import com.fasterxml.jackson.databind.JsonNode;
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
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Entity
@Table(name = "clues")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Clue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "scenario_id", nullable = false)
    private Scenario scenario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Importance importance;

    @Lob
    @Column(nullable = false)
    private String description;

    @Column(length = 500)
    private String detailImageUrl;

    @Lob
    private String assistantComment;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode clueDetailJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "transform", nullable = false, columnDefinition = "jsonb")
    private JsonNode transformJson;

    @Builder
    public Clue(
            Scenario scenario,
            Room room,
            String name,
            Importance importance,
            String description,
            String detailImageUrl,
            String assistantComment,
            JsonNode clueDetailJson,
            JsonNode transformJson
    ) {
        this.scenario = scenario;
        this.room = room;
        this.name = name;
        this.importance = importance;
        this.description = description;
        this.detailImageUrl = detailImageUrl;
        this.assistantComment = assistantComment;
        this.clueDetailJson = clueDetailJson;
        this.transformJson = transformJson;
    }

    public void setDetailImageUrl(String detailImageUrl) {
        this.detailImageUrl = detailImageUrl;
    }

    public enum Importance {
        CRITICAL,
        SUPPORTING,
        RED_HERRING
    }
}
