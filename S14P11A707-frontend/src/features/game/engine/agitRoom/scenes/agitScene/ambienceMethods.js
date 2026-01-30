import Phaser from "phaser";

export const ambienceMethods = {
    getFootstepProfile(roomType) {
        switch (roomType) {
            case "bathroom":
                return { interval: 290, vol: 0.085, rateMin: 0.92, rateMax: 1.05, dust: 1 };
            case "kitchen":
                return { interval: 250, vol: 0.1, rateMin: 0.92, rateMax: 1.08, dust: 2 };
            case "basement":
                return { interval: 270, vol: 0.11, rateMin: 0.88, rateMax: 1.03, dust: 4 };
            case "living":
            case "bedroom":
                return { interval: 255, vol: 0.095, rateMin: 0.9, rateMax: 1.08, dust: 2 };
            default:
                return { interval: 260, vol: 0.1, rateMin: 0.9, rateMax: 1.08, dust: 2 };
        }
    },

    applyRoomParticleProfile(roomType) {
        if (this.dustEmitter) {
            let a = 1.0;
            if (roomType === "bathroom") a = 0.75;
            if (roomType === "kitchen") a = 0.9;
            if (roomType === "basement") a = 1.0;
            this.dustEmitter.setAlpha(Phaser.Math.Clamp(a, 0, 1));
        }
    
        if (this.steamEmitter) {
            let a = 0.85;
            if (roomType === "bathroom") a = 1.0;
            if (roomType === "kitchen") a = 0.9;
            if (roomType === "basement") a = 0.75;
            this.steamEmitter.setAlpha(Phaser.Math.Clamp(a, 0, 1));
        }
    
        if (this.dripEmitter) {
            let a = 0.65;
            if (roomType === "bathroom") a = 1.0;
            if (roomType === "basement") a = 0.8;
            this.dripEmitter.setAlpha(Phaser.Math.Clamp(a, 0, 1));
        }
    
        const safeSetFreq = (em, freq) => {
            if (!em) return;
            if (typeof em.setFrequency === "function") em.setFrequency(freq);
            else em.frequency = freq;
        };
    
        if (roomType === "bathroom") {
            safeSetFreq(this.emSteam, 240);
            safeSetFreq(this.emDrip, 450);
            safeSetFreq(this.emAmbientDust, 130);
        } else if (roomType === "basement") {
            safeSetFreq(this.emSteam, 420);
            safeSetFreq(this.emDrip, 850);
            safeSetFreq(this.emAmbientDust, 70);
        } else if (roomType === "kitchen") {
            safeSetFreq(this.emSteam, 300);
            safeSetFreq(this.emDrip, 700);
            safeSetFreq(this.emAmbientDust, 95);
        } else {
            safeSetFreq(this.emSteam, 380);
            safeSetFreq(this.emDrip, 900);
            safeSetFreq(this.emAmbientDust, 100);
        }
    },

    updateRoomAmbience(roomType) {
        if (!this.lightSprite) return;
    
        let color = 0xffffff;
        switch (roomType) {
            case "basement":
                color = 0xff8888;
                break;
            case "kitchen":
                color = 0xccffff;
                break;
            case "bathroom":
                color = 0x88ccff;
                break;
            case "living":
            case "bedroom":
                color = 0xffaa44;
                break;
            default:
                color = 0xffddaa;
                break;
        }
        this.lightSprite.setTint(color);
    
        if (this.darkOverlay) {
            let a = 0.7;
            if (roomType === "basement") a = 0.78;
            if (roomType === "bathroom") a = 0.72;
            if (roomType === "kitchen") a = 0.68;
            if (roomType === "living" || roomType === "bedroom") a = 0.66;
    
            this.tweens.add({
                targets: this.darkOverlay,
                alpha: a,
                duration: 600,
                ease: "Sine.easeInOut",
            });
        }
    
        this.applyRoomParticleProfile(roomType);
    },

    playUiBeep(freq = 820, duration = 0.07, volume = 0.1) {
        const ctx = this.sound?.context;
        if (!ctx) return;
    
        const now = ctx.currentTime;
        if (this.uiBeepCooldownUntil && now < this.uiBeepCooldownUntil) return;
        this.uiBeepCooldownUntil = now + 0.04;
    
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration + 0.02);
    },

};
