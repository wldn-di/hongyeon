package com.ssafy.s14p11a707.game.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Embeddable
@EqualsAndHashCode
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class SessionSuspectStateId implements Serializable {

    @Column(name = "session_id")
    private Long sessionId;

    @Column(name = "suspect_id")
    private Long suspectId;
}

