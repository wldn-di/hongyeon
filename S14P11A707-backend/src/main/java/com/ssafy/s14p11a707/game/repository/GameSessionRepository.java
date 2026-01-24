package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameSessionRepository extends JpaRepository<GameSession, Long> {
}

