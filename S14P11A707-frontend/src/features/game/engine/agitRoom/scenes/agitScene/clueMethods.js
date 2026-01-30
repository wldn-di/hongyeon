import Phaser from "phaser";

export const clueMethods = {
    isFlashlightRevealingClues() {
        const minAlpha = this.FLASHLIGHT_CLUE_REVEAL_MIN_ALPHA ?? 0.15;
        return Boolean(this.flashlight && this.isFlashlightOn && this.flashAlpha > minAlpha);
    },

    isPointInFlashlightCone(x, y) {
        if (!this.isFlashlightRevealingClues()) return false;

        const originX = this.flashlight.x;
        const originY = this.flashlight.y;

        const dx = x - originX;
        const dy = y - originY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const baseRadius = this.FLASHLIGHT_CLUE_REVEAL_RADIUS ?? 210;
        const radius = baseRadius * (this.flashlight.scaleX ?? 1);
        if (dist > radius) return false;

        const angleToPoint = Math.atan2(dy, dx);
        const delta = Phaser.Math.Angle.Wrap(angleToPoint - this.flashlight.rotation);

        const halfAngle = this.FLASHLIGHT_CLUE_REVEAL_HALF_ANGLE ?? Math.PI / 10;
        return Math.abs(delta) <= halfAngle;
    },

    updateClueVisibilityByFlashlight() {
        if (!Array.isArray(this.clues) || this.clues.length === 0) {
            return;
        }

        const revealing = this.isFlashlightRevealingClues();

        for (const clue of this.clues) {
            if (!clue || !clue.active) continue;

            const baseY = clue.getData("baseY") ?? clue.y;
            const shouldReveal = revealing && this.isPointInFlashlightCone(clue.x, baseY);
            if (shouldReveal) {
                if (!clue.visible) {
                    clue.setVisible(true);
                    clue.y = baseY;
                    clue.setDepth(baseY);
                    this.resetClueVisual(clue);
                }
                continue;
            }

            if (clue.visible) {
                const baseY = clue.getData("baseY") ?? clue.y;
                clue.y = baseY;
                clue.setDepth(baseY);
                this.resetClueVisual(clue);
                clue.setVisible(false);
            }
        }

        // 손전등 밖으로 나가서 타겟이 숨겨졌으면 즉시 정리
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
    
        // on:false 로 시작 꺼두기
        this.clueSparkle = this.add.particles(0, 0, "clue_spark", {
            lifespan: { min: 280, max: 560 },
            speed: { min: 6, max: 18 },
            angle: { min: 250, max: 290 }, // 위로 살짝 퍼짐
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
    
        // 하이라이트/스파클 정리
        if (this.highlightTarget === target) this.highlightTarget = null;
        if (this.interactGlow) {
            this.interactGlow.setVisible(false);
            this.interactGlow.setAlpha(0);
        }
        this.setClueSparkle(false);
    
        // clues 배열에서 제거 + 삭제
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
            clue.setDepth(y);
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
    
        // 90ms마다만 갱신(성능)
        if (time < this.lastHighlightCheck + 90) {
            // 펄스만 조금 유지(글로우만)
            if (this.highlightTarget && this.interactGlow.visible) {
                const pulse = 0.5 + 0.5 * Math.sin(time * 0.02 + (this.highlightTarget.x + this.highlightTarget.y) * 0.01);
                this.interactGlow.setAlpha(Phaser.Math.Clamp(0.14 + 0.10 * pulse, 0, 0.35));
            }
            return;
        }
        this.lastHighlightCheck = time;
    
        const nearest = this.getNearestClue(this.CLUE_HIGHLIGHT_RADIUS);
    
        // 범위 밖이면 원복
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
    
        // 타겟 바뀌면 이전 타겟 원복
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
    
            // 혹시 baseY/baseScale이 없으면 안전하게 저장(이미 있으면 무시)
            if (best.getData("baseY") == null) best.setData("baseY", best.y);
            if (best.getData("baseScale") == null) best.setData("baseScale", this.CLUE_SCALE);
            if (best.getData("baseTint") == null) best.setData("baseTint", 0xffffff);
        }
    
        // 가까울수록 강도 증가
        const t = Phaser.Math.Clamp(1 - dist / this.CLUE_HIGHLIGHT_RADIUS, 0, 1);
    
        // 펄스(반짝/확대)
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.02 + (best.x + best.y) * 0.01);
    
        // ✅ 둥실(bob) : 위아래 이동
        const baseY = best.getData("baseY") ?? best.y;
        const bobAmp = 3; // <- 움직임 크기(원하면 6~12)
        const bob = Math.sin(time * 0.004 + best.x * 0.01) * bobAmp * (0.35 + 0.65 * t);
        best.y = baseY + bob;
        best.setDepth(best.y);
    
        // ✅ 증거 자체 반짝/확대(폭 더 큼)
        const baseScale = best.getData("baseScale") ?? this.CLUE_SCALE;
    
        // 스케일 폭: 0.09 -> 0.14로 더 크게(원하면 0.18까지)
        const scaleAmp = 0.14;
        best.setTint(0xffffff);
        best.setAlpha(0.82 + 0.18 * pulse); // 알파도 조금 더 크게
        best.setScale(baseScale * (1 + scaleAmp * pulse * (0.35 + 0.65 * t)));
    
        // ✅ 글로우 강화(가까울수록 밝고 크게)
        this.interactGlow.setVisible(true);
        this.interactGlow.setPosition(best.x, best.y);
    
        const w = best.displayWidth || best.width || 64;
        const h = best.displayHeight || best.height || 64;
        const s = Math.max(w, h) / 130;
    
        this.interactGlow.setScale(s * (1 + 0.35 * t));
        this.interactGlow.setDepth((best.depth ?? best.y) + 0.5);
    
        const glowA = 0.10 + 0.38 * t + 0.10 * pulse;
        this.interactGlow.setAlpha(Phaser.Math.Clamp(glowA, 0, 0.75));
    
        // ✅ 아주 가까우면 스파클 ON
        const sparkleOn = t > 0.55;
        this.setClueSparkle(sparkleOn, best.x, best.y - 12);
    },

};
