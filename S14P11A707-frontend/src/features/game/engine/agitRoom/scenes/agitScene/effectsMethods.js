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
    
        if (!this.textures.exists("flashlight_cone")) {
            const lightTex = this.textures.createCanvas("flashlight_cone", canvasSize, canvasSize);
            const ctx = lightTex.getContext();
    
            const grd = ctx.createRadialGradient(0, centerY, 0, 0, centerY, radius);
            grd.addColorStop(0.0, "rgba(245, 245, 255, 0.32)");
            grd.addColorStop(0.35, "rgba(235, 235, 255, 0.16)");
            grd.addColorStop(0.65, "rgba(220, 220, 255, 0.06)");
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
                ctx.fillStyle = "rgba(240,240,255,0.22)";
                ctx.beginPath();
                ctx.moveTo(0, centerY);
                ctx.arc(0, centerY, radius * 0.98, -Math.PI / 10, Math.PI / 10);
                ctx.lineTo(0, centerY);
                ctx.fill();
                ctx.restore();
            } catch {}
    
            lightTex.refresh();
        }
    
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
        if (!this.textures.exists("flash_dust")) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xf6f8ff, 0.85);
            g.fillCircle(2, 2, 2);
            g.generateTexture("flash_dust", 4, 4);
        }
    
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
        this.reflection = this.add.sprite(this.player.x, this.player.y, "bob");
        this.reflection.setScale(1.5);
        this.reflection.setFlipY(true);
        this.reflection.setOrigin(0.5, 0);
        this.reflection.setAlpha(0.25);
        this.reflection.setDepth(5);
        this.reflection.setTint(0x000000);
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
