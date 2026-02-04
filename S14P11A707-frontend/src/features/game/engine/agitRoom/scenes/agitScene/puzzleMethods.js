import Phaser from "phaser";

const PUZZLE_HINT_STYLE = {
    fontSize: "14px",
    color: "#d6e8ff",
    fontStyle: "bold",
    fontFamily: '"Apple SD Gothic Neo","Malgun Gothic",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

export const puzzleMethods = {
    openWirePuzzle(target) {
        this.openCluePuzzle(target);
    },

    openCluePuzzle(target) {
        if (!target || this.isPuzzleActive) return;
        if (!this.ENABLE_PUZZLES) {
            if (target?.active) this.openInspect(target);
            return;
        }

        const rawChance = Number(this.CLUE_PUZZLE_CHANCE);
        const chance = Number.isFinite(rawChance) ? Phaser.Math.Clamp(rawChance, 0, 1) : 0.5;
        if (Math.random() >= chance) {
            if (target?.active) this.openInspect(target);
            return;
        }
    
        this.isPuzzleActive = true;
        this.puzzleTarget = target;
        this.puzzleSolvedCount = 0;
        this.puzzleActiveLeft = null;
    
        const cluePuzzleTypes = ["timing", "qte", "balance", "dial"];
        let selectedType = Phaser.Utils.Array.GetRandom(cluePuzzleTypes);
        if (this.lastCluePuzzleType && cluePuzzleTypes.length > 1 && selectedType === this.lastCluePuzzleType) {
            selectedType = Phaser.Utils.Array.GetRandom(cluePuzzleTypes.filter((t) => t !== this.lastCluePuzzleType));
        }
        this.puzzleType = selectedType;
        this.lastCluePuzzleType = selectedType;
    
        if (this.highlightTarget === target) this.highlightTarget = null;
        if (this.interactGlow) {
            this.interactGlow.setVisible(false);
            this.interactGlow.setAlpha(0);
        }
        this.setClueSparkle(false);
        this.interactionContainer?.setVisible(false);
    
        if (this.puzzleType === "wire") this.buildWirePuzzle();
        else if (this.puzzleType === "qte") this.buildQtePuzzle();
        else if (this.puzzleType === "balance") this.buildBalancePuzzle();
        else if (this.puzzleType === "dial") this.buildDialPuzzle();
        else this.buildTimingPuzzle();
    },

    openElevatorWirePuzzle() {
        if (this.isPuzzleActive) return false;
        if (!this.ENABLE_PUZZLES) return false;

        const rawChance = Number(this.ELEVATOR_WIRE_PUZZLE_CHANCE);
        const chance = Number.isFinite(rawChance) ? Phaser.Math.Clamp(rawChance, 0, 1) : 0.4;
        if (Math.random() >= chance) return false;
    
        this.isPuzzleActive = true;
        this.puzzleTarget = null;
        this.puzzleSolvedCount = 0;
        this.puzzleActiveLeft = null;
        this.puzzleType = "wire";
        this.elevatorWirePending = true;
    
        if (this.interactGlow) {
            this.interactGlow.setVisible(false);
            this.interactGlow.setAlpha(0);
        }
        this.setClueSparkle(false);
        this.interactionContainer?.setVisible(false);
    
        this.buildWirePuzzle();
        return true;
    },

    closeWirePuzzle() {
        this.isPuzzleActive = false;
        this.puzzleActiveLeft = null;
        this.puzzleSolvedCount = 0;
        this.puzzleTarget = null;
        this.puzzleType = null;
        this.elevatorWirePending = false;
        if (this.puzzleTimeoutEvent) {
            this.puzzleTimeoutEvent.remove(false);
            this.puzzleTimeoutEvent = null;
        }
        this.puzzleEndsAt = 0;
        if (this.timingTween) {
            this.timingTween.stop();
            this.timingTween = null;
        }
        this.timingBar = null;
        this.timingZone = null;
        this.timingIndicator = null;
    
        this.puzzleCountdownText = null;
    
        this.qteSequence = [];
        this.qteIndex = 0;
        this.qteSequenceText = null;
        this.qteProgressText = null;
    
        this.balanceBar = null;
        this.balanceZone = null;
        this.balanceIndicator = null;
        this.balanceProgressText = null;
        this.balanceX = 0;
        this.balanceV = 0;
        this.balanceHoldMs = 0;
        this.balanceHoldTargetMs = 0;
    
        this.dialGroup = null;
        this.dialGraphics = null;
        this.dialPointer = null;
        this.dialMarkers = [];
        this.dialRotation = 0;
        this.dialTargets = [];
        this.dialTargetIndex = 0;
        this.dialStatusText = null;
    
        if (this.puzzleContainer) {
            this.puzzleContainer.destroy(true);
            this.puzzleContainer = null;
        }
        this.puzzleLeftSockets = [];
        this.puzzleRightSockets = [];
        this.puzzleLines = [];
        this.puzzleTitle = null;
        this.puzzleHint = null;
    },

    buildWirePuzzle() {
        const w = this.sys.game.config.width;
        const h = this.sys.game.config.height;
    
        if (this.puzzleContainer) this.puzzleContainer.destroy(true);
    
        const container = this.add.container(w / 2, h / 2).setScrollFactor(0).setDepth(32000);
        const bg = this.add.rectangle(0, 0, 300, 220, 0x090d12, 0.95).setStrokeStyle(2, 0x7fb2ff, 0.9);
        const title = this.add
            .text(0, -96, "WIRE PANEL", { fontSize: "12px", color: "#d6e8ff", fontStyle: "bold" })
            .setOrigin(0.5);
        title.setShadow(0, 1, "#000", 2, true, true);
    
        const hint = this.add.text(0, 96, "이어라", PUZZLE_HINT_STYLE).setOrigin(0.5);
        hint.setShadow(0, 1, "#000", 2, true, true);
    
        container.add([bg, title, hint]);
    
        const colors = [0x6fd3ff, 0xff9b7a, 0x9bff9b, 0xfff07a, 0xb78bff, 0xff88c4];
        const wireCount = 4;
    
        const leftX = -90;
        const rightX = 90;
        const startY = -48;
        const gap = 30;
    
        const baseOrder = Array.from({ length: wireCount }, (_, i) => i);
        let rightOrder = [...baseOrder];
        let tries = 0;
        while (tries < 10) {
            rightOrder = Phaser.Utils.Array.Shuffle([...baseOrder]);
            let same = true;
            for (let i = 0; i < wireCount; i++) {
                if (rightOrder[i] !== baseOrder[i]) {
                    same = false;
                    break;
                }
            }
            if (!same) break;
            tries += 1;
        }
    
        this.puzzleLeftSockets = [];
        this.puzzleRightSockets = [];
        this.puzzleLines = [];
    
        for (let i = 0; i < wireCount; i++) {
            const y = startY + i * gap;
            const color = colors[i];
    
            const leftSocket = this.add.circle(leftX, y, 7, color, 1).setStrokeStyle(2, 0x0f141b);
            leftSocket.setData("index", i);
            leftSocket.setData("connected", false);
    
            const rightColorIndex = rightOrder[i];
            const rightSocket = this.add.circle(rightX, y, 7, colors[rightColorIndex], 1).setStrokeStyle(2, 0x0f141b);
            rightSocket.setData("index", rightColorIndex);
            rightSocket.setData("connected", false);
    
            this.puzzleLeftSockets.push(leftSocket);
            this.puzzleRightSockets.push(rightSocket);
            container.add([leftSocket, rightSocket]);
    
            leftSocket.setInteractive(new Phaser.Geom.Circle(0, 0, 7), Phaser.Geom.Circle.Contains, { useHandCursor: true });
            leftSocket.on("pointerdown", () => this.selectWireLeft(i));
    
            rightSocket.setInteractive(new Phaser.Geom.Circle(0, 0, 7), Phaser.Geom.Circle.Contains, { useHandCursor: true });
            rightSocket.on("pointerdown", () => this.tryConnectWire(rightColorIndex));
        }
    
        this.puzzleContainer = container;
        this.puzzleTitle = title;
        this.puzzleHint = hint;
    },

    buildTimingPuzzle() {
        const w = this.sys.game.config.width;
        const h = this.sys.game.config.height;
    
        if (this.puzzleContainer) this.puzzleContainer.destroy(true);
    
        const container = this.add.container(w / 2, h / 2).setScrollFactor(0).setDepth(32000);
        const bg = this.add.rectangle(0, 0, 300, 220, 0x090d12, 0.95).setStrokeStyle(2, 0x7fb2ff, 0.9);
        const title = this.add
            .text(0, -96, "TIMING LOCK", { fontSize: "12px", color: "#d6e8ff", fontStyle: "bold" })
            .setOrigin(0.5);
        title.setShadow(0, 1, "#000", 2, true, true);
    
        const hint = this.add.text(0, 96, "눌러라", PUZZLE_HINT_STYLE).setOrigin(0.5);
        hint.setShadow(0, 1, "#000", 2, true, true);
    
        const barW = 220;
        const barH = 10;
        const bar = this.add.rectangle(0, 0, barW, barH, 0x1b2430, 1).setStrokeStyle(1, 0x7fb2ff, 0.9);
    
        const zoneW = 40;
        const zoneMinX = -barW / 2 + zoneW / 2;
        const zoneMaxX = barW / 2 - zoneW / 2;
        const zoneX = Phaser.Math.Between(zoneMinX, zoneMaxX);
        const zone = this.add.rectangle(zoneX, 0, zoneW, barH + 6, 0x7fb2ff, 0.35).setStrokeStyle(1, 0xffffff, 0.6);
    
        const indicator = this.add.rectangle(-barW / 2, 0, 8, barH + 8, 0xfff07a, 1).setStrokeStyle(1, 0xffffff, 0.8);
    
        const timerText = this.add
            .text(140, -102, "", { fontSize: "10px", color: "#9cc2ff", fontStyle: "bold" })
            .setOrigin(1, 0);
    
        container.add([bg, title, hint, bar, zone, indicator]);
        container.add(timerText);
    
        this.puzzleContainer = container;
        this.puzzleTitle = title;
        this.puzzleHint = hint;
        this.puzzleCountdownText = timerText;
        this.timingBar = bar;
        this.timingZone = zone;
        this.timingIndicator = indicator;
    
        this.timingTween = this.tweens.add({
            targets: indicator,
            x: barW / 2,
            duration: Phaser.Math.Between(900, 1300),
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });
    
        this.startPuzzleTimer(Phaser.Math.Between(6500, 9000));
    },

    startPuzzleTimer(durationMs) {
        if (this.puzzleTimeoutEvent) {
            this.puzzleTimeoutEvent.remove(false);
            this.puzzleTimeoutEvent = null;
        }
        const ms = Math.max(0, Number(durationMs) || 0);
        this.puzzleEndsAt = this.time.now + ms;
        this.updatePuzzleCountdown();
        this.puzzleTimeoutEvent = this.time.delayedCall(ms, () => {
            if (!this.isPuzzleActive) return;
            this.failPuzzle("TIMEOUT");
        });
    },

    updatePuzzleCountdown() {
        if (!this.isPuzzleActive) return;
        if (!this.puzzleCountdownText || !this.puzzleEndsAt) return;
        const remainMs = Math.max(0, this.puzzleEndsAt - this.time.now);
        const remainS = (remainMs / 1000).toFixed(1);
        this.puzzleCountdownText.setText(`${remainS}s`);
        if (remainMs <= 2000) this.puzzleCountdownText.setColor("#ff9b7a");
        else this.puzzleCountdownText.setColor("#9cc2ff");
    },

    handlePuzzleSolved() {
        if (!this.isPuzzleActive) return;
        if (this.puzzleTimeoutEvent) {
            this.puzzleTimeoutEvent.remove(false);
            this.puzzleTimeoutEvent = null;
        }
        this.puzzleEndsAt = 0;
        if (this.puzzleHint) this.puzzleHint.setText("UNLOCKED");
        this.playUiBeep(860, 0.06, 0.08);
        this.time.delayedCall(180, () => {
            const target = this.puzzleTarget;
            const shouldOpenElevator = this.elevatorWirePending;
            this.closeWirePuzzle();
            if (shouldOpenElevator) {
                this.openElevatorMenu();
                this.elevatorMenuContainer?.setPosition(this.player.x, this.player.y - 60);
                return;
            }
            if (target?.active) this.openInspect(target);
        });
    },

    failPuzzle(message = "ACCESS DENIED") {
        if (!this.isPuzzleActive) return;
        if (this.puzzleTimeoutEvent) {
            this.puzzleTimeoutEvent.remove(false);
            this.puzzleTimeoutEvent = null;
        }
        this.puzzleEndsAt = 0;
        if (this.puzzleHint) this.puzzleHint.setText(message);
        this.playUiBeep(220, 0.09, 0.08);
        if (this.puzzleContainer) {
            this.tweens.add({
                targets: this.puzzleContainer,
                x: "+=6",
                duration: 50,
                yoyo: true,
                repeat: 2,
                ease: "Sine.easeInOut",
            });
        }
        this.time.delayedCall(520, () => this.closeWirePuzzle());
    },

    qteTokenLabel(token) {
        if (token === "UP") return "↑";
        if (token === "DOWN") return "↓";
        if (token === "LEFT") return "←";
        if (token === "RIGHT") return "→";
        if (token === "SPACE") return "SPACE";
        return String(token ?? "");
    },

    qteBuildDisplayString() {
        const tokens = Array.isArray(this.qteSequence) ? this.qteSequence : [];
        const idx = Number.isFinite(this.qteIndex) ? this.qteIndex : 0;
        return tokens
            .map((t, i) => {
                const label = this.qteTokenLabel(t);
                if (i < idx) return "·";
                if (i === idx) return `[${label}]`;
                return label;
            })
            .join(" ");
    },

    buildQtePuzzle() {
        const w = this.sys.game.config.width;
        const h = this.sys.game.config.height;
    
        if (this.puzzleContainer) this.puzzleContainer.destroy(true);
    
        const container = this.add.container(w / 2, h / 2).setScrollFactor(0).setDepth(32000);
        const bg = this.add.rectangle(0, 0, 320, 230, 0x090d12, 0.95).setStrokeStyle(2, 0x7fb2ff, 0.9);
        const title = this.add
            .text(0, -102, "TRACE SEQUENCE", { fontSize: "12px", color: "#d6e8ff", fontStyle: "bold" })
            .setOrigin(0.5);
        title.setShadow(0, 1, "#000", 2, true, true);
    
        const hint = this.add
            .text(0, 98, "따라라", PUZZLE_HINT_STYLE)
            .setOrigin(0.5);
        hint.setShadow(0, 1, "#000", 2, true, true);
    
        const timerText = this.add
            .text(150, -108, "", { fontSize: "10px", color: "#9cc2ff", fontStyle: "bold" })
            .setOrigin(1, 0);
    
        const length = Phaser.Math.Between(6, 8);
        const seq = [];
        for (let i = 0; i < length; i++) {
            const pool = ["UP", "DOWN", "LEFT", "RIGHT"];
            if (Math.random() < 0.22) pool.push("SPACE");
            let pick = Phaser.Utils.Array.GetRandom(pool);
            if (i > 0 && pick === seq[i - 1]) {
                pick = Phaser.Utils.Array.GetRandom(pool);
            }
            seq.push(pick);
        }
        if (!seq.includes("SPACE") && Math.random() < 0.55) {
            const at = Phaser.Math.Between(1, Math.max(1, length - 2));
            seq[at] = "SPACE";
        }
        this.qteSequence = seq;
        this.qteIndex = 0;
    
        const seqText = this.add
            .text(0, -18, this.qteBuildDisplayString(), {
                fontSize: "18px",
                color: "#e9f3ff",
                fontStyle: "bold",
                align: "center",
                wordWrap: { width: 280 },
            })
            .setOrigin(0.5);
    
        const progressText = this.add
            .text(0, 26, `STEP 0/${seq.length}`, { fontSize: "11px", color: "#9fb1c7" })
            .setOrigin(0.5);
    
        container.add([bg, title, hint, timerText, seqText, progressText]);
    
        this.puzzleContainer = container;
        this.puzzleTitle = title;
        this.puzzleHint = hint;
        this.puzzleCountdownText = timerText;
        this.qteSequenceText = seqText;
        this.qteProgressText = progressText;
    
        const durationMs = Phaser.Math.Clamp(4200 + seq.length * 750, 6500, 9500);
        this.startPuzzleTimer(durationMs);
    },

    readQteJustDownToken() {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.up)) return "UP";
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.wasd.down)) return "DOWN";
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.wasd.left)) return "LEFT";
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.wasd.right)) return "RIGHT";
        if (Phaser.Input.Keyboard.JustDown(this.keySpace)) return "SPACE";
        return null;
    },

    handleQteInput(token) {
        const seq = Array.isArray(this.qteSequence) ? this.qteSequence : [];
        if (!seq.length) return;
    
        const expected = seq[this.qteIndex];
        if (token === expected) {
            this.qteIndex += 1;
            this.playUiBeep(780, 0.04, 0.06);
        } else {
            this.qteIndex = Math.max(0, this.qteIndex - 1);
            this.playUiBeep(260, 0.06, 0.06);
            if (this.puzzleContainer) {
                this.tweens.add({
                    targets: this.puzzleContainer,
                    angle: Phaser.Math.Between(-2, 2),
                    duration: 60,
                    yoyo: true,
                    repeat: 1,
                    ease: "Sine.easeInOut",
                    onComplete: () => this.puzzleContainer?.setAngle(0),
                });
            }
        }
    
        if (this.qteSequenceText) this.qteSequenceText.setText(this.qteBuildDisplayString());
        if (this.qteProgressText) this.qteProgressText.setText(`STEP ${Math.min(this.qteIndex, seq.length)}/${seq.length}`);
    
        if (this.qteIndex >= seq.length) {
            this.handlePuzzleSolved();
        }
    },

    buildBalancePuzzle() {
        const w = this.sys.game.config.width;
        const h = this.sys.game.config.height;
    
        if (this.puzzleContainer) this.puzzleContainer.destroy(true);
    
        const container = this.add.container(w / 2, h / 2).setScrollFactor(0).setDepth(32000);
        const bg = this.add.rectangle(0, 0, 320, 230, 0x090d12, 0.95).setStrokeStyle(2, 0x7fb2ff, 0.9);
        const title = this.add
            .text(0, -102, "SIGNAL STABILIZER", { fontSize: "12px", color: "#d6e8ff", fontStyle: "bold" })
            .setOrigin(0.5);
        title.setShadow(0, 1, "#000", 2, true, true);
    
        const hint = this.add.text(0, 98, "유지해라", PUZZLE_HINT_STYLE).setOrigin(0.5);
        hint.setShadow(0, 1, "#000", 2, true, true);
    
        const timerText = this.add
            .text(150, -108, "", { fontSize: "10px", color: "#9cc2ff", fontStyle: "bold" })
            .setOrigin(1, 0);
    
        const barW = 240;
        const barH = 10;
        const bar = this.add.rectangle(0, -8, barW, barH, 0x1b2430, 1).setStrokeStyle(1, 0x7fb2ff, 0.9);
        const zoneW = 78;
        const zone = this.add.rectangle(0, -8, zoneW, barH + 8, 0x7fb2ff, 0.25).setStrokeStyle(1, 0xffffff, 0.5);
        const indicator = this.add.rectangle(0, -8, 10, barH + 10, 0xfff07a, 1).setStrokeStyle(1, 0xffffff, 0.8);
    
        const progressText = this.add.text(0, 22, "", { fontSize: "11px", color: "#9fb1c7" }).setOrigin(0.5);
    
        container.add([bg, title, hint, timerText, bar, zone, indicator, progressText]);
    
        this.puzzleContainer = container;
        this.puzzleTitle = title;
        this.puzzleHint = hint;
        this.puzzleCountdownText = timerText;
    
        this.balanceBar = bar;
        this.balanceZone = zone;
        this.balanceIndicator = indicator;
        this.balanceProgressText = progressText;
    
        this.balanceX = Phaser.Math.Between(-barW * 0.18, barW * 0.18);
        this.balanceV = 0;
        this.balanceHoldMs = 0;
        this.balanceHoldTargetMs = Phaser.Math.Between(2600, 3400);
        this.balanceNoiseSeed = Math.random() * 1000;
        this.balanceNoiseSeed2 = Math.random() * 1000;
    
        indicator.x = this.balanceX;
        progressText.setText(`STABLE 0.0/${(this.balanceHoldTargetMs / 1000).toFixed(1)}s`);
    
        this.startPuzzleTimer(Phaser.Math.Between(7000, 9000));
    },

    updateBalancePuzzle(delta) {
        if (!this.balanceBar || !this.balanceZone || !this.balanceIndicator) return;
    
        const leftDown = this.cursors.left.isDown || this.wasd.left.isDown;
        const rightDown = this.cursors.right.isDown || this.wasd.right.isDown;
        const input = (rightDown ? 1 : 0) - (leftDown ? 1 : 0);
    
        const t = this.time.now;
        const drift =
            0.00055 * Math.sin(t * 0.0026 + this.balanceNoiseSeed) +
            0.00035 * Math.sin(t * 0.0062 + this.balanceNoiseSeed2);
    
        const accel = input * 0.0023;
        this.balanceV += (accel + drift) * delta;
    
        const damping = Math.pow(0.92, delta / 16);
        this.balanceV *= damping;
    
        this.balanceX += this.balanceV * delta;
    
        const halfW = (this.balanceBar.width || 240) / 2;
        const clamp = halfW - 2;
        if (this.balanceX < -clamp) {
            this.balanceX = -clamp;
            this.balanceV *= -0.15;
        } else if (this.balanceX > clamp) {
            this.balanceX = clamp;
            this.balanceV *= -0.15;
        }
    
        this.balanceIndicator.x = this.balanceX;
    
        const inZone = Math.abs(this.balanceX - this.balanceZone.x) <= this.balanceZone.width / 2;
        if (inZone) this.balanceHoldMs += delta;
        else this.balanceHoldMs = Math.max(0, this.balanceHoldMs - delta * 0.7);
    
        if (this.balanceProgressText) {
            this.balanceProgressText.setText(
                `STABLE ${(this.balanceHoldMs / 1000).toFixed(1)}/${(this.balanceHoldTargetMs / 1000).toFixed(1)}s`,
            );
        }
    
        if (this.balanceHoldMs >= this.balanceHoldTargetMs) {
            this.handlePuzzleSolved();
        }
    },

    buildDialPuzzle() {
        const w = this.sys.game.config.width;
        const h = this.sys.game.config.height;
    
        if (this.puzzleContainer) this.puzzleContainer.destroy(true);
    
        const container = this.add.container(w / 2, h / 2).setScrollFactor(0).setDepth(32000);
        const bg = this.add.rectangle(0, 0, 320, 250, 0x090d12, 0.95).setStrokeStyle(2, 0x7fb2ff, 0.9);
        const title = this.add.text(0, -112, "SAFE DIAL", { fontSize: "12px", color: "#d6e8ff", fontStyle: "bold" }).setOrigin(0.5);
        title.setShadow(0, 1, "#000", 2, true, true);
    
        const hint = this.add.text(0, 108, "맞춰라", PUZZLE_HINT_STYLE).setOrigin(0.5);
        hint.setShadow(0, 1, "#000", 2, true, true);
    
        const timerText = this.add
            .text(150, -118, "", { fontSize: "10px", color: "#9cc2ff", fontStyle: "bold" })
            .setOrigin(1, 0);
    
        const statusText = this.add.text(0, -82, "", { fontSize: "11px", color: "#9fb1c7" }).setOrigin(0.5);
    
        const dialGroup = this.add.container(0, 14);
        const g = this.add.graphics();
        const radius = 62;
    
        g.lineStyle(2, 0xd6e8ff, 0.9);
        g.strokeCircle(0, 0, radius);
        g.lineStyle(1, 0x7f90a8, 0.7);
        for (let i = 0; i < 24; i++) {
            const a = (i / 24) * Math.PI * 2;
            const x1 = Math.sin(a) * (radius - 2);
            const y1 = -Math.cos(a) * (radius - 2);
            const x2 = Math.sin(a) * (radius - (i % 3 === 0 ? 12 : 7));
            const y2 = -Math.cos(a) * (radius - (i % 3 === 0 ? 12 : 7));
            g.beginPath();
            g.moveTo(x1, y1);
            g.lineTo(x2, y2);
            g.strokePath();
        }
    
        const inner = this.add.circle(0, 0, radius - 18, 0x0f141b, 0.95).setStrokeStyle(1, 0x7fb2ff, 0.6);
    
        dialGroup.add([g, inner]);
    
        const markerRadius = radius - 10;
        const targetCount = Phaser.Math.Between(2, 3);
        const targets = [];
        let attempts = 0;
        while (targets.length < targetCount && attempts < 40) {
            attempts += 1;
            const candidate = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const ok = targets.every((a) => Math.abs(Phaser.Math.Angle.Wrap(a - candidate)) > 0.8);
            if (ok) targets.push(candidate);
        }
        if (targets.length < targetCount) {
            while (targets.length < targetCount) targets.push(Phaser.Math.FloatBetween(0, Math.PI * 2));
        }
    
        const markers = targets.map((a, i) => {
            const mx = Math.sin(a) * markerRadius;
            const my = -Math.cos(a) * markerRadius;
            const m = this.add.circle(mx, my, 5, i === 0 ? 0xfff07a : 0x7fb2ff, i === 0 ? 1 : 0.25).setStrokeStyle(1, 0xffffff, i === 0 ? 0.8 : 0.35);
            dialGroup.add(m);
            return m;
        });
    
        const pointerTipY = dialGroup.y - radius + 2;
        const pointer = this.add
            .triangle(0, pointerTipY - 9, 10, 18, 20, 0, 0, 0, 0xfff07a, 1)
            .setStrokeStyle(1, 0xffffff, 0.8);
    
        container.add([bg, title, hint, timerText, statusText, dialGroup, pointer]);
    
        this.puzzleContainer = container;
        this.puzzleTitle = title;
        this.puzzleHint = hint;
        this.puzzleCountdownText = timerText;
    
        this.dialGroup = dialGroup;
        this.dialGraphics = g;
        this.dialPointer = pointer;
        this.dialMarkers = markers;
        this.dialTargets = targets;
        this.dialTargetIndex = 0;
        this.dialRotation = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.dialGroup.rotation = this.dialRotation;
        this.dialStatusText = statusText;
        this.dialStatusText.setText(`TUMBLER 1/${targets.length}`);
    
        this.startPuzzleTimer(Phaser.Math.Between(8000, 9800));
    },

    updateDialPuzzle(delta) {
        if (!this.dialGroup || !Array.isArray(this.dialTargets) || !this.dialTargets.length) return;
    
        const leftDown = this.cursors.left.isDown || this.wasd.left.isDown;
        const rightDown = this.cursors.right.isDown || this.wasd.right.isDown;
        const input = (rightDown ? 1 : 0) - (leftDown ? 1 : 0);
    
        const speed = 0.00235;
        this.dialRotation += input * speed * delta;
        this.dialRotation = Phaser.Math.Angle.Wrap(this.dialRotation);
        this.dialGroup.rotation = this.dialRotation;
    
        const targetAngle = this.dialTargets[this.dialTargetIndex] ?? 0;
        const err = Math.abs(Phaser.Math.Angle.Wrap(targetAngle + this.dialRotation));
        const deg = Math.round(Phaser.Math.RadToDeg(err));
        this.dialStatusText?.setText(`TUMBLER ${this.dialTargetIndex + 1}/${this.dialTargets.length}  Δ${deg}°`);
    },

    tryDialConfirm() {
        if (!Array.isArray(this.dialTargets) || !this.dialTargets.length) return;
        const targetAngle = this.dialTargets[this.dialTargetIndex];
        if (!Number.isFinite(targetAngle)) return;
    
        const tol = 0.18;
        const err = Phaser.Math.Angle.Wrap(targetAngle + this.dialRotation);
    
        if (Math.abs(err) <= tol) {
            this.playUiBeep(860, 0.05, 0.08);
            this.dialTargetIndex += 1;
            this.dialMarkers.forEach((m, i) => {
                if (!m) return;
                if (i < this.dialTargetIndex) m.setFillStyle(0x7fb2ff, 0.18).setStrokeStyle(1, 0xffffff, 0.25);
                else if (i === this.dialTargetIndex) m.setFillStyle(0xfff07a, 1).setStrokeStyle(1, 0xffffff, 0.8);
                else m.setFillStyle(0x7fb2ff, 0.25).setStrokeStyle(1, 0xffffff, 0.35);
            });
    
            if (this.dialTargetIndex >= this.dialTargets.length) {
                this.handlePuzzleSolved();
                return;
            }
    
            this.dialStatusText?.setText(`TUMBLER ${this.dialTargetIndex + 1}/${this.dialTargets.length}`);
            return;
        }
    
        this.playUiBeep(260, 0.06, 0.06);
        if (this.puzzleContainer) {
            this.tweens.add({
                targets: this.puzzleContainer,
                x: "+=6",
                duration: 50,
                yoyo: true,
                repeat: 2,
                ease: "Sine.easeInOut",
            });
        }
    },

    pulseSocket(socket) {
        if (!socket) return;
        this.tweens.add({
            targets: socket,
            scale: 1.35,
            duration: 70,
            yoyo: true,
            repeat: 0,
            ease: "Sine.easeOut",
        });
    },

    handlePuzzlePointerDown(pointer) {
        if (!this.isPuzzleActive) return;
        if (this.puzzleType === "wire" && (!this.puzzleLeftSockets.length || !this.puzzleRightSockets.length)) return;
    
        this.handlePuzzlePointerAtScreen(pointer.x, pointer.y);
    },

    handlePuzzlePointerAtScreen(screenX, screenY) {
        if (!this.isPuzzleActive) return;
        if (this.puzzleType === "timing") {
            this.tryTimingStop();
            return;
        }
        if (this.puzzleType !== "wire") return;
        const hitRadius = 24;
        const container = this.puzzleContainer;
        if (!container) return;
        const cam = this.cameras.main;
        const worldPoint = cam.getWorldPoint(screenX, screenY);
        const localPoint = container.getLocalPoint(worldPoint.x, worldPoint.y);
        const localX = localPoint.x;
        const localY = localPoint.y;
    
        if (this.puzzleActiveLeft == null) {
            const hitLeft = this.findSocketHitLocal(this.puzzleLeftSockets, localX, localY, hitRadius);
            if (hitLeft) {
                this.pulseSocket(hitLeft);
                const leftIndex = hitLeft.getData("index");
                this.selectWireLeft(leftIndex);
            }
            return;
        }
    
        const hitRight = this.findSocketHitLocal(this.puzzleRightSockets, localX, localY, hitRadius);
        if (hitRight) {
            this.pulseSocket(hitRight);
            const rightIndex = hitRight.getData("index");
            this.tryConnectWire(rightIndex);
        }
    },

    findSocketHitLocal(sockets, localX, localY, radius) {
        for (let i = 0; i < sockets.length; i++) {
            const socket = sockets[i];
            if (!socket || socket.getData("connected")) continue;
            const dist = Phaser.Math.Distance.Between(localX, localY, socket.x, socket.y);
            if (dist <= radius) {
                return socket;
            }
        }
        return null;
    },

    selectWireLeft(index) {
        if (!this.puzzleLeftSockets[index]) return;
        if (this.puzzleLeftSockets[index].getData("connected")) return;
    
        this.puzzleActiveLeft = index;
        this.puzzleLeftSockets.forEach((socket, i) => {
            if (!socket) return;
            const scale = i === index ? 1.25 : 1.0;
            socket.setScale(scale);
            socket.setStrokeStyle(i === index ? 3 : 2, 0x0f141b);
        });
    },

    tryConnectWire(rightColorIndex) {
        if (this.puzzleActiveLeft == null) return;
    
        const leftIndex = this.puzzleActiveLeft;
        const leftSocket = this.puzzleLeftSockets[leftIndex];
        if (!leftSocket || leftSocket.getData("connected")) return;
    
        const rightSocket = this.puzzleRightSockets.find((socket) => socket?.getData("index") === rightColorIndex);
        if (!rightSocket || rightSocket.getData("connected")) return;
    
        if (rightColorIndex !== leftIndex) {
            this.playUiBeep(280, 0.08, 0.06);
            if (this.puzzleContainer) {
                this.tweens.add({
                    targets: this.puzzleContainer,
                    x: "+=6",
                    duration: 50,
                    yoyo: true,
                    repeat: 2,
                    ease: "Sine.easeInOut",
                });
            }
            return;
        }
    
        const line = this.add.graphics();
        line.lineStyle(3, leftSocket.fillColor, 0.9);
        line.beginPath();
        line.moveTo(leftSocket.x, leftSocket.y);
        line.lineTo(rightSocket.x, rightSocket.y);
        line.strokePath();
        this.puzzleLines.push(line);
        this.puzzleContainer.add(line);
    
        leftSocket.setData("connected", true);
        rightSocket.setData("connected", true);
        leftSocket.disableInteractive();
        rightSocket.disableInteractive();
        leftSocket.setScale(1.0);
        leftSocket.setStrokeStyle(2, 0x0f141b);
        rightSocket.setStrokeStyle(2, 0x0f141b);
    
        this.puzzleSolvedCount += 1;
        this.playUiBeep(860, 0.06, 0.08);
        this.puzzleActiveLeft = null;
    
        if (this.puzzleSolvedCount >= this.puzzleLeftSockets.length) {
            this.handlePuzzleSolved();
        }
    },

    tryTimingStop() {
        if (!this.timingIndicator || !this.timingZone) return;
        if (!this.timingTween) return;
    
        this.timingTween.stop();
        this.timingTween = null;
    
        const indicatorX = this.timingIndicator.x;
        const zoneLeft = this.timingZone.x - this.timingZone.width / 2;
        const zoneRight = this.timingZone.x + this.timingZone.width / 2;
    
        if (indicatorX >= zoneLeft && indicatorX <= zoneRight) {
            this.handlePuzzleSolved();
            return;
        }
    
        this.playUiBeep(280, 0.08, 0.06);
        if (this.puzzleContainer) {
            this.tweens.add({
                targets: this.puzzleContainer,
                x: "+=6",
                duration: 50,
                yoyo: true,
                repeat: 2,
                ease: "Sine.easeInOut",
            });
        }
    
        if (this.timingIndicator) {
            const barW = this.timingBar?.width || 220;
            this.timingIndicator.x = -barW / 2;
        }
    
        this.timingTween = this.tweens.add({
            targets: this.timingIndicator,
            x: (this.timingBar?.width || 220) / 2,
            duration: Phaser.Math.Between(900, 1300),
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });
    },

};
