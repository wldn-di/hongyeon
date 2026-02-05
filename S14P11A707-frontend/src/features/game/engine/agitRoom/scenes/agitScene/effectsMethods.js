import Phaser from "phaser";

export const effectsMethods = {
    createVignette() {
        const w = this.sys.game.config.width;
        const h = this.sys.game.config.height;
    
        if (!this.textures.exists("vignette_tex")) {
            const tex = this.textures.createCanvas("vignette_tex", w, h);
            const ctx = tex.getContext();
    
            const grd = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.15, w / 2, h / 2, Math.min(w, h) * 0.75);
            grd.addColorStop(0.0, "rgba(0,0,0,0)");
            grd.addColorStop(0.55, "rgba(0,0,0,0.05)");
            grd.addColorStop(0.75, "rgba(0,0,0,0.25)");
            grd.addColorStop(1.0, "rgba(0,0,0,0.65)");
    
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, w, h);
            tex.refresh();
        }
    
        this.vignette = this.add.image(w / 2, h / 2, "vignette_tex").setScrollFactor(0).setDepth(10000).setAlpha(0.9);
    },

    createStaticNoise() {
        const screenW = this.sys.game.config.width;
        const screenH = this.sys.game.config.height;
    
        if (!this.textures.exists("noise_grain")) {
            const noiseTex = this.textures.createCanvas("noise_grain", 64, 64);
            const nCtx = noiseTex.getContext();
            const imgData = nCtx.createImageData(64, 64);
            for (let i = 0; i < imgData.data.length; i += 4) {
                const val = Math.random() * 255;
                imgData.data[i] = val;
                imgData.data[i + 1] = val;
                imgData.data[i + 2] = val;
                imgData.data[i + 3] = 80;
            }
            nCtx.putImageData(imgData, 0, 0);
            noiseTex.refresh();
        }
    
        this.staticNoise = this.add
            .tileSprite(screenW / 2, screenH / 2, screenW, screenH, "noise_grain")
            .setScrollFactor(0)
            .setDepth(10002)
            .setScale(4)
            .setAlpha(this.grainBaseAlpha);
    },

    createFlashlight() {
        const canvasSize = 340;
        const centerY = canvasSize / 2;
        const radius = 210;
    
        // UV-ish cone 색감을 위해 항상 재생성 (개발 중 HMR에서도 색 변경이 반영되도록)
        if (this.textures.exists("flashlight_cone")) {
            this.textures.remove("flashlight_cone");
        }

        const lightTex = this.textures.createCanvas("flashlight_cone", canvasSize, canvasSize);
        const ctx = lightTex.getContext();
    
        const grd = ctx.createRadialGradient(0, centerY, 0, 0, centerY, radius);
        // UV 손전등 느낌(약간 푸르스름/보라빛)
        grd.addColorStop(0.0, "rgba(205, 120, 255, 0.44)");
        grd.addColorStop(0.28, "rgba(175, 145, 255, 0.22)");
        grd.addColorStop(0.62, "rgba(135, 155, 255, 0.10)");
        grd.addColorStop(1.0, "rgba(0, 0, 0, 0)");
    
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.arc(0, centerY, radius, -Math.PI / 10, Math.PI / 10);
        ctx.lineTo(0, centerY);
        ctx.fill();
    
        try {
            ctx.save();
            ctx.filter = "blur(6px)";
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = "rgba(210,130,255,0.26)";
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.arc(0, centerY, radius * 0.98, -Math.PI / 10, Math.PI / 10);
            ctx.lineTo(0, centerY);
            ctx.fill();
            ctx.restore();
        } catch {}
    
        lightTex.refresh();
    
        this.flashlight = this.add.image(this.player.x, this.player.y, "flashlight_cone");
        this.flashlight.setOrigin(0, 0.5);
        this.flashlight.setDepth(9003);
        this.flashlight.setBlendMode(Phaser.BlendModes.ADD);
        this.flashlight.setVisible(false);
        this.flashlight.setAlpha(0);
        this.flashAlpha = 0;
        this.flashAlphaIntent = 0;
    },

    createFlashlightDust() {
        // UV 느낌을 위해 재생성
        if (this.textures.exists("flash_dust")) {
            this.textures.remove("flash_dust");
        }

        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xd2b7ff, 0.85);
        g.fillCircle(2, 2, 2);
        g.generateTexture("flash_dust", 4, 4);
    
        this.flashDust = this.add.particles(0, 0, "flash_dust", {
            lifespan: { min: 500, max: 900 },
            speed: { min: 2, max: 14 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.0, end: 0 },
            alpha: { start: 0.35, end: 0 },
            frequency: 70,
            blendMode: "ADD",
            on: false,
        });
        this.flashDust.setDepth(9004);
        this.flashDustEmitter = this.flashDust.emitters?.list?.[0] ?? null;
        this.flashDustOn = false;
    },

    updateFlashlightDust(time) {
        if (!this.flashDust || !this.flashDustEmitter || !this.flashlight) return;
    
        const active = this.isFlashlightOn && this.flashAlpha > 0.15;
        if (active) {
            const offsetDist = 60;
            const angle = this.flashlight.rotation;
            const offsetX = Math.cos(angle) * offsetDist;
            const offsetY = Math.sin(angle) * offsetDist;
            this.flashDust.setPosition(this.flashlight.x + offsetX, this.flashlight.y + offsetY);
            this.flashDust.setAlpha(Phaser.Math.Clamp(this.flashAlpha * 0.6, 0, 0.6));
    
            if (!this.flashDustOn) {
                this.flashDustEmitter.start();
                this.flashDustOn = true;
            }
        } else if (this.flashDustOn) {
            this.flashDustEmitter.stop();
            this.flashDustOn = false;
        }
    },

    createInteractGlow() {
        if (!this.textures.exists("interact_glow")) {
            const size = 128;
            const tex = this.textures.createCanvas("interact_glow", size, size);
            const ctx = tex.getContext();
    
            const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
            grd.addColorStop(0.0, "rgba(255,255,255,0.35)");
            grd.addColorStop(0.45, "rgba(255,255,255,0.12)");
            grd.addColorStop(1.0, "rgba(255,255,255,0)");
    
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, size, size);
            tex.refresh();
        }
    
        this.interactGlow = this.add.image(0, 0, "interact_glow");
        this.interactGlow.setBlendMode(Phaser.BlendModes.ADD);
        this.interactGlow.setAlpha(0);
        this.interactGlow.setVisible(false);
        this.interactGlow.setDepth(9999);
    },

    createReflection() {
        this.reflection = this.add.sprite(this.player.x, this.player.y + 26, "bob");
        this.reflection.setScale(1.5);
        this.reflection.setFlipY(true);
        this.reflection.setOrigin(0.5, 0);
        this.reflection.setAlpha(0.25);
        this.reflection.setDepth(5);
        this.reflection.setTint(0x000000);
    },

    syncReflectionToPlayer() {
        if (!this.player || !this.reflection) return;

        this.reflection.setPosition(this.player.x, this.player.y + 26);

        const textureKey = this.player.texture?.key;
        const frameName = this.player.frame?.name;
        if (textureKey && frameName != null) {
            this.reflection.setTexture(textureKey, frameName);
        }
    },

    createStunEffect() {
        if (!this.textures.exists("stun_star")) {
            const size = 18;
            const tex = this.textures.createCanvas("stun_star", size, size);
            const ctx = tex.getContext();
            const cx = size / 2;
            const cy = size / 2;

            ctx.clearRect(0, 0, size, size);

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.fillRect(-1.5, -7, 3, 14);
            ctx.fillRect(-7, -1.5, 14, 3);
            ctx.restore();

            ctx.strokeStyle = "rgba(200,150,255,0.9)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
            ctx.stroke();

            tex.refresh();
        }

        // UI(엘리베이터 메뉴/퍼즐) 위로 올라가지 않게, UI보다 낮은 레이어에서 표시
        this.stunFxContainer = this.add.container(0, 0).setDepth(11950).setVisible(false);
        this.stunFxStars = [];

        const starCount = 3;
        for (let i = 0; i < starCount; i += 1) {
            const star = this.add.image(0, 0, "stun_star");
            star.setBlendMode(Phaser.BlendModes.ADD);
            star.setAlpha(0.85);
            star.setScale(0.9);
            this.stunFxContainer.add(star);
            this.stunFxStars.push(star);
        }
    },

    updateStunEffect(time, active) {
        if (!active || !this.player) {
            if (this.stunFxContainer?.visible) this.stunFxContainer.setVisible(false);
            return;
        }

        if (!this.stunFxContainer || !Array.isArray(this.stunFxStars)) {
            this.createStunEffect();
        }

        const stars = this.stunFxStars || [];
        if (!stars.length) return;

        this.stunFxContainer.setVisible(true);
        // 너무 위로 뜨지 않게 살짝만 내려서(=y 증가) 머리 위에 자연스럽게
        this.stunFxContainer.setPosition(this.player.x, this.player.y - 40);

        const seed = Number(this.stunFxSeed) || 0;
        const t = Number(time) * 0.006 + seed;
        const radius = 12;

        for (let i = 0; i < stars.length; i += 1) {
            const star = stars[i];
            const a = t + (i * Math.PI * 2) / stars.length;
            const x = Math.cos(a) * radius;
            const y = Math.sin(a) * radius * 0.55;
            star.setPosition(x, y);
            star.setRotation(a * 2);
            const pulse = 0.55 + 0.35 * Math.sin(t * 2.2 + i);
            star.setAlpha(Phaser.Math.Clamp(pulse, 0.2, 0.95));
        }
    },

    ensureStunScreenFx() {
        const w = this.sys.game.config.width;
        const h = this.sys.game.config.height;

        if (!this.stunScreenOverlay) {
            // 스턴 중 "색 빠짐" + 살짝 뿌연 느낌 (지원 안 되면 그냥 회색 틴트로 동작)
            this.stunScreenOverlay = this.add
                .rectangle(w / 2, h / 2, w, h, 0x9d9d9d, 1)
                .setScrollFactor(0)
                .setDepth(10001)
                .setAlpha(0)
                .setVisible(false);
            try {
                this.stunScreenOverlay.setBlendMode(Phaser.BlendModes.SATURATION);
            } catch {}
        }

        if (!this.hitFlashOverlay) {
            this.hitFlashOverlay = this.add
                .rectangle(w / 2, h / 2, w, h, 0xffffff, 1)
                .setScrollFactor(0)
                .setDepth(10001.5)
                .setAlpha(0)
                .setVisible(false);
            this.hitFlashOverlay.setBlendMode(Phaser.BlendModes.ADD);
        }
    },

    updateStunScreenFx(time, active) {
        if (!this.vignette) return;
        this.ensureStunScreenFx();

        const baseV = 0.9;

        if (!active) {
            const next = Phaser.Math.Linear(this.vignette.alpha ?? baseV, baseV, 0.08);
            this.vignette.setAlpha(next);
            if (this.stunScreenOverlay) {
                const a = Phaser.Math.Linear(this.stunScreenOverlay.alpha ?? 0, 0, 0.12);
                this.stunScreenOverlay.setAlpha(a);
                if (a < 0.002) this.stunScreenOverlay.setVisible(false);
            }
            return;
        }

        const seed = Number(this.stunFxSeed) || 0;
        const p = 0.5 + 0.5 * Math.sin(Number(time) * 0.02 + seed);
        const vigTarget = Phaser.Math.Clamp(baseV + 0.10 + 0.06 * p, 0, 1);
        this.vignette.setAlpha(Phaser.Math.Linear(this.vignette.alpha ?? baseV, vigTarget, 0.12));

        if (this.stunScreenOverlay) {
            this.stunScreenOverlay.setVisible(true);
            const aTarget = Phaser.Math.Clamp(0.12 + 0.08 * p, 0, 0.28);
            this.stunScreenOverlay.setAlpha(Phaser.Math.Linear(this.stunScreenOverlay.alpha ?? 0, aTarget, 0.12));
        }
    },

    triggerHitFlash(intensity = 1) {
        this.ensureStunScreenFx();
        if (!this.hitFlashOverlay) return;

        const a0 = Phaser.Math.Clamp(0.24 * Number(intensity || 1), 0.08, 0.45);
        this.hitFlashOverlay.setVisible(true);
        this.hitFlashOverlay.setAlpha(a0);

        try {
            if (this.hitFlashTween) this.hitFlashTween.stop();
        } catch {}
        this.hitFlashTween = this.tweens.add({
            targets: this.hitFlashOverlay,
            alpha: 0,
            duration: 160,
            ease: "Cubic.easeOut",
            onComplete: () => {
                if (!this.hitFlashOverlay) return;
                this.hitFlashOverlay.setVisible(false);
                this.hitFlashTween = null;
            },
        });

        // 아주 약한 줌 펄스(있어 보이는 타격감)
        const cam = this.cameras?.main;
        if (cam && this.baseZoom) {
            try {
                cam.zoomTo(this.baseZoom * 1.012, 90, "Sine.easeOut");
                this.time.delayedCall(110, () => cam.zoomTo(this.baseZoom, 140, "Sine.easeInOut"));
            } catch {}
        }
    },

    ensureRusherTelegraphTexture() {
        if (this.textures.exists("rusher_wind")) return;

        const w = 128;
        const h = 28;
        const tex = this.textures.createCanvas("rusher_wind", w, h);
        const ctx = tex.getContext();
        ctx.clearRect(0, 0, w, h);

        const grd = ctx.createLinearGradient(0, 0, w, 0);
        grd.addColorStop(0.0, "rgba(255,255,255,0)");
        grd.addColorStop(0.24, "rgba(255,255,255,0.16)");
        grd.addColorStop(0.5, "rgba(255,255,255,0.48)");
        grd.addColorStop(0.76, "rgba(255,255,255,0.16)");
        grd.addColorStop(1.0, "rgba(255,255,255,0)");

        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);

        try {
            ctx.save();
            ctx.globalAlpha = 0.65;
            ctx.filter = "blur(8px)";
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();

            // 얇은 중앙 하이라이트로 시인성 강화
            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.fillRect(0, h * 0.46, w, h * 0.08);
            ctx.restore();
        } catch {}

        tex.refresh();
    },

    showRusherTelegraph({ view, startX, startY, dirX, dirY }) {
        if (!view) return;
        this.ensureRusherTelegraphTexture();

        const sx = Number(startX) || 0;
        const sy = Number(startY) || 0;
        const rawDx = Number(dirX) || 1;
        const rawDy = Number(dirY) || 0;
        const len = Math.sqrt(rawDx * rawDx + rawDy * rawDy) || 1;
        const nx = rawDx / len;
        const ny = rawDy / len;

        const rot = Math.atan2(ny, nx);

        // 카메라 뷰 안에서의 "경로"를 선명하게 보여주기 위해,
        // 이동 라인과 뷰(Rect)의 교차점을 구해 뷰 전체를 가로지르는 텔레그래프를 만든다.
        const ray = new Phaser.Geom.Line(sx - nx * 5000, sy - ny * 5000, sx + nx * 5000, sy + ny * 5000);
        const rawPoints = Phaser.Geom.Intersects.GetLineToRectangle(ray, view) || [];
        const points = [];
        for (const p of rawPoints) {
            const px = Number(p?.x);
            const py = Number(p?.y);
            if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
            if (points.some((q) => Math.abs(q.x - px) < 0.75 && Math.abs(q.y - py) < 0.75)) continue;
            points.push({ x: px, y: py });
        }

        let entry = null;
        let exit = null;
        if (points.length >= 2) {
            // 점이 2개 이상이면, 가장 먼 두 점을 채택(코너 교차/중복 방지)
            let bestA = points[0];
            let bestB = points[1];
            let bestD2 = -1;
            for (let i = 0; i < points.length; i++) {
                for (let j = i + 1; j < points.length; j++) {
                    const dx = points[i].x - points[j].x;
                    const dy = points[i].y - points[j].y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 > bestD2) {
                        bestD2 = d2;
                        bestA = points[i];
                        bestB = points[j];
                    }
                }
            }
            const dA2 = (bestA.x - sx) * (bestA.x - sx) + (bestA.y - sy) * (bestA.y - sy);
            const dB2 = (bestB.x - sx) * (bestB.x - sx) + (bestB.y - sy) * (bestB.y - sy);
            entry = dA2 <= dB2 ? bestA : bestB;
            exit = entry === bestA ? bestB : bestA;
        } else {
            // 안전 폴백(기존처럼 시작점 근처만)
            const x = Phaser.Math.Clamp(sx, view.left + 10, view.right - 10);
            const y = Phaser.Math.Clamp(sy, view.top + 10, view.bottom - 10);
            entry = { x, y };
            exit = { x: x + nx * 120, y: y + ny * 120 };
        }

        // 너무 가장자리에 딱 붙지 않게 살짝 안쪽으로
        const inset = 14;
        const segLen = Phaser.Math.Distance.Between(entry.x, entry.y, exit.x, exit.y);
        if (segLen > inset * 4) {
            entry = { x: entry.x + nx * inset, y: entry.y + ny * inset };
            exit = { x: exit.x - nx * inset, y: exit.y - ny * inset };
        }

        const midX = (entry.x + exit.x) * 0.5;
        const midY = (entry.y + exit.y) * 0.5;
        const pathLen = Phaser.Math.Distance.Between(entry.x, entry.y, exit.x, exit.y);

        const tex = this.textures.get("rusher_wind");
        const src = tex?.getSourceImage?.();
        const texW = Number(src?.width) || 128;
        const scaleX = Phaser.Math.Clamp(pathLen / texW, 1.2, 4.4);

        const baseDepth = (Number(this.darkOverlay?.depth) || 9000) + 2;

        const outer = this.add.image(midX, midY, "rusher_wind");
        outer.setDepth(baseDepth);
        outer.setBlendMode(Phaser.BlendModes.ADD);
        outer.setTint(0x9cc2ff);
        outer.setAlpha(0);
        outer.setRotation(rot);
        outer.setScale(scaleX * 1.06, 1.35);

        const inner = this.add.image(midX, midY, "rusher_wind");
        inner.setDepth(baseDepth + 1);
        inner.setBlendMode(Phaser.BlendModes.ADD);
        inner.setTint(0xe9f3ff);
        inner.setAlpha(0);
        inner.setRotation(rot);
        inner.setScale(scaleX, 0.72);

        const arrow = this.add.triangle(entry.x, entry.y, -10, -6, -10, 6, 12, 0, 0xffffff, 1);
        arrow.setDepth(baseDepth + 2);
        arrow.setBlendMode(Phaser.BlendModes.ADD);
        arrow.setAlpha(0);
        arrow.setRotation(rot);
        arrow.setScale(0.9);

        const duration = 110;
        const hold = 200;
        const cleanup = () => {
            try {
                outer.destroy();
            } catch {}
            try {
                inner.destroy();
            } catch {}
            try {
                arrow.destroy();
            } catch {}
        };

        this.tweens.add({ targets: outer, alpha: { from: 0, to: 0.26 }, duration, ease: "Sine.easeOut", yoyo: true, hold });
        this.tweens.add({ targets: inner, alpha: { from: 0, to: 0.42 }, duration, ease: "Sine.easeOut", yoyo: true, hold });
        this.tweens.add({
            targets: arrow,
            alpha: { from: 0, to: 0.5 },
            duration,
            ease: "Sine.easeOut",
            yoyo: true,
            hold,
            onComplete: cleanup,
        });
    },

    createRusherSystem() {
        if (!this.ENABLE_RUSHERS) return;
        if (!this.physics || !this.player) return;
        if (this.rusherGroup) return;

        this.rusherTextureKeys = this.getRusherTextureKeys();
        this.rusherGroup = this.physics.add.group();
        this.physics.add.overlap(this.player, this.rusherGroup, this.onRusherHit, null, this);
        const now = this.time?.now ?? 0;
        // 첫 등장도 동일한 스폰 주기/확률로 처리
        this.scheduleNextRusher(Number(now) || 0);
    },

    getRusherTextureKeys() {
        const list = this.textures?.list ? Object.keys(this.textures.list) : [];
        return list.filter((key) => /^object\d+$/.test(key));
    },

    scheduleNextRusher(now) {
        const minMs = Math.max(800, Number(this.RUSHER_SPAWN_MIN_MS) || 7000);
        const maxMs = Math.max(minMs, Number(this.RUSHER_SPAWN_MAX_MS) || 14000);
        const delay = Phaser.Math.Between(minMs, maxMs);
        this.rusherNextAt = Number(now) + delay;
    },

    createRusherInstance({ textureKey, startX, startY, vx, vy, endX, endY, ttlMs, roomIndex }) {
        if (!this.ENABLE_RUSHERS) return;
        if (!this.rusherGroup || !this.physics) return;
        if (!textureKey) return;

        const now = Number(this.time?.now) || 0;
        const rusher = this.physics.add.image(startX, startY, textureKey);
        rusher.setActive(true);
        rusher.setVisible(true);
        // 방/오브젝트와 동일하게 "어두운 오버레이"의 영향을 받게(=오버레이 아래로)
        rusher.setDepth(rusher.y);
        rusher.setBlendMode(Phaser.BlendModes.NORMAL);
        rusher.setAlpha(1);
        // 방 오브젝트 톤과 맞추기(너무 튀는 컬러 방지)
        rusher.setTint(0x999999);
        rusher.setScale(Phaser.Math.FloatBetween(1.0, 1.25));
        rusher.body.setAllowGravity(false);
        // 빠르게 지나가도 히트가 체감되도록 히트박스 살짝 크게
        rusher.body.setSize(44, 30, true);
        rusher.setVelocity(vx, vy);
        rusher.setData("roomIndex", Number.isFinite(roomIndex) ? roomIndex : this.currentRoomIndex);
        rusher.setData("expiresAt", now + (Number(ttlMs) || 0));
        rusher.setData("hit", false);
        rusher.setData("endX", endX);
        rusher.setData("endY", endY);
        rusher.setData("dirX", vx === 0 && vy === 0 ? 0 : vx / Math.max(1, Math.sqrt(vx * vx + vy * vy)));
        rusher.setData("dirY", vx === 0 && vy === 0 ? 0 : vy / Math.max(1, Math.sqrt(vx * vx + vy * vy)));

        // 그룹에 추가되면서 일부 바디 속성이 리셋되는 경우가 있어, velocity/moves를 다시 보장한다.
        this.rusherGroup.add(rusher);
        if (rusher.body) {
            rusher.body.moves = true;
            rusher.body.enable = true;
        }
        rusher.setVelocity(vx, vy);

        // 날아오는 순간 효과음
        try {
            if (this.sfxWhoosh) {
                if (this.sfxWhoosh.isPlaying) this.sfxWhoosh.stop();
                this.sfxWhoosh.play({
                    volume: 0.23,
                    rate: Phaser.Math.FloatBetween(0.95, 1.05),
                });
            }
        } catch {}
    },

    spawnRusher() {
        if (!this.ENABLE_RUSHERS) return;
        if (!this.rusherGroup || !this.physics) return;
        if (!Array.isArray(this.roomsData) || !this.roomsData.length) return;

        const chance = Phaser.Math.Clamp(Number(this.RUSHER_SPAWN_CHANCE) || 0.55, 0, 1);
        if (Math.random() > chance) return;

        const keys = Array.isArray(this.rusherTextureKeys) && this.rusherTextureKeys.length ? this.rusherTextureKeys : this.getRusherTextureKeys();
        // 텍스쳐 목록이 비었을 때도 최소 1개는 보이게 (로드/파싱 이슈 대비)
        const textureKey =
            keys.length > 0
                ? Phaser.Utils.Array.GetRandom(keys)
                : this.textures.exists("object1")
                  ? "object1"
                  : this.textures.exists("clue_object")
                    ? "clue_object"
                    : null;
        if (!textureKey) return;

        const room = this.roomsData[this.currentRoomIndex];
        if (!room) return;

        // "현재 카메라가 보고 있는 맵" 기준으로 가장자리에서 반대편까지 훅 지나가게 스폰
        const cameraView = this.cameras?.main?.worldView;
        const view = cameraView
            ? new Phaser.Geom.Rectangle(cameraView.x, cameraView.y, cameraView.width, cameraView.height)
            : new Phaser.Geom.Rectangle(room.x, room.y, this.ROOM_WIDTH, this.ROOM_WIDTH);

        const insetX = 18;
        const insetTop = 70;
        const insetBottom = 20;
        const minX = Math.floor(view.left + insetX);
        const maxX = Math.floor(view.right - insetX);
        const minY = Math.floor(view.top + insetTop);
        const maxY = Math.floor(view.bottom - insetBottom);

        const dir = Phaser.Utils.Array.GetRandom(["L2R", "R2L", "T2B", "B2T", "TL2BR", "TR2BL", "BL2TR", "BR2TL"]);
        const speed = Math.max(140, Number(this.RUSHER_SPEED) || 520);
        const margin = 160;

        let startX = Phaser.Math.Between(minX, maxX);
        let startY = Phaser.Math.Between(minY, maxY);
        let endX = startX;
        let endY = startY;

        const px = Number(this.player?.x);
        const py = Number(this.player?.y);
        const hasPlayer = Number.isFinite(px) && Number.isFinite(py);

        if (dir === "L2R") {
            startX = view.left - margin;
            startY = hasPlayer ? Phaser.Math.Clamp(py + Phaser.Math.Between(-70, 70), minY, maxY) : Phaser.Math.Between(minY, maxY);
            endX = view.right + margin;
            endY = Phaser.Math.Clamp(startY + Phaser.Math.Between(-45, 45), view.top + 40, view.bottom - 30);
        } else if (dir === "R2L") {
            startX = view.right + margin;
            startY = hasPlayer ? Phaser.Math.Clamp(py + Phaser.Math.Between(-70, 70), minY, maxY) : Phaser.Math.Between(minY, maxY);
            endX = view.left - margin;
            endY = Phaser.Math.Clamp(startY + Phaser.Math.Between(-45, 45), view.top + 40, view.bottom - 30);
        } else if (dir === "T2B") {
            startX = hasPlayer ? Phaser.Math.Clamp(px + Phaser.Math.Between(-70, 70), minX, maxX) : Phaser.Math.Between(minX, maxX);
            startY = view.top - margin;
            endX = Phaser.Math.Clamp(startX + Phaser.Math.Between(-55, 55), view.left + 24, view.right - 24);
            endY = view.bottom + margin;
        } else if (dir === "B2T") {
            startX = hasPlayer ? Phaser.Math.Clamp(px + Phaser.Math.Between(-70, 70), minX, maxX) : Phaser.Math.Between(minX, maxX);
            startY = view.bottom + margin;
            endX = Phaser.Math.Clamp(startX + Phaser.Math.Between(-55, 55), view.left + 24, view.right - 24);
            endY = view.top - margin;
        } else if (dir === "TL2BR") {
            startX = view.left - margin;
            startY = view.top - margin;
            endX = view.right + margin;
            endY = view.bottom + margin;
        } else if (dir === "TR2BL") {
            startX = view.right + margin;
            startY = view.top - margin;
            endX = view.left - margin;
            endY = view.bottom + margin;
        } else if (dir === "BL2TR") {
            startX = view.left - margin;
            startY = view.bottom + margin;
            endX = view.right + margin;
            endY = view.top - margin;
        } else {
            // BR2TL
            startX = view.right + margin;
            startY = view.bottom + margin;
            endX = view.left - margin;
            endY = view.top - margin;
        }

        // 월드 바운드 밖(-y, -x 등)에서 생성되면 아케이드 물리가 업데이트/렌더링이 안 되는 경우가 있어,
        // 스폰/목표 지점은 월드 안으로 클램프한다.
        const worldBounds = this.physics?.world?.bounds;
        if (worldBounds) {
            const clampX = (value) => Phaser.Math.Clamp(Number(value) || 0, worldBounds.left + 2, worldBounds.right - 2);
            const clampY = (value) => Phaser.Math.Clamp(Number(value) || 0, worldBounds.top + 2, worldBounds.bottom - 2);
            startX = clampX(startX);
            startY = clampY(startY);
            endX = clampX(endX);
            endY = clampY(endY);
        }

        const v = new Phaser.Math.Vector2(endX - startX, endY - startY);
        if (v.lengthSq() < 1) return;
        v.normalize();

        const vx = v.x * speed;
        const vy = v.y * speed;

        const now = Number(this.time?.now) || 0;
        const travelPx = Phaser.Math.Distance.Between(startX, startY, endX, endY);
        const travelMs = (travelPx / speed) * 1000;
        // "깜빡이다가 사라짐" 방지: 이동 시간 기반으로 TTL 계산
        const ttlMs = Phaser.Math.Clamp(travelMs + 260, 900, 3400);

        const telegraphMs = Math.max(0, Number(this.RUSHER_TELEGRAPH_MS) || 0);
        const spawnRoomIndex = this.currentRoomIndex;
        if (telegraphMs > 0) {
            this.showRusherTelegraph?.({ view, startX, startY, dirX: v.x, dirY: v.y });
            this.time.delayedCall(telegraphMs, () => {
                if (!this.ENABLE_RUSHERS) return;
                if (!this.rusherGroup || !this.physics) return;
                if (this.currentRoomIndex !== spawnRoomIndex) return;
                const isBlocked =
                    this.isPuzzleActive ||
                    this.isInspecting ||
                    this.isTransitioning ||
                    this.isElevatorMenuOpen ||
                    this.isDialogActiveRef?.current ||
                    this.inputFocusedRef?.current;
                if (isBlocked) return;
                this.createRusherInstance({ textureKey, startX, startY, vx, vy, endX, endY, ttlMs, roomIndex: spawnRoomIndex });
            });
            return;
        }

        this.createRusherInstance({ textureKey, startX, startY, vx, vy, endX, endY, ttlMs, roomIndex: spawnRoomIndex });
    },

    updateRusherSystem(time) {
        if (!this.ENABLE_RUSHERS) return;
        if (!this.rusherGroup) return;
        const now = Number(this.time?.now ?? time) || 0;

        // 방이 바뀌면 잔상 오브젝트 정리 (누적 방지)
        this.rusherGroup.children.each((child) => {
            const r = child;
            if (!r?.active) return;
            if (r.getData?.("roomIndex") !== this.currentRoomIndex) {
                r.destroy();
                return;
            }
            const expiresAt = Number(r.getData?.("expiresAt")) || 0;
            if (expiresAt && now > expiresAt) {
                r.destroy();
                return;
            }
            const endX = Number(r.getData?.("endX"));
            const endY = Number(r.getData?.("endY"));
            const dirX = Number(r.getData?.("dirX"));
            const dirY = Number(r.getData?.("dirY"));
            if (Number.isFinite(endX) && Number.isFinite(endY) && Number.isFinite(dirX) && Number.isFinite(dirY)) {
                const dx = (r.x ?? 0) - endX;
                const dy = (r.y ?? 0) - endY;
                // 끝점을 지나쳤으면(반대편 통과) 바로 정리
                if (dx * dirX + dy * dirY > 20) {
                    r.destroy();
                    return;
                }
            }
            r.setDepth(r.y);
        });

        if (!this.rusherNextAt) this.scheduleNextRusher(now);
        if (now < this.rusherNextAt) return;

        const isBlocked =
            this.isPuzzleActive ||
            this.isInspecting ||
            this.isTransitioning ||
            this.isElevatorMenuOpen ||
            this.isDialogActiveRef?.current ||
            this.inputFocusedRef?.current;

        // UI/퍼즐 중에는 스폰 타이밍을 살짝 뒤로 미룸
        if (isBlocked) {
            this.rusherNextAt = now + 600;
            return;
        }

        // 스폰 타이밍 도달
        this.spawnRusher();
        this.scheduleNextRusher(now);
    },

    onRusherHit(player, rusher) {
        if (!this.ENABLE_RUSHERS) return;
        if (!player?.body || !rusher?.body) return;
        if (!rusher.active) return;
        if (rusher.getData?.("hit")) return;

        // UI/퍼즐 중에는 밀치지 않음
        if (this.isPuzzleActive || this.isInspecting || this.isTransitioning || this.isElevatorMenuOpen) {
            return;
        }
        if (this.isDialogActiveRef?.current || this.inputFocusedRef?.current) {
            return;
        }

        rusher.setData("hit", true);

        const vx = Number(rusher.body.velocity?.x) || 0;
        const vy = Number(rusher.body.velocity?.y) || 0;
        const dir = new Phaser.Math.Vector2(vx, vy);
        if (dir.lengthSq() < 1) return;
        dir.normalize();

        const push = Math.max(60, Number(this.RUSHER_PUSH_SPEED) || 260);
        const ms = Math.max(80, Number(this.RUSHER_PUSH_MS) || 220);
        const stunMs = Math.max(200, Number(this.RUSHER_STUN_MS) || 2000);

        this.rusherKnockbackVx = dir.x * push;
        this.rusherKnockbackVy = dir.y * push;
        this.rusherKnockbackUntil = (this.time?.now ?? 0) + ms;
        const nextStunUntil = (this.time?.now ?? 0) + stunMs;
        this.rusherStunUntil = Math.max(Number(this.rusherStunUntil) || 0, nextStunUntil);

        this.cameras.main?.shake(90, 0.0024);
        let played = false;
        try {
            if (this.sfxHit) {
                if (this.sfxHit.isPlaying) this.sfxHit.stop();
                this.sfxHit.play({
                    volume: 0.5,
                    rate: Phaser.Math.FloatBetween(0.95, 1.05),
                });
                played = true;
            }
        } catch {}
        if (!played) this.playUiBeep?.(240, 0.05, 0.06);

        // 한 번 밀치면 사라짐
        rusher.destroy();
    },

    createEnvironmentalParticles() {
        const screenW = this.sys.game.config.width;
        const screenH = this.sys.game.config.height;
    
        if (!this.textures.exists("steam_particle")) {
            const steamG = this.make.graphics({ x: 0, y: 0, add: false });
            steamG.fillStyle(0xffffff, 0.2);
            steamG.fillCircle(10, 10, 10);
            steamG.generateTexture("steam_particle", 20, 20);
        }
    
        if (!this.textures.exists("drip_particle")) {
            const dripG = this.make.graphics({ x: 0, y: 0, add: false });
            dripG.fillStyle(0xaaccff, 0.8);
            dripG.fillCircle(2, 2, 2);
            dripG.generateTexture("drip_particle", 4, 4);
        }
    
        this.steamEmitter = this.add.particles(screenW / 2, screenH / 2, "steam_particle", {
            emitZone: {
                source: new Phaser.Geom.Rectangle(-screenW / 2, -screenH / 2, screenW, screenH),
                type: "random",
                quantity: 1,
            },
            lifespan: { min: 2000, max: 4000 },
            speedY: { min: -10, max: -30 },
            scale: { start: 0.5, end: 1.5 },
            alpha: { start: 0.1, end: 0 },
            frequency: 300,
            blendMode: "ADD",
        });
        this.steamEmitter.setScrollFactor(0);
        this.steamEmitter.setDepth(9002);
        this.emSteam = this.steamEmitter.emitters?.list?.[0] ?? null;
    
        this.dripEmitter = this.add.particles(screenW / 2, screenH / 2, "drip_particle", {
            emitZone: {
                source: new Phaser.Geom.Rectangle(-screenW / 2, -screenH / 2 - 200, screenW, 50),
                type: "random",
                quantity: 1,
            },
            lifespan: 1500,
            speedY: { min: 100, max: 200 },
            scale: { start: 1, end: 0.5 },
            alpha: { start: 0.6, end: 0 },
            frequency: 800,
            blendMode: "ADD",
        });
        this.dripEmitter.setScrollFactor(0);
        this.dripEmitter.setDepth(9002);
        this.emDrip = this.dripEmitter.emitters?.list?.[0] ?? null;
    },

    createWalkingDust() {
        if (!this.textures.exists("footstep_dust")) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffffff, 0.6);
            g.fillCircle(3, 3, 3);
            g.generateTexture("footstep_dust", 8, 8);
        }
    
        this.footstepEmitter = this.add.particles(0, 0, "footstep_dust", {
            lifespan: 800,
            scale: { start: 1.5, end: 0.5 },
            alpha: { start: 0.7, end: 0 },
            speed: { min: 10, max: 30 },
            angle: { min: 180, max: 360 },
            gravityY: -10,
            quantity: 1,
            blendMode: "ADD",
            on: false,
        });
        this.footstepEmitter.setDepth(90);
    },

    createStrongAmbientDust() {
        if (!this.textures.exists("big_mote")) {
            const dustGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            dustGraphics.fillStyle(0xffffff, 0.6);
            dustGraphics.fillCircle(2, 2, 2);
            dustGraphics.generateTexture("big_mote", 4, 4);
        }
    
        const screenW = this.sys.game.config.width;
        const screenH = this.sys.game.config.height;
    
        this.dustEmitter = this.add.particles(screenW / 2, screenH / 2, "big_mote", {
            emitZone: {
                source: new Phaser.Geom.Rectangle(-screenW / 2, -screenH / 2, screenW, screenH),
                type: "random",
                quantity: 1,
            },
            lifespan: 3000,
            speed: { min: 10, max: 30 },
            scale: { start: 1.0, end: 0.5 },
            alpha: { start: 0.8, end: 0 },
            frequency: 100,
            blendMode: "ADD",
        });
        this.dustEmitter.setScrollFactor(0);
        this.dustEmitter.setDepth(9005);
        this.emAmbientDust = this.dustEmitter.emitters?.list?.[0] ?? null;
    },

    createLighting() {
        const screenW = this.sys.game.config.width;
        const screenH = this.sys.game.config.height;
    
        this.darkOverlay = this.add.rectangle(screenW / 2, screenH / 2, screenW, screenH, 0x000000).setScrollFactor(0).setAlpha(0.7).setDepth(9000);
    
        if (!this.textures.exists("soft_glow")) {
            const glowTex = this.textures.createCanvas("soft_glow", 256, 256);
            const gCtx = glowTex.getContext();
    
            const gGrd = gCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
            gGrd.addColorStop(0, "rgba(255, 255, 255, 0.6)");
            gGrd.addColorStop(1, "rgba(255, 255, 255, 0)");
    
            gCtx.fillStyle = gGrd;
            gCtx.fillRect(0, 0, 256, 256);
            glowTex.refresh();
        }
    
        this.lightSprite = this.add.image(0, 0, "soft_glow").setDepth(9001).setBlendMode(Phaser.BlendModes.ADD);
        this.flickerLight();
    },

    flickerLight() {
        const delay = Phaser.Math.Between(100, 800);
        this.time.addEvent({
            delay,
            callback: () => {
                if (!this.lightSprite) return;
    
                if (Math.random() < 0.02) {
                    this.lightSprite.setAlpha(0.2);
                    this.cameras.main.shake(800, 0.0032);
                    if (this.sfxRumble) this.sfxRumble.play();
                } else {
                    this.lightSprite.setAlpha(Phaser.Math.FloatBetween(0.5, 0.8));
                    this.lightSprite.setScale(Phaser.Math.FloatBetween(1.0, 1.1));
                }
                this.flickerLight();
            },
        });
    },

};
