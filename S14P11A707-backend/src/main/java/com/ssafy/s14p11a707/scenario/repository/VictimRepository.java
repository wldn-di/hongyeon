package com.ssafy.s14p11a707.scenario.repository;

import com.ssafy.s14p11a707.scenario.entity.Victim;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VictimRepository extends JpaRepository<Victim, Long> {
}

