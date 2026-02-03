package com.ssafy.s14p11a707.scenario.entity;

import com.fasterxml.jackson.databind.JsonNode;
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
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Entity
@Table(name = "suspects")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Suspect {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "scenario_id", nullable = false)
    private Scenario scenario;

    @Column(nullable = false, length = 100)
    private String name;

    private Integer age;

    @Column(length = 20)
    private String gender;

    @Column(length = 100)
    private String occupation;

    @Column(length = 500)
    private String oneLiner;

    @Column(name = "is_culprit", nullable = false)
    private boolean culprit;

    @Lob
    private String motive;

    private Integer displayOrder;

    @Setter
    @Column(length = 500)
    private String portraitUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private JsonNode aiConfigJson;

    @Builder
    public Suspect(
            Scenario scenario,
            String name,
            Integer age,
            String gender,
            String occupation,
            String oneLiner,
            boolean culprit,
            String motive,
            Integer displayOrder,
            String portraitUrl,
            JsonNode aiConfigJson
    ) {
        this.scenario = scenario;
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.occupation = occupation;
        this.oneLiner = oneLiner;
        this.culprit = culprit;
        this.motive = motive;
        this.displayOrder = displayOrder;
        this.portraitUrl = portraitUrl;
        this.aiConfigJson = aiConfigJson;
    }

    public void setAiConfigJson(JsonNode aiConfigJson) {
        this.aiConfigJson = aiConfigJson;
    }

}
