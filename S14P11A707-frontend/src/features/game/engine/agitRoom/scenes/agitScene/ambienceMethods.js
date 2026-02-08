import Phaser from "phaser";

export const ambienceMethods = {
    ensureRoomAmbienceAudio() {
        if (!this.sound) return;

        const safeAdd = (key) => {
            try {
                return this.sound.add(key, { volume: 0, loop: true });
            } catch {
                return null;
            }
        };

        if (!this.ambRumble) this.ambRumble = safeAdd("amb_rumble");
        if (!this.ambAir) this.ambAir = safeAdd("amb_air");
        if (!this.ambElectric) this.ambElectric = safeAdd("amb_electric");

        // WebAudio인 경우에만 간단한 필터를 연결
        const ctx = this.sound?.context;
        const isWebAudio = Boolean(ctx && this.sound?.destination);
        if (isWebAudio) {
            this.ambFilters = this.ambFilters ?? {};

            const connectFilter = (sound, id, type) => {
                if (!sound || !sound.volumeNode) return;
                if (this.ambFilters[id]) return;

                try {
                    const filter = ctx.createBiquadFilter();
                    filter.type = type;
                    filter.frequency.setValueAtTime(900, ctx.currentTime);
                    filter.Q.setValueAtTime(type === "bandpass" ? 0.7 : 0.8, ctx.currentTime);

                    const targetNode = sound.spatialNode || sound.pannerNode || sound.manager?.destination || this.sound.destination;
                    if (!targetNode) return;

                    // volumeNode가 이미 연결되어 있으니, 필터를 끼워 넣는다.
                    sound.volumeNode.disconnect();
                    sound.volumeNode.connect(filter);
                    filter.connect(targetNode);

                    this.ambFilters[id] = filter;
                } catch {}
            };

            connectFilter(this.ambRumble, "rumble", "lowpass");
            connectFilter(this.ambAir, "air", "highpass");
            connectFilter(this.ambElectric, "electric", "bandpass");
        }

        // 오토플레이 제한 환경에서는 실패할 수 있어 try/catch
        const safePlay = (sound) => {
            if (!sound) return;
            try {
                if (!sound.isPlaying) sound.play({ loop: true, volume: sound.volume ?? 0 });
            } catch {}
        };
        safePlay(this.ambRumble);
        safePlay(this.ambAir);
        safePlay(this.ambElectric);
    },

    applyRoomAmbienceAudioProfile(roomType) {
        this.ensureRoomAmbienceAudio();
        if (!this.ambRumble && !this.ambAir && !this.ambElectric) return;

        // 룸 타입별 기본 프로필 (너무 크지 않게)
        let rumbleVol = 0.04;
        let airVol = 0.03;
        let electricVol = 0.01;
        let rumbleHz = 850;
        let airHz = 260;
        let electricHz = 1200;

        if (roomType === "basement") {
            rumbleVol = 0.12;
            airVol = 0.03;
            electricVol = 0.0;
            rumbleHz = 520;
            airHz = 200;
            electricHz = 900;
        } else if (roomType === "bathroom") {
            rumbleVol = 0.05;
            airVol = 0.085;
            electricVol = 0.0;
            rumbleHz = 700;
            airHz = 420;
            electricHz = 1100;
        } else if (roomType === "kitchen") {
            rumbleVol = 0.055;
            airVol = 0.04;
            electricVol = 0.075;
            rumbleHz = 900;
            airHz = 300;
            electricHz = 1450;
        } else if (roomType === "living" || roomType === "bedroom") {
            rumbleVol = 0.035;
            airVol = 0.028;
            electricVol = 0.015;
            rumbleHz = 1000;
            airHz = 250;
            electricHz = 1200;
        }

        // 크로스페이드 (이전 tween 정리)
        if (this.ambienceFadeTween) {
            try {
                this.ambienceFadeTween.stop();
            } catch {}
            this.ambienceFadeTween = null;
        }

        const from = {
            rumble: this.ambRumble?.volume ?? 0,
            air: this.ambAir?.volume ?? 0,
            electric: this.ambElectric?.volume ?? 0,
        };
        const to = { rumble: rumbleVol, air: airVol, electric: electricVol };

        const applyVolumes = (t) => {
            const lerp = Phaser.Math.Linear;
            if (this.ambRumble) this.ambRumble.setVolume(lerp(from.rumble, to.rumble, t));
            if (this.ambAir) this.ambAir.setVolume(lerp(from.air, to.air, t));
            if (this.ambElectric) this.ambElectric.setVolume(lerp(from.electric, to.electric, t));
        };

        applyVolumes(0);
        this.ambienceFadeTween = this.tweens.addCounter({
            from: 0,
            to: 1,
            duration: 900,
            ease: "Sine.easeInOut",
            onUpdate: (tw) => applyVolumes(tw.getValue()),
            onComplete: () => {
                applyVolumes(1);
                this.ambienceFadeTween = null;
            },
        });

        // 필터(있으면)도 부드럽게 전환
        const ctx = this.sound?.context;
        const now = ctx?.currentTime ?? 0;
        const ramp = 0.22;
        const setHz = (filter, hz) => {
            if (!filter || !filter.frequency) return;
            try {
                filter.frequency.cancelScheduledValues(now);
                filter.frequency.setTargetAtTime(hz, now, ramp);
            } catch {}
        };
        setHz(this.ambFilters?.rumble, rumbleHz);
        setHz(this.ambFilters?.air, airHz);
        setHz(this.ambFilters?.electric, electricHz);
    },

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
        this.applyRoomAmbienceAudioProfile(roomType);
    },

    stopUiBeeps() {
        if (!Array.isArray(this.activeUiBeeps) || this.activeUiBeeps.length === 0) {
            this.activeUiBeeps = [];
            this.uiBeepActiveUntil = 0;
            return;
        }

        this.activeUiBeeps.forEach((entry) => {
            if (!entry) return;
            try {
                if (entry.osc) entry.osc.stop();
            } catch {}
            try {
                if (entry.osc) entry.osc.disconnect();
            } catch {}
            try {
                if (entry.gain) entry.gain.disconnect();
            } catch {}
        });

        this.activeUiBeeps = [];
        this.uiBeepActiveUntil = 0;
    },

    playUiBeep(freq = 820, duration = 0.07, volume = 0.1) {
        const ctx = this.sound?.context;
        if (!ctx) return;
    
        const now = ctx.currentTime;

        const minGapSec = 0.12;
        const sameToneBlockSec = 0.26;
        const signature = `${Math.round(freq)}:${Math.round(duration * 1000)}:${Math.round(volume * 1000)}`;

        if (this.uiBeepCooldownUntil && now < this.uiBeepCooldownUntil) return;
        if (this.uiBeepActiveUntil && now < this.uiBeepActiveUntil) return;
        if (this.uiBeepLastKey === signature && this.uiBeepLastAt && now - this.uiBeepLastAt < sameToneBlockSec) return;

        this.stopUiBeeps?.();

        this.uiBeepCooldownUntil = now + minGapSec;
        this.uiBeepActiveUntil = now + duration + 0.03;
        this.uiBeepLastKey = signature;
        this.uiBeepLastAt = now;
    
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

        this.activeUiBeeps = Array.isArray(this.activeUiBeeps) ? this.activeUiBeeps : [];
        this.activeUiBeeps.push({ osc, gain });

        osc.onended = () => {
            if (!Array.isArray(this.activeUiBeeps)) return;
            this.activeUiBeeps = this.activeUiBeeps.filter((entry) => entry?.osc !== osc);
        };
    },

};
