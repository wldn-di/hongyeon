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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Entity
@Table(name = "victims")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Victim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "scenario_id", nullable = false, unique = true)
    private Scenario scenario;

    @Column(nullable = false, length = 100)
    private String name;

    private Integer age;

    @Column(length = 20)
    private String gender;

    @Column(length = 100)
    private String occupation;

    @Lob
    @Column(nullable = false)
    private String background;

    @Column(length = 200)
    private String discoveryLocation;

    @Column(length = 100)
    private String estimatedDeathTime;

    @Column(length = 200)
    private String causeOfDeath;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode victimDetailJson;

    @Setter
    @Column(length = 500)
    private String portraitUrl;

    @Builder
    public Victim(
            Scenario scenario,
            String name,
            Integer age,
            String gender,
            String occupation,
            String background,
            String discoveryLocation,
            String estimatedDeathTime,
            String causeOfDeath,
            JsonNode victimDetailJson,
            String portraitUrl
    ) {
        this.scenario = scenario;
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.occupation = occupation;
        this.background = background;
        this.discoveryLocation = discoveryLocation;
        this.estimatedDeathTime = estimatedDeathTime;
        this.causeOfDeath = causeOfDeath;
        this.victimDetailJson = victimDetailJson;
        this.portraitUrl = portraitUrl;
    }

}
