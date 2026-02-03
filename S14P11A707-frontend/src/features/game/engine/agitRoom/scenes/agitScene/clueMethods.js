import Phaser from "phaser";

export const clueMethods = {
    isFlashlightRevealingClues() {
        const minAlpha = this.FLASHLIGHT_CLUE_REVEAL_MIN_ALPHA ?? 0.15;
        // 안전장치: flashlight 객체가 실제로 존재하는지 체크
        return Boolean(this.flashlight && this.flashlight.active && this.isFlashlightOn && this.flashAlpha > minAlpha);
    },

    isPointInFlashlightCone(x, y) {
        // 1. 안전장치: 손전등이 없거나 꺼져있으면 계산 중단
        if (!this.flashlight || !this.isFlashlightOn) return false;

        const originX = this.flashlight.x;
        const originY = this.flashlight.y;

        const dx = x - originX;
        const dy = y - originY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // [판정 거리] 750px * 스케일 * 1.3배 (아주 넓음)
        const baseRadius = 250;
        const currentScale = this.flashlight.scaleX || 1;
        const maxDist = baseRadius * currentScale * 1.0;

        if (dist > maxDist) return false;

        // [각도 계산] Phaser 의존성 제거 (순수 수학으로 구현)
        const angleToPoint = Math.atan2(dy, dx);
        const flashRotation = this.flashlight.rotation || 0;

        let delta = angleToPoint - flashRotation;

        // 각도 보정 (-PI ~ PI)
        while (delta <= -Math.PI) delta += Math.PI * 2;
        while (delta > Math.PI) delta -= Math.PI * 2;

        // [판정 각도] 약 82도 (좌우 합치면 164도) -> 거의 앞면 전체가 다 보임
        const leniencyAngle = Math.PI / 6;

        return Math.abs(delta) <= leniencyAngle;
    },

    updateClueVisibilityByFlashlight() {
        if (!Array.isArray(this.clues) || this.clues.length === 0) {
            return;
        }

        // 손전등이 켜져있는지 확인 (켜져있으면 true, 꺼져있으면 false)
        const revealing = this.isFlashlightRevealingClues();

        // 플레이어 몸 주변 감지 거리 (100px)
        const nearRadius = 40;
        const nearRadiusSq = nearRadius * nearRadius;

        const now = Number(this.time?.now) || 0;
        const REVEAL_GRACE_MS = 220;

        for (const clue of this.clues) {
            if (!clue || !clue.active) continue;

            const baseY = clue.getData("baseY") ?? clue.y;
            let isNearPlayer = false;

            if (this.player) {
                const dx = clue.x - this.player.x;
                const dy = baseY - this.player.y;
                isNearPlayer = (dx * dx + dy * dy) <= nearRadiusSq;
            }

            // [핵심 수정] 괄호 위치 변경!
            // 기존: isNearPlayer || (revealing && ...)  <-- 이게 문제였음
            // 변경: revealing && (isNearPlayer || ...)  <-- 손전등이 켜져 있어야만 뒤의 조건을 확인함
            const shouldReveal = revealing && (isNearPlayer || this.isPointInFlashlightCone(clue.x, baseY));

            // 손전등 흔들림/각도 경계로 인한 깜빡임 방지: 잠깐 유지(hysteresis)
            if (shouldReveal) {
                clue.setData("revealUntil", now + REVEAL_GRACE_MS);
            }

            const revealUntil = Number(clue.getData("revealUntil")) || 0;
            const keepRevealed = revealing && now < revealUntil;
            const isRevealed = shouldReveal || keepRevealed;

            if (isRevealed) {
                if (!clue.visible) {
                    clue.setVisible(true);
                    clue.y = baseY;
                    clue.setDepth(baseY);
                    this.resetClueVisual(clue);
                }
                continue;
            }

            // 안 보여야 하는 상황 (손전등 꺼짐 포함)
            if (clue.visible) {
                const baseY = clue.getData("baseY") ?? clue.y;
                clue.y = baseY;
                clue.setDepth(baseY);
                this.resetClueVisual(clue);
                clue.setVisible(false);
            }
        }

        // 손전등 밖으로 나가거나 꺼져서 타겟이 숨겨졌으면 하이라이트 해제
        if (this.highlightTarget && (!this.highlightTarget.active || !this.highlightTarget.visible)) {
            this.highlightTarget = null;
            if (this.interactGlow) {
                this.interactGlow.setVisible(false);
                this.interactGlow.setAlpha(0);
            }
            this.setClueSparkle(false);
        }
    },

    createClueSparkle() {
        if (!this.textures.exists("clue_spark")) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffffff, 1);
            g.fillCircle(2, 2, 2);
            g.generateTexture("clue_spark", 4, 4);
            g.destroy();
        }

        this.clueSparkle = this.add.particles(0, 0, "clue_spark", {
            lifespan: { min: 280, max: 560 },
            speed: { min: 6, max: 18 },
            angle: { min: 250, max: 290 },
            scale: { start: 1.0, end: 0 },
            alpha: { start: 0.9, end: 0 },
            quantity: 1,
            frequency: 120,
            blendMode: "ADD",
            on: false,
        });

        this.clueSparkle.setDepth(12010);
        this.clueSparkleEmitter = this.clueSparkle.emitters?.list?.[0] ?? null;
        this.clueSparkleOn = false;
    },

    setClueSparkle(active, x, y) {
        if (!this.clueSparkle || !this.clueSparkleEmitter) return;

        if (active) {
            this.clueSparkle.setPosition(x, y);
            if (!this.clueSparkleOn) {
                this.clueSparkleEmitter.start();
                this.clueSparkleOn = true;
            }
        } else {
            if (this.clueSparkleOn) {
                this.clueSparkleEmitter.stop();
                this.clueSparkleOn = false;
            }
        }
    },

    resetClueVisual(clue) {
        if (!clue || !clue.active) return;
        const baseTint = clue.getData("baseTint") ?? 0xffffff;
        const baseScale = clue.getData("baseScale") ?? this.CLUE_SCALE;
        clue.setTint(baseTint);
        clue.setAlpha(1);
        clue.setScale(baseScale);
    },

    createInspectUI() {
        const w = this.sys.game.config.width;
        const h = this.sys.game.config.height;

        this.inspectUI = this.add.container(w / 2, h / 2).setScrollFactor(0).setDepth(30000).setVisible(false);

        const panelW = 300;
        const panelH = 200;

        const bg = this.add.rectangle(0, 0, panelW, panelH, 0x000000, 0.9).setStrokeStyle(2, 0xffffff);
        const title = this.add.text(-panelW / 2 + 18, -panelH / 2 + 14, "TITLE", {
            fontSize: "18px",
            color: "#ffffff",
            fontStyle: "bold",
        });

        const body = this.add.text(-panelW / 2 + 18, -panelH / 2 + 48, "BODY", {
            fontSize: "14px",
            color: "#dddddd",
            wordWrap: { width: panelW - 36 },
            lineSpacing: 4,
        });

        const hint = this.add
            .text(panelW / 2 - 18, panelH / 2 - 14, "SPACE/ESC 닫기", { fontSize: "12px", color: "#aaaaaa" })
            .setOrigin(1, 1);

        this.inspectTitleText = title;
        this.inspectBodyText = body;
        this.inspectUI.add([bg, title, body, hint]);
    },

    openInspect(target) {
        if (!target) return;

        const title = target.getData("title") || "Unknown";
        const body = target.getData("body") || "";
        const evidenceId = target.getData("evidenceId") ?? null;
        const clueId = target.getData("clueId") ?? null;

        try {
            this.onClueInspected?.({ evidenceId, clueId, title, body });
        } catch (e) {
            console.error("AgitScene onClueInspected error:", e);
        }

        this.isInspecting = true;
        this.inspectTarget = null;

        this.inspectTitleText.setText(title);
        this.inspectBodyText.setText(body);
        this.inspectUI.setVisible(true);

        if (this.highlightTarget === target) this.highlightTarget = null;
        if (this.interactGlow) {
            this.interactGlow.setVisible(false);
            this.interactGlow.setAlpha(0);
        }
        this.setClueSparkle(false);

        const idx = this.clues.indexOf(target);
        if (idx !== -1) this.clues.splice(idx, 1);
        target.destroy();

        this.interactionContainer?.setVisible(false);
    },

    closeInspect() {
        this.isInspecting = false;
        this.inspectTarget = null;
        this.inspectUI?.setVisible(false);
    },

    spawnClues(clues) {
        const makeClue = ({ clueId, evidenceId, roomIndex, localX, localY, title, body }) => {
            const room = this.roomsData[roomIndex];
            if (!room) return;

            const x = room.x + localX;
            const y = room.y + localY;

            const clue = this.add.image(x, y, "clue_object");
            clue.setScale(this.CLUE_SCALE);

            // 엘리베이터/상단 벽 쪽(막힌 영역)으로 단서가 붙어 보이는 경우가 있어,
            // 스폰 위치를 "실제로 걸어다닐 수 있는 바닥 영역" 안으로 강제 클램프한다.
            // (상단 벽/문 이미지 영역 밖으로 내려오게)
            const roomLeft = room.x;
            const roomRight = room.x + this.ROOM_WIDTH;
            const roomTop = room.y;
            const roomBottom = room.y + this.ROOM_WIDTH;

            const halfW = (clue.displayWidth || clue.width || 0) * 0.5;
            const halfH = (clue.displayHeight || clue.height || 0) * 0.5;

            const insetX = 18;
            const insetBottom = 18;
            // 상단 벽(엘리베이터/벽) 라인 아래쪽으로 충분히 내려오게
            const safeTopY = roomTop + 68;

            const minX = roomLeft + insetX + halfW;
            const maxX = roomRight - insetX - halfW;
            const minY = safeTopY + halfH;
            const maxY = roomBottom - insetBottom - halfH;

            if (minX <= maxX) clue.x = Phaser.Math.Clamp(clue.x, minX, maxX);
            else clue.x = (roomLeft + roomRight) * 0.5;

            if (minY <= maxY) clue.y = Phaser.Math.Clamp(clue.y, minY, maxY);
            else clue.y = (roomTop + roomBottom) * 0.5;

            clue.setDepth(clue.y);
            clue.setTint(0xffffff);
            clue.setVisible(false);
            clue.setData("clueId", clueId ?? null);
            clue.setData("evidenceId", evidenceId ?? null);
            clue.setData("title", title ?? "Unknown");
            clue.setData("body", body ?? "");
            clue.setData("baseTint", 0xffffff);
            clue.setData("baseScale", this.CLUE_SCALE);
            clue.setData("baseY", clue.y);
            this.clues.push(clue);
        };

        (Array.isArray(clues) ? clues : []).forEach((c, idx) => {
            const roomIndex = Number.isFinite(c?.roomIndex) ? c.roomIndex : null;
            const localX = Number.isFinite(c?.localX) ? c.localX : null;
            const localY = Number.isFinite(c?.localY) ? c.localY : null;
            if (roomIndex == null || localX == null || localY == null) return;

            makeClue({
                clueId: c?.clueId ?? idx,
                evidenceId: c?.evidenceId ?? null,
                roomIndex,
                localX,
                localY,
                title: c?.title ?? "Unknown",
                body: c?.body ?? "",
            });
        });
    },

    clearClues() {
        if (!Array.isArray(this.clues) || this.clues.length === 0) return;
        this.clues.forEach((clue) => {
            if (clue && clue.destroy) clue.destroy();
        });
        this.clues = [];
    },

    setClues(nextClues) {
        this.clearClues();
        this.spawnClues(nextClues);
    },

    getNearestClue(maxDist) {
        if (!this.player || this.clues.length === 0) return null;

        let best = null;
        let bestD = Infinity;
        for (const obj of this.clues) {
            if (!obj || !obj.active || !obj.visible) continue;
            const dx = obj.x - this.player.x;
            const dy = obj.y - this.player.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < bestD) {
                bestD = d;
                best = obj;
            }
        }
        if (!best || bestD > maxDist) return null;
        return { obj: best, dist: bestD };
    },

    updateNearestClueHighlight(time) {
        if (!this.interactGlow || !this.player || this.isInspecting) return;

        if (time < this.lastHighlightCheck + 90) {
            if (this.highlightTarget && this.interactGlow.visible) {
                const pulse = 0.5 + 0.5 * Math.sin(time * 0.02 + (this.highlightTarget.x + this.highlightTarget.y) * 0.01);
                this.interactGlow.setAlpha(Phaser.Math.Clamp(0.14 + 0.10 * pulse, 0, 0.35));
            }
            return;
        }
        this.lastHighlightCheck = time;

        const nearest = this.getNearestClue(this.CLUE_HIGHLIGHT_RADIUS);

        if (!nearest) {
            if (this.highlightTarget) {
                const baseTint = this.highlightTarget.getData("baseTint") ?? 0xffffff;
                const baseScale = this.highlightTarget.getData("baseScale") ?? this.CLUE_SCALE;
                const baseY = this.highlightTarget.getData("baseY") ?? this.highlightTarget.y;

                this.highlightTarget.setTint(baseTint);
                this.highlightTarget.setAlpha(1);
                this.highlightTarget.setScale(baseScale);
                this.highlightTarget.y = baseY;
                this.highlightTarget.setDepth(baseY);
            }

            this.highlightTarget = null;
            this.interactGlow.setVisible(false);
            this.interactGlow.setAlpha(0);

            this.setClueSparkle(false);
            return;
        }

        const best = nearest.obj;
        const dist = nearest.dist;

        if (this.highlightTarget !== best) {
            if (this.highlightTarget) {
                const baseTint = this.highlightTarget.getData("baseTint") ?? 0xffffff;
                const baseScale = this.highlightTarget.getData("baseScale") ?? this.CLUE_SCALE;
                const baseY = this.highlightTarget.getData("baseY") ?? this.highlightTarget.y;

                this.highlightTarget.setTint(baseTint);
                this.highlightTarget.setAlpha(1);
                this.highlightTarget.setScale(baseScale);
                this.highlightTarget.y = baseY;
                this.highlightTarget.setDepth(baseY);
            }

            this.highlightTarget = best;

            if (best.getData("baseY") == null) best.setData("baseY", best.y);
            if (best.getData("baseScale") == null) best.setData("baseScale", this.CLUE_SCALE);
            if (best.getData("baseTint") == null) best.setData("baseTint", 0xffffff);
        }

        const t = Phaser.Math.Clamp(1 - dist / this.CLUE_HIGHLIGHT_RADIUS, 0, 1);
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.02 + (best.x + best.y) * 0.01);

        const baseY = best.getData("baseY") ?? best.y;
        const bobAmp = 3;
        const bob = Math.sin(time * 0.004 + best.x * 0.01) * bobAmp * (0.35 + 0.65 * t);
        best.y = baseY + bob;
        best.setDepth(best.y);

        const baseScale = best.getData("baseScale") ?? this.CLUE_SCALE;
        const scaleAmp = 0.14;
        best.setTint(0xffffff);
        best.setAlpha(0.82 + 0.18 * pulse);
        best.setScale(baseScale * (1 + scaleAmp * pulse * (0.35 + 0.65 * t)));

        this.interactGlow.setVisible(true);
        this.interactGlow.setPosition(best.x, best.y);

        const w = best.displayWidth || best.width || 64;
        const h = best.displayHeight || best.height || 64;
        const s = Math.max(w, h) / 130;

        this.interactGlow.setScale(s * (1 + 0.35 * t));
        this.interactGlow.setDepth((best.depth ?? best.y) + 0.5);

        const glowA = 0.10 + 0.38 * t + 0.10 * pulse;
        this.interactGlow.setAlpha(Phaser.Math.Clamp(glowA, 0, 0.75));

        const sparkleOn = t > 0.55;
        this.setClueSparkle(sparkleOn, best.x, best.y - 12);
    },
};
