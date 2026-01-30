import Phaser from "phaser";

export const uiMethods = {
    createFloorHud() {
        const w = this.sys.game.config.width;
        const container = this.add.container(w / 2, 26).setScrollFactor(0).setDepth(15000);
    
        const bg = this.add.rectangle(0, 0, 150, 26, 0x0a0f14, 0.92).setStrokeStyle(1, 0x7fb2ff, 0.9);
        const topLine = this.add.rectangle(0, -11, 150, 2, 0x7fb2ff, 0.75);
        const accent = this.add.rectangle(-60, 0, 6, 16, 0x7fb2ff, 0.9);
        const text = this.add
            .text(-52, 0, "FLOOR 01", { fontSize: "11px", color: "#e7f2ff", fontStyle: "bold" })
            .setOrigin(0, 0.5);
        text.setShadow(0, 1, "#000", 2, false, true);
    
        container.add([bg, topLine, accent, text]);
    
        this.floorHudContainer = container;
        this.floorHudBg = bg;
        this.floorHudText = text;
        this.floorHudAccent = accent;
        this.floorHudTopLine = topLine;
    
        this.scale.on(
            "resize",
            (gameSize) => {
                if (!this.floorHudContainer) return;
                this.floorHudContainer.setPosition(gameSize.width / 2, 26);
            },
            this
        );
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
    
        this.tweens.add({
            targets: this.floorHudContainer,
            scale: 1.06,
            duration: 130,
            yoyo: true,
            ease: "Sine.easeOut",
        });
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
