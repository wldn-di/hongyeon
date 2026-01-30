package com.ssafy.s14p11a707.scenario.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ssafy.s14p11a707.scenario.domain.RoomAsset;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RoomLayoutServiceImpl implements RoomLayoutService {

    private final ObjectMapper objectMapper;

    // Phaser 맵 크기 상수
    private static final int ROOM_WIDTH = 320;
    private static final int ROOM_HEIGHT = 320;
    private static final int PADDING = 30; // 벽 여유 공간
    private static final int ITEM_GAP = 5; // 아이템 간 최소 간격

    // 내부용: 충돌 계산을 위한 사각형 클래스
    private record Rect(int x, int y, int width, int height) {
        public boolean intersects(Rect other) {
            return this.x < other.x + other.width &&
                    this.x + this.width > other.x &&
                    this.y < other.y + other.height &&
                    this.y + this.height > other.y;
        }
    }


    @Override
    public JsonNode generateRandomLayout(String roomType) {
        ArrayNode objectsArray = objectMapper.createArrayNode();
        List<Rect> occupiedRects = new ArrayList<>(); // 이미 배치된 자리 목록

        // 1. 해당 방에 놓을 수 있는 가구들 가져오기
        List<RoomAsset> candidates = RoomAsset.getAssetsByRoomType(roomType);
        if (candidates.isEmpty()) return objectsArray;

        // 2. 가구 섞기
        List<RoomAsset> shuffledAssets = new ArrayList<>(candidates);
        Collections.shuffle(shuffledAssets);

        // 3. 배치할 개수 랜덤 설정 (3 ~ 5개)
        int targetCount = 3 + (int)(Math.random() * 3);
        Random random = new Random();

        // 문(엘리베이터) 위치: 중앙 하단 (여기 막으면 안 됨)
        int doorX = ROOM_WIDTH / 2;
        int doorY = ROOM_WIDTH - 40;
        int doorSafeRadius = 60; // 문 주변 60px 비우기

        // 4. 배치 루프
        int placedCount = 0;
        for (RoomAsset asset : shuffledAssets) {
            if (placedCount >= targetCount) break;

            boolean placed = false;
            int attempts = 0;

            // 한 가구당 20번 위치 잡기 시도
            while (!placed && attempts < 20) {
                attempts++;
                int x = 0, y = 0;
                String rule = asset.getPlacement(); // top wall, center 등

                // [규칙 1] 위치 결정 로직
                if ("top wall".equalsIgnoreCase(rule)) {
                    // 북쪽 벽에 붙이기 (Y 고정)
                    x = PADDING + random.nextInt(ROOM_WIDTH - 2 * PADDING - asset.getWidth());
                    y = 35; // 벽 두께 고려
                } else if ("center".equalsIgnoreCase(rule)) {
                    // 방 중앙 근처
                    x = (ROOM_WIDTH - asset.getWidth()) / 2 + (random.nextInt(60) - 30);
                    y = (ROOM_HEIGHT - asset.getHeight()) / 2 + (random.nextInt(60) - 30);
                } else {
                    // anywhere, floor (자유 배치)
                    x = PADDING + random.nextInt(ROOM_WIDTH - 2 * PADDING - asset.getWidth());
                    y = PADDING + random.nextInt(ROOM_HEIGHT - 2 * PADDING - asset.getHeight());
                }

                // 현재 시도하는 위치의 사각형 (여유 공간 포함)
                Rect newRect = new Rect(x - ITEM_GAP, y - ITEM_GAP,
                        asset.getWidth() + ITEM_GAP*2,
                        asset.getHeight() + ITEM_GAP*2);

                // [규칙 2] 문 막는지 확인
                double distToDoor = Math.sqrt(Math.pow(x + asset.getWidth()/2.0 - doorX, 2) +
                        Math.pow(y + asset.getHeight()/2.0 - doorY, 2));
                if (distToDoor < doorSafeRadius) continue;

                // [규칙 3] 다른 가구와 겹치는지 확인 (충돌 검사)
                boolean collision = false;
                for (Rect existing : occupiedRects) {
                    if (newRect.intersects(existing)) {
                        collision = true;
                        break;
                    }
                }

                // [성공] 배치 확정
                if (!collision) {
                    occupiedRects.add(newRect);

                    ObjectNode objNode = objectsArray.addObject();
                    objNode.put("name", asset.getObjectName()); // 프론트 이미지 파일명
                    objNode.put("x", x);
                    objNode.put("y", y);

                    placed = true;
                    placedCount++;
                }
            }
        }

        return objectsArray;
    }
}
