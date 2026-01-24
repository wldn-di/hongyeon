package com.ssafy.s14p11a707.scenario.repository;

import com.ssafy.s14p11a707.scenario.entity.Suspect;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SuspectRepository extends JpaRepository<Suspect, Long> {
}

