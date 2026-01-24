package com.ssafy.s14p11a707.game.repository;

import com.ssafy.s14p11a707.game.entity.BoardItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardItemRepository extends JpaRepository<BoardItem, Long> {
}

