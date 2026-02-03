import Phaser from "phaser";

const formatFloorLabel = (roomIndex) => `FLOOR ${String((Number(roomIndex) || 0) + 1).padStart(2, "0")}`;

export const elevatorMethods = {
    createElevatorGlowTextures() {
        if (!this.textures.exists("elevator_glow")) {
            const size = 140;
            const tex = this.textures.createCanvas("elevator_glow", size, size);
            const ctx = tex.getContext();
    
            const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
            grd.addColorStop(0.0, "rgba(140, 190, 255, 0.45)");
            grd.addColorStop(0.5, "rgba(110, 170, 255, 0.18)");
            grd.addColorStop(1.0, "rgba(0, 0, 0, 0)");
    
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, size, size);
            tex.refresh();
        }
    
        if (!this.textures.exists("elevator_spot")) {
            const w = 160;
            const h = 80;
            const tex = this.textures.createCanvas("elevator_spot", w, h);
            const ctx = tex.getContext();
    
            ctx.fillStyle = "rgba(130, 185, 255, 0.28)";
            ctx.beginPath();
            ctx.ellipse(w / 2, h / 2, 68, 22, 0, 0, Math.PI * 2);
            ctx.fill();
            tex.refresh();
        }
    },

    addElevatorGlow(doorX, doorY, roomOriginY, roomIndex) {
        if (!this.textures.exists("elevator_glow")) this.createElevatorGlowTextures();
    
        const glow = this.add.image(doorX, doorY + 6, "elevator_glow");
        glow.setDepth(45);
        glow.setBlendMode(Phaser.BlendModes.ADD);
        glow.setAlpha(0.18);
        glow.setScale(0.45, 0.35);
    
        const spot = this.add.image(doorX, roomOriginY + 82, "elevator_spot");
        spot.setDepth(2);
        spot.setAlpha(0.16);
        spot.setScale(0.6, 0.45);
        spot.setBlendMode(Phaser.BlendModes.ADD);
    
        this.elevatorGlows.push({
            glow,
            spot,
            roomIndex,
            seed: Math.random() * 1000,
        });
    },

    updateElevatorGlows(time, nearPortal) {
        if (!this.elevatorGlows.length) return;
    
        this.elevatorGlows.forEach((entry) => {
            if (!entry?.glow || !entry?.spot) return;
    
            const isActive = entry.roomIndex === this.currentRoomIndex;
            const pulse = 0.5 + 0.5 * Math.sin(time * 0.01 + entry.seed);
            const glowBase = isActive ? (nearPortal ? 0.28 : 0.18) : 0.08;
            const glowAlpha = glowBase + (isActive ? 0.08 : 0.02) * pulse;
            const glowScale = isActive ? 0.5 + (nearPortal ? 0.08 * pulse : 0.04 * pulse) : 0.42;
    
            entry.glow.setAlpha(glowAlpha);
            entry.glow.setScale(glowScale, glowScale * 0.75);
    
            const spotBase = isActive ? (nearPortal ? 0.22 : 0.14) : 0.06;
            entry.spot.setAlpha(spotBase + (isActive ? 0.05 * pulse : 0));
        });
    },

    createElevatorDoors() {
        const screenW = this.sys.game.config.width;
        const screenH = this.sys.game.config.height;
        const halfW = screenW / 2;
    
        this.elevatorDoorLeft = this.add
            .rectangle(-halfW / 2, screenH / 2, halfW, screenH, 0x000000, 1)
            .setScrollFactor(0)
            .setDepth(20000)
            .setVisible(false);
    
        this.elevatorDoorRight = this.add
            .rectangle(screenW + halfW / 2, screenH / 2, halfW, screenH, 0x000000, 1)
            .setScrollFactor(0)
            .setDepth(20000)
            .setVisible(false);
    },

    createElevatorMenu() {
        this.elevatorMenuContainer = this.add.container(0, 0).setDepth(12010).setVisible(false);
    
        const glow = this.add.image(0, 0, "interact_glow").setScale(0.6).setAlpha(0.25);
        glow.setBlendMode(Phaser.BlendModes.ADD);
    
        const bg = this.add.rectangle(0, 0, 150, 66, 0x0a0f16, 0.94).setStrokeStyle(2, 0x7fb2ff, 0.9);
        const title = this.add
            .text(0, -24, "ELEVATOR PANEL", { fontSize: "9px", color: "#9cc2ff", fontStyle: "bold" })
            .setOrigin(0.5);
        title.setShadow(0, 1, "#000", 2, true, true);
    
        const upRow = this.add.container(0, -4);
        const upKey = this.add.rectangle(-46, 0, 18, 18, 0x161616, 1).setStrokeStyle(1, 0x9cc2ff);
        const upKeyText = this.add.text(-46, 0, "W", { fontSize: "10px", color: "#e6f1ff", fontStyle: "bold" }).setOrigin(0.5);
        const upText = this.add.text(-22, 0, "UP FLOOR", { fontSize: "10px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0, 0.5);
        upText.setShadow(0, 1, "#000", 2, false, true);
        upRow.add([upKey, upKeyText, upText]);
    
        const downRow = this.add.container(0, 12);
        const downKey = this.add.rectangle(-46, 0, 18, 18, 0x161616, 1).setStrokeStyle(1, 0x9cc2ff);
        const downKeyText = this.add.text(-46, 0, "S", { fontSize: "10px", color: "#e6f1ff", fontStyle: "bold" }).setOrigin(0.5);
        const downText = this.add.text(-22, 0, "DOWN FLOOR", { fontSize: "10px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0, 0.5);
        downText.setShadow(0, 1, "#000", 2, false, true);
        downRow.add([downKey, downKeyText, downText]);
    
        const hint = this.add.text(0, 26, "SPACE: CLOSE", { fontSize: "8px", color: "#7f90a8" }).setOrigin(0.5);
    
        this.elevatorMenuBg = bg;
        this.elevatorMenuGlow = glow;
        this.elevatorMenuTitle = title;
        this.elevatorMenuHint = hint;
        this.elevatorMenuUpRow = upRow;
        this.elevatorMenuDownRow = downRow;
        this.elevatorMenuUpText = upText;
        this.elevatorMenuDownText = downText;
        this.elevatorMenuUpKey = upKey;
        this.elevatorMenuDownKey = downKey;
        this.elevatorMenuContainer.add([glow, bg, title, upRow, downRow, hint]);
    },

    updateElevatorMenuAvailability() {
        if (!this.elevatorMenuContainer) return;
    
        const canGoUp = this.currentRoomIndex < this.ROOM_COUNT - 1;
        const canGoDown = this.currentRoomIndex > 0;
    
        this.elevatorMenuUpText.setAlpha(1);
        this.elevatorMenuDownText.setAlpha(1);
        this.elevatorMenuUpRow.setVisible(canGoUp);
        this.elevatorMenuDownRow.setVisible(canGoDown);
    
        if (canGoUp && canGoDown) {
            this.elevatorMenuUpRow.y = -4;
            this.elevatorMenuDownRow.y = 12;
            this.elevatorMenuTitle.y = -24;
            if (this.elevatorMenuHint) this.elevatorMenuHint.y = 26;
            this.elevatorMenuBg.setSize(150, 66);
            this.elevatorMenuGlow?.setScale(0.6);
        } else if (canGoUp) {
            this.elevatorMenuUpRow.y = 4;
            this.elevatorMenuTitle.y = -18;
            if (this.elevatorMenuHint) this.elevatorMenuHint.y = 18;
            this.elevatorMenuBg.setSize(150, 52);
            this.elevatorMenuGlow?.setScale(0.55);
        } else if (canGoDown) {
            this.elevatorMenuDownRow.y = 4;
            this.elevatorMenuTitle.y = -18;
            if (this.elevatorMenuHint) this.elevatorMenuHint.y = 18;
            this.elevatorMenuBg.setSize(150, 52);
            this.elevatorMenuGlow?.setScale(0.55);
        } else {
            this.elevatorMenuContainer.setVisible(false);
        }
    },

    openElevatorMenu() {
        if (!this.elevatorMenuContainer) return;
        this.isElevatorMenuOpen = true;
        this.elevatorMenuAwaitRelease = true;
        this.playUiBeep(760, 0.06, 0.08);
        this.updateElevatorMenuAvailability();
        this.tweens.killTweensOf(this.elevatorMenuContainer);
        this.elevatorMenuContainer.setAlpha(0);
        this.elevatorMenuContainer.setScale(0.96);
        this.elevatorMenuContainer.setVisible(true);
        this.tweens.add({
            targets: this.elevatorMenuContainer,
            alpha: 1,
            scale: 1,
            duration: 160,
            ease: "Sine.easeOut",
        });
    },

    closeElevatorMenu() {
        if (!this.elevatorMenuContainer) return;
        this.isElevatorMenuOpen = false;
        this.elevatorMenuAwaitRelease = false;
        this.elevatorMenuContainer.setVisible(false);
    },

    closeElevatorDoors(onComplete) {
        const screenW = this.sys.game.config.width;
        const halfW = screenW / 2;
    
        this.elevatorDoorLeft.setVisible(true);
        this.elevatorDoorRight.setVisible(true);
    
        this.elevatorDoorLeft.x = -halfW / 2;
        this.elevatorDoorRight.x = screenW + halfW / 2;
    
        this.tweens.killTweensOf(this.elevatorDoorLeft);
        this.tweens.killTweensOf(this.elevatorDoorRight);
    
        let done = 0;
        const finish = () => {
            done += 1;
            if (done >= 2 && onComplete) onComplete();
        };
    
        this.tweens.add({
            targets: this.elevatorDoorLeft,
            x: halfW / 2,
            duration: 600,
            ease: "Sine.easeInOut",
            onComplete: finish,
        });
    
        this.tweens.add({
            targets: this.elevatorDoorRight,
            x: screenW - halfW / 2,
            duration: 600,
            ease: "Sine.easeInOut",
            onComplete: finish,
        });
    },

    openElevatorDoors(onComplete) {
        const screenW = this.sys.game.config.width;
        const halfW = screenW / 2;
    
        this.tweens.killTweensOf(this.elevatorDoorLeft);
        this.tweens.killTweensOf(this.elevatorDoorRight);
    
        let done = 0;
        const finish = () => {
            done += 1;
            if (done >= 2) {
                this.elevatorDoorLeft.setVisible(false);
                this.elevatorDoorRight.setVisible(false);
                if (onComplete) onComplete();
            }
        };
    
        this.tweens.add({
            targets: this.elevatorDoorLeft,
            x: -halfW / 2,
            duration: 420,
            ease: "Sine.easeInOut",
            onComplete: finish,
        });
    
        this.tweens.add({
            targets: this.elevatorDoorRight,
            x: screenW + halfW / 2,
            duration: 420,
            ease: "Sine.easeInOut",
            onComplete: finish,
        });
    },

    startElevatorTransition(nextIndex) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        this.interactionContainer?.setVisible(false);
        this.closeElevatorMenu?.();

        const fromFloor = this.currentRoomIndex;
        const toFloor = nextIndex;

        // 이동 연출(리소스 없이): 오버레이 텍스트 + 글리치 라인 + 노이즈 버스트
        const screenW = this.sys.game.config.width;
        const screenH = this.sys.game.config.height;

        const travelFx = this.add.container(screenW / 2, screenH / 2).setScrollFactor(0).setDepth(20010).setAlpha(0);
        const dim = this.add.rectangle(0, 0, screenW, screenH, 0x000000, 0.28);
        const title = this.add
            .text(0, -10, `${formatFloorLabel(fromFloor)}  →  ${formatFloorLabel(toFloor)}`, {
                fontSize: "14px",
                color: "#e7f2ff",
                fontStyle: "bold",
            })
            .setOrigin(0.5);
        title.setShadow(0, 2, "#000", 4, true, true);

        const sub = this.add
            .text(0, 14, "ELEVATOR MOVING", { fontSize: "9px", color: "#9cc2ff", fontStyle: "bold" })
            .setOrigin(0.5);
        sub.setShadow(0, 1, "#000", 2, false, true);

        const glitchLines = [];
        for (let i = 0; i < 8; i++) {
            const y = Phaser.Math.Between(-60, 60);
            const line = this.add.rectangle(0, y, Phaser.Math.Between(120, 320), 2, 0x9cc2ff, 0.0);
            glitchLines.push(line);
        }

        travelFx.add([dim, ...glitchLines, title, sub]);

        this.tweens.add({
            targets: travelFx,
            alpha: 1,
            duration: 160,
            ease: "Sine.easeOut",
        });

        const flickerTween = this.tweens.add({
            targets: [title, sub],
            alpha: { from: 1, to: 0.6 },
            duration: 90,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        const glitchEvent = this.time.addEvent({
            delay: 70,
            loop: true,
            callback: () => {
                glitchLines.forEach((line) => {
                    line.y = Phaser.Math.Between(-64, 64);
                    line.setSize(Phaser.Math.Between(120, 340), 2);
                    line.setAlpha(Phaser.Math.FloatBetween(0.08, 0.26));
                });
                title.x = Phaser.Math.Between(-2, 2);
                title.y = -10 + Phaser.Math.Between(-2, 2);
            },
        });

        let noiseBurstEvent = null;
        if (this.staticNoise) {
            const baseAlpha = Number(this.grainBaseAlpha) || 0.045;
            this.staticNoise.setVisible(true);
            this.staticNoise.setAlpha(Math.max(baseAlpha, 0.22));
            noiseBurstEvent = this.time.addEvent({
                delay: 34,
                loop: true,
                callback: () => {
                    if (!this.staticNoise) return;
                    this.staticNoise.tilePositionX += Phaser.Math.Between(8, 22);
                    this.staticNoise.tilePositionY += Phaser.Math.Between(8, 22);
                    this.staticNoise.setAlpha(Phaser.Math.FloatBetween(0.26, 0.5));
                },
            });
        }

        const cam = this.cameras.main;
        if (cam) {
            cam.shake(140, 0.002);
            cam.zoomTo(this.baseZoom * 1.02, 140, "Sine.easeOut");
        }
    
        this.playUiBeep(920, 0.06, 0.1);
        if (this.sfxElevator) this.sfxElevator.play({ rate: Phaser.Math.FloatBetween(0.98, 1.02) });
    
        this.closeElevatorDoors(() => {
            if (cam) {
                cam.shake(420, 0.0045);
                cam.zoomTo(this.baseZoom * 1.03, 180, "Sine.easeOut");
            }
            if (this.sfxRumble && Math.random() < 0.6) {
                this.sfxRumble.play({ volume: 0.7, rate: Phaser.Math.FloatBetween(0.95, 1.05) });
            }
    
            const nextRoom = this.roomsData[nextIndex];
    
            this.player.setPosition(nextRoom.centerX, nextRoom.centerY + 50);
            this.lightSprite.setPosition(nextRoom.centerX, nextRoom.centerY);
    
            this.updateRoomAmbience(nextRoom.type);
    
            this.currentRoomIndex = nextIndex;
            this.updateCameraBounds(nextIndex);
            this.updateFloorHud(nextIndex);
    
            try {
                this.onRoomChanged?.(nextIndex);
            } catch (e) {
                console.error("AgitScene onRoomChanged error:", e);
            }
    
            const PAUSE_MS = 250;
            this.time.delayedCall(PAUSE_MS, () => {
                this.openElevatorDoors(() => {
                    if (cam) cam.zoomTo(this.baseZoom, 220, "Sine.easeInOut");

                    if (noiseBurstEvent) {
                        noiseBurstEvent.remove(false);
                        noiseBurstEvent = null;
                    }
                    if (this.staticNoise) {
                        const baseAlpha = Number(this.grainBaseAlpha) || 0.045;
                        this.tweens.add({
                            targets: this.staticNoise,
                            alpha: baseAlpha,
                            duration: 260,
                            ease: "Sine.easeOut",
                        });
                    }

                    if (glitchEvent) glitchEvent.remove(false);
                    if (flickerTween) flickerTween.stop();
                    this.tweens.add({
                        targets: travelFx,
                        alpha: 0,
                        duration: 180,
                        ease: "Sine.easeInOut",
                        onComplete: () => {
                            travelFx.destroy(true);
                        },
                    });
                    this.isTransitioning = false;
                });
            });
        });
    },

};
