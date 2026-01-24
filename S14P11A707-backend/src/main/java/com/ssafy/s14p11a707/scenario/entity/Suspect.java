package com.ssafy.s14p11a707.scenario.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.s14p11a707.common.entity.CreatedAtEntity;
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
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Entity
@Table(name = "suspects")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Suspect extends CreatedAtEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "scenario_id", nullable = false)
    private Scenario scenario;

    @Column(nullable = false, length = 100)
    private String name;

    private int age;

    @Column(length = 20)
    private String gender;

    @Column(length = 100)
    private String role;

    @Column(length = 300)
    private String oneLiner;

    @Column(name = "is_culprit", nullable = false)
    private boolean culprit;

    @Lob
    private String motive;

    @Column(nullable = false)
    private int displayOrder;

    @Column(length = 2048)
    private String portraitUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode aiConfigJson;

    @Builder
    public Suspect(
            Scenario scenario,
            String name,
            int age,
            String gender,
            String role,
            String oneLiner,
            boolean culprit,
            String motive,
            int displayOrder,
            String portraitUrl,
            JsonNode aiConfigJson
    ) {
        this.scenario = scenario;
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.role = role;
        this.oneLiner = oneLiner;
        this.culprit = culprit;
        this.motive = motive;
        this.displayOrder = displayOrder;
        this.portraitUrl = portraitUrl;
        this.aiConfigJson = aiConfigJson;
    }
}
