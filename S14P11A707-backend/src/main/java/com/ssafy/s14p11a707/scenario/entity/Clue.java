package com.ssafy.s14p11a707.scenario.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.common.entity.CreatedAtEntity;
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
public class Clue extends CreatedAtEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "scenario_id", nullable = false)
    private Scenario scenario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Importance importance;

    @Lob
    private String description;

    @Column(length = 2048)
    private String detailImageUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode clueDetailJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "transform", columnDefinition = "jsonb")
    private JsonNode transformJson;

    @Column(length = 100)
    private String neo4jNodeAlias;

    @Builder
    public Clue(
            Scenario scenario,
            Room room,
            String name,
            Importance importance,
            String description,
            String detailImageUrl,
            JsonNode clueDetailJson,
            JsonNode transformJson,
            String neo4jNodeAlias
    ) {
        this.scenario = scenario;
        this.room = room;
        this.name = name;
        this.importance = importance;
        this.description = description;
        this.detailImageUrl = detailImageUrl;
        this.clueDetailJson = clueDetailJson;
        this.transformJson = transformJson;
        this.neo4jNodeAlias = neo4jNodeAlias;
    }

    public enum Importance {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }
}
