import Phaser from "phaser";

export const uiMethods = {
    getUiCamera() {
        return this.cameras?.main ?? null;
    },

    getUiMetrics() {
        const cam = this.getUiCamera?.();
        const width = Number(cam?.width) || Number(this.sys.game.config.width) || 640;
        const height = Number(cam?.height) || Number(this.sys.game.config.height) || 640;
        const zoomX = Number(cam?.zoomX ?? cam?.zoom) || 1;
        const zoomY = Number(cam?.zoomY ?? cam?.zoom) || 1;
        const invX = zoomX > 0 ? 1 / zoomX : 1;
        const invY = zoomY > 0 ? 1 / zoomY : 1;
        const originXPx = width * Number(cam?.originX ?? 0.5);
        const originYPx = height * Number(cam?.originY ?? 0.5);

        return { cam, width, height, zoomX, zoomY, invX, invY, originXPx, originYPx };
    },

    screenToUiWorld(screenX, screenY) {
        const m = this.getUiMetrics?.();
        if (!m) return { x: screenX, y: screenY, inv: 1 };

        // Camera origin (0.5,0.5 default) changes how zoom affects screen space.
        // For scrollFactor=0 HUD elements:
        // screen = world * zoom + originPx * (1 - zoom)
        // => world = screen / zoom + originPx * (1 - 1/zoom)
        const x = screenX * m.invX + m.originXPx * (1 - m.invX);
        const y = screenY * m.invY + m.originYPx * (1 - m.invY);

        return { x, y, inv: m.invX };
    },

    createFloorHud() {
        const container = this.add.container(0, 0).setScrollFactor(0, 0, true).setDepth(15000);
    
        const bg = this.add.rectangle(0, 0, 150, 26, 0x0a0f14, 0.92).setStrokeStyle(1, 0x7fb2ff, 0.9);
        const topLine = this.add.rectangle(0, -11, 150, 2, 0x7fb2ff, 0.75);
        const accent = this.add.rectangle(-60, 0, 6, 16, 0x7fb2ff, 0.9);
        const text = this.add
            .text(-52, 0, "FLOOR 01", { fontSize: "11px", color: "#e7f2ff", fontStyle: "bold" })
            .setOrigin(0, 0.5);
        text.setShadow(0, 1, "#000", 2, false, true);
    
        container.add([bg, topLine, accent, text]);
        container.setScrollFactor(0, 0, true);

        this.floorHudContainer = container;
        this.floorHudBg = bg;
        this.floorHudText = text;
        this.floorHudAccent = accent;
        this.floorHudTopLine = topLine;
        this.layoutFloorHud?.();
    
        this.scale.on(
            "resize",
            (gameSize) => {
                this.layoutFloorHud?.();
            },
            this
        );
    },

    layoutFloorHud() {
        if (!this.floorHudContainer) return;
        const m = this.getUiMetrics?.();
        const screenW = Number(m?.width) || Number(this.sys.game.config.width) || 640;
        const screenX = screenW / 2;
        const screenY = 26;

        const p = this.screenToUiWorld?.(screenX, screenY) ?? { x: screenX, y: screenY, inv: 1 };
        this.floorHudContainer.setPosition(p.x, p.y);
        this.floorHudContainer.setScale(p.inv);
        this.floorHudContainer.setData?.("baseScale", p.inv);
    },

    updateFloorHud(roomIndex) {
        if (!this.floorHudContainer || !this.floorHudText || !this.floorHudBg) return;
    
        const floorNumber = Phaser.Math.Clamp(roomIndex + 1, 1, this.ROOM_COUNT);
        const label = `FLOOR ${String(floorNumber).padStart(2, "0")}`;
        this.floorHudText.setText(label);
    
        const palette = [0x7fb2ff, 0x8cc5ff, 0x9bd6ff, 0xffc07f, 0xffad75, 0xff9966];
        const accentColor = palette[floorNumber - 1] ?? 0x7fb2ff;
        this.floorHudBg.setStrokeStyle(1, accentColor, 0.9);
        this.floorHudAccent?.setFillStyle(accentColor, 0.9);
        this.floorHudTopLine?.setFillStyle(accentColor, 0.75);

        const baseScale = this.floorHudContainer.getData?.("baseScale") ?? this.floorHudContainer.scaleX ?? 1;
        this.tweens.add({
            targets: this.floorHudContainer,
            scaleX: baseScale * 1.06,
            scaleY: baseScale * 1.06,
            duration: 130,
            yoyo: true,
            ease: "Sine.easeOut",
        });
    },

    createFlashlightHud() {
        const container = this.add.container(0, 0).setScrollFactor(0, 0, true).setDepth(15001);

        const bg = this.add.rectangle(0, 0, 160, 26, 0x0a0f14, 0.92).setStrokeStyle(1, 0x7fb2ff, 0.9);
        const label = this.add
            .text(-72, -7, "FLASH", { fontSize: "9px", color: "#9cc2ff", fontStyle: "bold" })
            .setOrigin(0, 0.5);
        label.setShadow(0, 1, "#000", 2, false, true);

        const barX = -72;
        const barW = 112;

        const battBg = this.add.rectangle(barX, 2, barW, 6, 0x0b0d10, 1).setOrigin(0, 0.5);
        const battFill = this.add.rectangle(barX, 2, barW, 6, 0x7fb2ff, 1).setOrigin(0, 0.5);

        const heatBg = this.add.rectangle(barX, 10, barW, 4, 0x0b0d10, 1).setOrigin(0, 0.5).setAlpha(0.9);
        const heatFill = this.add.rectangle(barX, 10, barW, 4, 0xff7a5a, 1).setOrigin(0, 0.5);

        const statusText = this.add.text(72, -7, "", { fontSize: "9px", color: "#9cc2ff", fontStyle: "bold" }).setOrigin(1, 0.5);
        statusText.setShadow(0, 1, "#000", 2, false, true);

        container.add([bg, label, battBg, battFill, heatBg, heatFill, statusText]);
        container.setScrollFactor(0, 0, true);

        this.flashHudContainer = container;
        this.flashHudBg = bg;
        this.flashHudBatteryFill = battFill;
        this.flashHudHeatFill = heatFill;
        this.flashHudStatusText = statusText;
        this.layoutFlashlightHud?.();

        this.scale.on(
            "resize",
            (gameSize) => {
                this.layoutFlashlightHud?.();
            },
            this
        );

        this.updateFlashlightHud?.();
    },

    layoutFlashlightHud() {
        if (!this.flashHudContainer) return;
        const m = this.getUiMetrics?.();
        const screenW = Number(m?.width) || Number(this.sys.game.config.width) || 640;
        const screenX = screenW / 2;
        const screenY = 56;

        const p = this.screenToUiWorld?.(screenX, screenY) ?? { x: screenX, y: screenY, inv: 1 };
        this.flashHudContainer.setPosition(p.x, p.y);
        this.flashHudContainer.setScale(p.inv);
        this.flashHudContainer.setData?.("baseScale", p.inv);
    },

    updateFlashlightHud() {
        if (!this.flashHudContainer || !this.flashHudBatteryFill || !this.flashHudHeatFill) return;
        this.layoutFlashlightHud?.();

        const battery = Phaser.Math.Clamp(Number(this.flashBattery) || 0, 0, 1);
        const heat = Phaser.Math.Clamp(Number(this.flashHeat) || 0, 0, 1);

        const barW = 112;
        this.flashHudBatteryFill.setSize(Math.max(0, barW * battery), 6);
        this.flashHudHeatFill.setSize(Math.max(0, barW * heat), 4);

        const cold = new Phaser.Display.Color(127, 178, 255);
        const hot = new Phaser.Display.Color(255, 122, 90);
        const heatColor = Phaser.Display.Color.Interpolate.ColorWithColor(cold, hot, 100, Math.floor(heat * 100));
        this.flashHudHeatFill.setFillStyle(Phaser.Display.Color.GetColor(heatColor.r, heatColor.g, heatColor.b), 1);

        const isOverheated = Boolean(this.flashOverheated);
        const isCharging = !this.isFlashlightOn && battery < 0.999;
        const status = this.flashHudStatusText;
        const percent = `${Math.round(battery * 100)}%`;
        if (status) {
            if (isOverheated) {
                status.setText(`HOT ${percent}`);
                status.setColor("#ff7a5a");
            } else if (battery <= 0.15) {
                status.setText(`LOW ${percent}`);
                status.setColor("#ffd08a");
            } else if (isCharging) {
                status.setText(`CHG ${percent}`);
                status.setColor("#7cffae");
            } else {
                status.setText(percent);
                status.setColor("#9cc2ff");
            }
        }

        if (this.flashHudBg) {
            if (isOverheated) this.flashHudBg.setStrokeStyle(1, 0xff7a5a, 0.95);
            else this.flashHudBg.setStrokeStyle(1, 0x7fb2ff, 0.9);
        }

        if (this.flashHudBatteryFill) {
            if (isOverheated) this.flashHudBatteryFill.setFillStyle(0xff7a5a, 1);
            else if (battery <= 0.15) this.flashHudBatteryFill.setFillStyle(0xffd08a, 1);
            else if (isCharging) this.flashHudBatteryFill.setFillStyle(0x7cffae, 1);
            else this.flashHudBatteryFill.setFillStyle(0x7fb2ff, 1);
        }
    },

    updateInteractionPrompt(label, accentColor = 0xffffff) {
        if (!this.interactionContainer || !this.promptBg || !this.interactionActionText) return;
    
        this.interactionActionText.setText(label);
        if (this.interactionKeyText) this.interactionKeyText.setText("SPACE");
    
        const keyWidth = 42;
        const keyHeight = 18;
        const gap = 8;
        const padding = 12;
        const totalWidth = keyWidth + gap + this.interactionActionText.width + padding * 2;
        const totalHeight = 26;
    
        this.promptBg.setSize(totalWidth, totalHeight);
        const left = -totalWidth / 2 + padding;
        const keyX = left + keyWidth / 2;
    
        this.interactionKeyBg?.setSize(keyWidth, keyHeight);
        this.interactionKeyBg?.setPosition(keyX, 0);
        this.interactionKeyText?.setPosition(keyX, 0);
        this.interactionActionText.setPosition(keyX + keyWidth / 2 + gap, 0);
    
        this.promptBg.setStrokeStyle(2, accentColor);
        this.interactionKeyBg?.setStrokeStyle(1, accentColor);
    },

};
