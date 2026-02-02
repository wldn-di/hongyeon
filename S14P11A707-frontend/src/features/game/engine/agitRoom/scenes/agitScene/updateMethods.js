import Phaser from "phaser";

const isDomTextInputFocused = () => {
    if (typeof document === "undefined") return false;
    const active = document.activeElement;
    if (!active) return false;
    const tagName = active.tagName;
    if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") return true;
    return active.isContentEditable === true;
};

const clamp01 = (value) => {
    const v = Number(value);
    if (!Number.isFinite(v)) return 0;
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
};

export const updateMethods = {
    update(time, delta) {
        if (!this.player) return;

        // 1. 배터리 변수 안전 초기화 (없으면 100%로 설정)
        if (typeof this.flashBattery === 'undefined') this.flashBattery = 1.0;

        // 2. 랜덤 시드 변수 안전 초기화 (없으면 0으로 설정 -> NaN 방지)
        const seed1 = this.flashJitterSeed || 0;
        const seed2 = this.flashJitterSeed2 || 0;
        const seed3 = this.flashJitterSeed3 || 0;

        const domInputFocused = isDomTextInputFocused();
        const shouldReleaseKeyboardCapture = domInputFocused || this.inputFocusedRef?.current;

        const keyboard = this.input?.keyboard;
        if (keyboard?.manager) {
            const nextPreventDefault = !shouldReleaseKeyboardCapture;
            if (keyboard.manager.preventDefault !== nextPreventDefault) {
                keyboard.manager.preventDefault = nextPreventDefault;
            }
        }

        if (this.isPuzzleActive) {
            this.player.body.setVelocity(0);
            this.closeElevatorMenu?.();
            this.updatePuzzleCountdown();
            if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
                this.closeWirePuzzle();
                return;
            }
            const dt = Number(delta) || 0;
            if (this.puzzleType === "timing" && Phaser.Input.Keyboard.JustDown(this.keySpace)) this.tryTimingStop();
            else if (this.puzzleType === "qte") {
                const token = this.readQteJustDownToken();
                if (token) this.handleQteInput(token);
            } else if (this.puzzleType === "balance") this.updateBalancePuzzle(dt);
            else if (this.puzzleType === "dial") {
                this.updateDialPuzzle(dt);
                if (Phaser.Input.Keyboard.JustDown(this.keySpace)) this.tryDialConfirm();
            }
            return;
        }

        // 조사 UI 열려있으면 닫기만
        if (this.isInspecting) {
            this.player.body.setVelocity(0);
            this.closeElevatorMenu?.();
            if (Phaser.Input.Keyboard.JustDown(this.keySpace) || Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
                this.closeInspect();
            }
            return;
        }

        if (this.isTransitioning) {
            this.player.body.setVelocity(0);
            this.closeElevatorMenu?.();
            return;
        }

        // 손전등 배터리 게이지 업데이트
        const dtSecRaw = (Number(delta) || 0) / 1000;
        const dtSec = Phaser.Math.Clamp(dtSecRaw, 0, 0.25);
        if (dtSec > 0) {
            // [설정] 배터리 소모 속도 (0.02 = 천천히)
            const drain = Number(this.FLASHLIGHT_BATTERY_DRAIN_PER_SEC) || 0.02;
            const recharge = Number(this.FLASHLIGHT_BATTERY_RECHARGE_PER_SEC) || 0.15;

            const isUiBlockingInput = Boolean(this.isDialogActiveRef?.current || shouldReleaseKeyboardCapture);
            if (isUiBlockingInput && this.isFlashlightOn) {
                this.isFlashlightOn = false;
                this.flashAlphaIntent = 0;
                this.flashPower = 0;
                if (this.flashlight) {
                    this.flashAlpha = 0;
                    this.flashlight.setAlpha(0);
                    this.flashlight.setVisible(false);
                }
            }

            let battery = clamp01(this.flashBattery);
            const canConsume = Boolean(this.isFlashlightOn && !isUiBlockingInput);

            if (canConsume) {
                battery = clamp01(battery - drain * dtSec);
            } else {
                battery = clamp01(battery + recharge * dtSec);
            }

            if (this.isFlashlightOn && battery <= 0.001) {
                battery = 0;
                this.isFlashlightOn = false;
                this.flashAlphaIntent = 0;
                this.flashPower = 0;
                this.playUiBeep?.(320, 0.06, 0.07);
            }

            this.flashBattery = battery;
            const power = this.isFlashlightOn && !isUiBlockingInput ? 1 : 0;
            this.flashPower = power;
            this.flashAlphaIntent = power;
        }

        if (this.isDialogActiveRef?.current || shouldReleaseKeyboardCapture) {
            this.player.body.setVelocity(0);
            this.closeElevatorMenu?.();
            return;
        }

        // 손전등 토글
        if (Phaser.Input.Keyboard.JustDown(this.keyShift)) {
            if (this.isFlashlightOn) {
                this.isFlashlightOn = false;
                if (this.sfxFlashlight) this.sfxFlashlight.play();
                this.flashPower = 0;
                this.flashAlphaIntent = 0;
            } else {
                const battery = clamp01(this.flashBattery);
                if (battery <= 0.02) {
                    this.playUiBeep?.(260, 0.08, 0.08);
                } else {
                    this.isFlashlightOn = true;
                    if (this.sfxFlashlight) this.sfxFlashlight.play();
                    this.flashPower = 1;
                    this.flashAlphaIntent = 1;
                    if (this.flashlight) this.flashlight.setVisible(true);
                }
            }
        }

        // 노이즈
        if (this.staticNoise) {
            this.staticNoise.tilePositionX += Phaser.Math.Between(0, 3);
            this.staticNoise.tilePositionY += Phaser.Math.Between(0, 3);
            if (this.sfxNoise && this.sfxNoise.isPlaying && this.noiseStopAt > 0 && time > this.noiseStopAt) {
                this.sfxNoise.stop();
                this.noiseStopAt = 0;
            }
            if (Math.random() < 0.0016) {
                this.staticNoise.setAlpha(Phaser.Math.FloatBetween(0.28, 0.46));
                if (this.sfxNoise && time > this.noiseCooldownUntil && !this.sfxNoise.isPlaying) {
                    this.sfxNoise.play({ volume: 0.12, rate: Phaser.Math.FloatBetween(0.95, 1.05) });
                    this.noiseStopAt = time + 320;
                    this.noiseCooldownUntil = time + 1400;
                }
            } else {
                const a = Phaser.Math.Linear(this.staticNoise.alpha, this.grainBaseAlpha, 0.08);
                this.staticNoise.setAlpha(a);
            }
        }

        // 손전등 위치 및 크기 업데이트 (핵심 수정 부분)

        if (this.flashlight) {
            this.flashAlpha = Phaser.Math.Linear(this.flashAlpha, this.flashAlphaIntent, 0.18);

            // 1. 플레이어 주변을 밝히는 원형 빛(Halo) 생성
            if (!this.playerHalo) {
                // [밝기 버프] 투명도 0.4 -> 0.8로 대폭 상향 (아주 밝음)
                // 반지름 35 (아담하게)
                this.playerHalo = this.add.circle(0, 0, 25, 0xffffff, 0.8);

                // 빛이 겹칠수록 더 밝아지는 효과 (ADD)
                this.playerHalo.setBlendMode(Phaser.BlendModes.ADD);
            }

            // 2. 깊이(Depth) 정렬: 꼭짓점을 가리기 위해 순서 중요!
            // 순서: 플레이어(바닥) < 손전등(중간) < 원형 빛(맨 위)
            // 이렇게 하면 원형 빛이 손전등의 뾰족한 시작 부분을 덮어버립니다.
            if (this.playerHalo) this.playerHalo.setDepth(this.player.depth -2);
            this.flashlight.setDepth(this.player.depth + 10);

            // 꺼지는 조건
            if (this.flashAlphaIntent === 0 && this.flashAlpha < 0.02) {
                this.flashlight.setAlpha(0);
                this.flashlight.setVisible(false);
                if (this.playerHalo) {
                    this.playerHalo.setAlpha(0);
                    this.playerHalo.setVisible(false);
                }
            } else {
                this.flashlight.setVisible(true);
                if (this.playerHalo) this.playerHalo.setVisible(true);

                const battery = Phaser.Math.Clamp(Number(this.flashBattery) || 0, 0, 1);
                const seed1 = this.flashJitterSeed || 0;
                const flickerAmp = 0.06 + 0.12 * (1 - battery);
                const flicker = 1 - flickerAmp * (0.5 + 0.5 * Math.sin(time * 0.06 + seed1));

                // 최종 투명도 계산
                const finalAlpha = Phaser.Math.Clamp(this.flashAlpha * flicker, 0, 1);

                // 손전등 투명도 적용
                this.flashlight.setAlpha(finalAlpha*1.5);

                // [밝기 버프] 아까 있던 '* 0.5'를 제거했습니다. 이제 100% 밝기로 나옵니다.
                if (this.playerHalo) {

                    this.playerHalo.setPosition(this.player.x, this.player.y );
                    this.playerHalo.setAlpha(finalAlpha * 0.5);
                }

                if (this.isFlashlightOn) {
                    // 원형 빛이 덮어주므로, 시작점을 조금 더 안쪽(몸 쪽)으로 당겨도 됩니다.
                    const forwardOffset = 5;
                    const verticalOffset = 10;

                    let targetX = this.player.x;
                    let targetY = this.player.y + verticalOffset;
                    let angleDeg = 90;

                    if (this.lastDirection === "left") {
                        angleDeg = 180;
                        targetX -= forwardOffset;
                    } else if (this.lastDirection === "right") {
                        angleDeg = 0;
                        targetX += forwardOffset;
                    } else if (this.lastDirection === "up") {
                        angleDeg = 270;
                        targetY -= forwardOffset;
                    } else if (this.lastDirection === "down") {
                        angleDeg = 90;
                        targetY += forwardOffset;
                    }

                    const seed2 = this.flashJitterSeed2 || 0;
                    const seed3 = this.flashJitterSeed3 || 0;

                    const jitterRot =
                        (Math.sin(time * 0.01 + seed2) * 0.4 + Phaser.Math.FloatBetween(-0.4, 0.4)) * (Math.PI / 180);
                    const jitterX = Math.sin(time * 0.01 + seed3) * 0.2;
                    const jitterY = Math.sin(time * 0.015 + seed2) * 0.1;

                    this.flashlight.setPosition(targetX + jitterX, targetY + jitterY);

                    const targetRad = Phaser.Math.DegToRad(angleDeg) + jitterRot;
                    this.flashlight.rotation = Phaser.Math.Angle.RotateTo(this.flashlight.rotation, targetRad, 0.17);

                    const s = 1.0 + 0.018 * Math.sin(time * 0.03 + seed1);
                    this.flashlight.setScale(s);
                }
            }
        }

        // 나머지 로직 유지
        this.updateClueVisibilityByFlashlight();
        this.updateFlashlightDust(time);
        this.updateNearestClueHighlight(time);

        const currentRoom = this.roomsData[this.currentRoomIndex];
        if (!currentRoom) return;

        const portalX = currentRoom.x + this.ROOM_WIDTH / 2 + 8;
        const portalY = currentRoom.y + 43;
        const nearPortal = Phaser.Math.Distance.Between(this.player.x, this.player.y, portalX, portalY) < 40;
        this.updateElevatorGlows(time, nearPortal);

        if (this.isElevatorMenuOpen) {
            // (엘리베이터 메뉴 로직 생략 - 기존과 동일하게 두시면 됩니다)
            if (!nearPortal || !this.canUseElevatorRef?.current) {
                this.closeElevatorMenu();
            } else {
                this.updateElevatorMenuAvailability();
                this.elevatorMenuContainer.setPosition(this.player.x, this.player.y - 60);
                this.interactionContainer?.setVisible(false);

                const pulse = 0.82 + 0.18 * Math.sin(time * 0.02);
                if (this.elevatorMenuUpRow?.visible) {
                    this.elevatorMenuUpText.setAlpha(pulse);
                }
                if (this.elevatorMenuDownRow?.visible) {
                    this.elevatorMenuDownText.setAlpha(pulse);
                }
                if (this.elevatorMenuGlow) {
                    this.elevatorMenuGlow.setAlpha(0.18 + 0.18 * pulse);
                }
                if (this.elevatorMenuTitle) {
                    this.elevatorMenuTitle.setAlpha(0.7 + 0.3 * pulse);
                }
                if (this.elevatorMenuHint) {
                    this.elevatorMenuHint.setAlpha(0.5 + 0.2 * pulse);
                }

                const upPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.up);
                const downPressed = Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.wasd.down);

                if (upPressed && this.currentRoomIndex < this.ROOM_COUNT - 1) {
                    this.closeElevatorMenu();
                    this.startElevatorTransition(this.currentRoomIndex + 1);
                    return;
                }
                if (downPressed && this.currentRoomIndex > 0) {
                    this.closeElevatorMenu();
                    this.startElevatorTransition(this.currentRoomIndex - 1);
                    return;
                }
                if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
                    this.closeElevatorMenu();
                }
            }
            this.player.body.setVelocity(0);
            const dir = this.lastDirection || "down";
            this.player.anims.play(`bob-idle-${dir}`, true);
            this.player.setDepth(this.player.y);
            return;
        }

        // 이동
        const speed = 160;
        const body = this.player.body;
        const isLeft = this.cursors.left.isDown || this.wasd.left.isDown;
        const isRight = this.cursors.right.isDown || this.wasd.right.isDown;
        const isUp = this.cursors.up.isDown || this.wasd.up.isDown;
        const isDown = this.cursors.down.isDown || this.wasd.down.isDown;
        let vx = (isRight ? 1 : 0) - (isLeft ? 1 : 0);
        let vy = (isDown ? 1 : 0) - (isUp ? 1 : 0);
        const isMoving = vx !== 0 || vy !== 0;
        body.setVelocity(0);
        const skin = "bob";
        if (isMoving) {
            const v = new Phaser.Math.Vector2(vx, vy).normalize().scale(speed);
            body.setVelocity(v.x, v.y);
            if (Math.abs(vx) > Math.abs(vy)) this.lastDirection = vx > 0 ? "right" : "left";
            else this.lastDirection = vy > 0 ? "down" : "up";
            this.player.anims.play(`${skin}-${this.lastDirection}`, true);
        } else {
            const dir = this.lastDirection || "down";
            this.player.anims.play(`${skin}-idle-${dir}`, true);
        }
        this.player.setDepth(this.player.y);

        // 발소리/먼지
        const roomType = currentRoom?.type ?? "default";
        const fp = this.getFootstepProfile(roomType);
        if (this.footstepEmitter && isMoving) {
            if (time > this.lastFootstepTime + fp.interval) {
                this.footstepEmitter.explode(fp.dust, this.player.x, this.player.y + 20);
                if (this.sfxWalk) {
                    this.sfxWalk.play({
                        volume: fp.vol,
                        rate: Phaser.Math.FloatBetween(fp.rateMin, fp.rateMax),
                    });
                }
                this.lastFootstepTime = time;
            }
        }

        // 상호작용
        const nearestClue = this.getNearestClue(this.CLUE_INTERACT_RADIUS);
        if (nearestClue) {
            this.interactionContainer.setPosition(this.player.x, this.player.y - 34);
            this.updateInteractionPrompt("INSPECT", 0xffffcc);
            this.interactionContainer.setVisible(true);
            const p = 0.5 + 0.5 * Math.sin(time * 0.02);
            this.interactionContainer.setAlpha(0.85 + 0.15 * p);
            this.interactionContainer.setScale(1.0 + 0.03 * p);
            if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
                this.openWirePuzzle(nearestClue.obj);
            }
        } else if (nearPortal) {
            this.interactionContainer.setPosition(this.player.x, this.player.y - 34);
            this.updateInteractionPrompt("ELEVATOR", 0xffffff);
            this.interactionContainer.setVisible(true);
            this.interactionContainer.setAlpha(1);
            this.interactionContainer.setScale(1);
            if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
                if (!this.canUseElevatorRef?.current) return;
                const opened = this.openElevatorWirePuzzle();
                if (!opened) {
                    this.openElevatorMenu();
                    this.elevatorMenuContainer?.setPosition(this.player.x, this.player.y - 60);
                }
            }
        } else {
            this.interactionContainer.setVisible(false);
            this.interactionContainer.setAlpha(1);
            this.interactionContainer.setScale(1);
            if (this.promptBg) this.promptBg.setStrokeStyle(2, 0xffffff);
        }
    },
};