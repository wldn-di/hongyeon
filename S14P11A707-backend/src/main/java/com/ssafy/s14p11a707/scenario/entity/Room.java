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
@Table(name = "rooms")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Room extends CreatedAtEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "scenario_id", nullable = false)
    private Scenario scenario;

    @Column(nullable = false)
    private int floorNumber;

    @Column(length = 50)
    private String roomType;

    @Column(nullable = false, length = 200)
    private String roomName;

    @Lob
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode objectJson;

    @Builder
    public Room(
            Scenario scenario,
            int floorNumber,
            String roomType,
            String roomName,
            String description,
            JsonNode objectJson
    ) {
        this.scenario = scenario;
        this.floorNumber = floorNumber;
        this.roomType = roomType;
        this.roomName = roomName;
        this.description = description;
        this.objectJson = objectJson;
    }
}
