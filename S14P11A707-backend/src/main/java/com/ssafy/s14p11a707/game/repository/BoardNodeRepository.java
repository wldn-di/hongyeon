package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.BoardNode;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardNodeRepository extends JpaRepository<BoardNode, Long> {
}

