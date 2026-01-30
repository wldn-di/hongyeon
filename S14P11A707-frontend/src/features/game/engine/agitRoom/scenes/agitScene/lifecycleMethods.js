import Phaser from "phaser";

export const lifecycleMethods = {
    init(data) {
        if (data.assets) {
            this.assetsDB = data.assets;
            this.availableRoomTypes = [...new Set(data.assets.map((item) => item.room))];
        }
    
        this.initialClues = Array.isArray(data?.clues) ? data.clues : [];
        this.onClueInspected = typeof data?.onClueInspected === "function" ? data.onClueInspected : null;
        this.onRoomChanged = typeof data?.onRoomChanged === "function" ? data.onRoomChanged : null;
        this.initialRoomIndex = Number.isFinite(data?.initialRoomIndex) ? data.initialRoomIndex : 0;
    },

    preload() {
        this.load.image("floor", "/assets/tiles/tile2.png");
        this.load.image("elevator", "/assets/door/elevator.png");
        this.load.image("wall", "/assets/wall/wall.png");
    
        this.assetsDB.forEach((item) => {
            if (item.object_name) this.load.image(item.object_name, `/assets/object/${item.object_name}.png`);
        });
    
        this.load.spritesheet("bob", "/assets/sprites/bob.png", { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet("bob_idle", "/assets/sprites/bob_idle.png", { frameWidth: 16, frameHeight: 32 });
    
        // ✅ effect 폴더 통일
        this.load.audio("sfx_flashlight", "/assets/sound/effect/flashLight.mp3");
        this.load.audio("sfx_noise", "/assets/sound/effect/noise2.mp3");
        this.load.audio("sfx_rumble", "/assets/sound/effect/rumble.mp3");
        this.load.audio("sfx_walk", "/assets/sound/effect/walk2.mp3");
        this.load.audio("sfx_elevator", "/assets/sound/effect/elevator.mp3");
    
        // ✅ 임시 증거 이미지
        this.load.image("clue_object", "/assets/object/object.png");
    },

    create() {
        try {
            this.events.on("shutdown", () => {
                try {
                    this.sound.stopAll();
                } catch {}
            });
    
            const WORLD_WIDTH = this.ROOM_GAP * this.ROOM_COUNT;
            const WORLD_HEIGHT = this.ROOM_WIDTH;
            this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    
            this.furnitureGroup = this.physics.add.group();
            this.wallGroup = this.physics.add.staticGroup();
    
            this.roomsData = [];
            this.createAnimations();
            this.createElevatorGlowTextures();
    
            // SFX 객체
            this.sfxFlashlight = this.sound.add("sfx_flashlight", { volume: 0.5 });
            this.sfxNoise = this.sound.add("sfx_noise", { volume: 0.15 });
            this.sfxRumble = this.sound.add("sfx_rumble", { volume: 0.6 });
            this.sfxWalk = this.sound.add("sfx_walk", { volume: 0.3 });
            this.sfxElevator = this.sound.add("sfx_elevator", { volume: 0.7 });
    
            for (let i = 0; i < this.ROOM_COUNT; i++) {
                const roomOriginX = i * this.ROOM_GAP;
                const roomOriginY = 0;
    
                let roomType = "basement";
                if (this.availableRoomTypes.length > 0) {
                    roomType = Phaser.Utils.Array.GetRandom(this.availableRoomTypes);
                }
    
                this.roomsData.push({
                    index: i,
                    x: roomOriginX,
                    y: roomOriginY,
                    type: roomType,
                    centerX: roomOriginX + this.ROOM_WIDTH / 2,
                    centerY: roomOriginY + this.ROOM_WIDTH / 2,
                });
    
                const floor = this.add
                    .tileSprite(
                        roomOriginX + this.ROOM_WIDTH / 2,
                        roomOriginY + this.ROOM_WIDTH / 2,
                        this.ROOM_WIDTH,
                        this.ROOM_WIDTH,
                        "floor"
                    )
                    .setDepth(0);
    
                switch (roomType) {
                    case "basement":
                        floor.setTint(0x444444);
                        break;
                    case "kitchen":
                        floor.setTint(0x887766);
                        break;
                    case "bathroom":
                        floor.setTint(0x556677);
                        break;
                    case "living":
                        floor.setTint(0x775555);
                        break;
                    default:
                        floor.setTint(0x666666);
                        break;
                }
    
                const thickness = 8;
    
                const topBarrier = this.add.rectangle(
                    roomOriginX + this.ROOM_WIDTH / 2,
                    roomOriginY + 35,
                    this.ROOM_WIDTH,
                    50,
                    0xff0000,
                    0
                );
                this.physics.add.existing(topBarrier, true);
                this.wallGroup.add(topBarrier);
    
                const bottomBarrier = this.add.rectangle(
                    roomOriginX + this.ROOM_WIDTH / 2,
                    roomOriginY + this.ROOM_WIDTH + thickness / 2,
                    this.ROOM_WIDTH + thickness * 2,
                    thickness,
                    0x00ff00,
                    0
                );
                this.physics.add.existing(bottomBarrier, true);
                this.wallGroup.add(bottomBarrier);
    
                const leftBarrier = this.add.rectangle(
                    roomOriginX - thickness / 2 + 6,
                    roomOriginY + this.ROOM_WIDTH / 2,
                    thickness,
                    this.ROOM_WIDTH + thickness * 2,
                    0x0000ff,
                    0
                );
                this.physics.add.existing(leftBarrier, true);
                this.wallGroup.add(leftBarrier);
    
                const rightBarrier = this.add.rectangle(
                    roomOriginX + this.ROOM_WIDTH + thickness / 2 + 15,
                    roomOriginY + this.ROOM_WIDTH / 2,
                    thickness,
                    this.ROOM_WIDTH + thickness * 2,
                    0x0000ff,
                    0
                );
                this.physics.add.existing(rightBarrier, true);
                this.wallGroup.add(rightBarrier);
    
                const wallCount = 5;
                const wallWidth = this.ROOM_WIDTH / wallCount;
                const wallYPosition = roomOriginY + 32;
    
                for (let w = 0; w < wallCount; w++) {
                    const wallX = roomOriginX + w * wallWidth + wallWidth / 2;
                    const wallImg = this.add.image(wallX, wallYPosition, "wall");
                    wallImg.displayWidth = wallWidth;
                    wallImg.setDepth(10);
                    wallImg.setTint(0x888888);
                }
    
                const doorX = roomOriginX + this.ROOM_WIDTH / 2 + 8;
                const doorY = roomOriginY + 43;
                this.add.image(doorX, doorY, "elevator").setScale(0.87).setDepth(50);
    
                const portal = this.add.zone(doorX, doorY, 50, 80);
                this.physics.world.enable(portal);
                portal.body.moves = false;
    
                this.addElevatorGlow(doorX, doorY, roomOriginY, i);
    
                this.decorateRoom(roomType, roomOriginX, roomOriginY);
            }
    
            // 플레이어
            const startIndex = Phaser.Math.Clamp(this.initialRoomIndex, 0, this.ROOM_COUNT - 1);
            this.currentRoomIndex = startIndex;
            const startRoom = this.roomsData[startIndex];
            this.player = this.physics.add.sprite(startRoom.centerX, startRoom.centerY + 50, "bob");
            this.player.setScale(1.5).setCollideWorldBounds(true).setDepth(100);
            this.player.body.setSize(20, 20).setOffset(6, 12);
            this.player.setTint(0xeeeeee);
    
            // ✅ 렉 방지: 콜라이더는 한 번만
            this.physics.add.collider(this.player, this.furnitureGroup);
            this.physics.add.collider(this.player, this.wallGroup);
    
            this.createReflection();
    
            this.createStrongAmbientDust();
            this.createWalkingDust();
            this.createEnvironmentalParticles();
    
            this.createLighting();
            this.createVignette();
            this.createFlashlight();
            this.createFlashlightDust();
            this.createInteractGlow();
            this.createElevatorDoors();
    
            // ✅ 조사 UI + 증거 배치
            this.createInspectUI();
            this.spawnClues(this.initialClues);
    
            // ✅ [추가] 증거 스파클 생성
            this.createClueSparkle();
    
            this.updateRoomAmbience(startRoom.type);
            this.lightSprite.setPosition(startRoom.centerX, startRoom.centerY);
    
            try {
                this.onRoomChanged?.(startIndex);
            } catch (e) {
                console.error("AgitScene onRoomChanged error:", e);
            }
    
            this.createStaticNoise();
    
            const targetZoom = this.scale.width / this.ROOM_WIDTH;
            this.baseZoom = targetZoom;
            this.cameras.main.setZoom(targetZoom);
            this.cameras.main.setRoundPixels(true);
    
            this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
            this.updateCameraBounds(startIndex);
    
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = this.input.keyboard.addKeys({ up: 87, left: 65, down: 83, right: 68 });
            this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
            this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
            this.input.on("pointerdown", this.handlePuzzlePointerDown, this);
    
            // 프롬프트 UI
            this.interactionContainer = this.add.container(0, 0).setDepth(12000).setVisible(false);
            const bg = this.add.rectangle(0, 0, 150, 26, 0x0b0d10, 0.92).setStrokeStyle(2, 0xffffff);
            this.promptBg = bg;
    
            const keyBg = this.add.rectangle(-50, 0, 42, 18, 0x151515, 1).setStrokeStyle(1, 0x9cc2ff);
            const keyText = this.add
                .text(-50, 0, "SPACE", { fontSize: "9px", color: "#e9f3ff", fontStyle: "bold" })
                .setOrigin(0.5);
    
            const actionText = this.add
                .text(-20, 0, "INSPECT", { fontSize: "10px", color: "#ffffff", fontStyle: "bold" })
                .setOrigin(0, 0.5);
            actionText.setShadow(0, 1, "#000", 2, false, true);
    
            this.interactionKeyBg = keyBg;
            this.interactionKeyText = keyText;
            this.interactionActionText = actionText;
            this.interactionContainer.add([bg, keyBg, keyText, actionText]);
            this.updateInteractionPrompt("INSPECT", 0xffffcc);
    
            this.tweens.add({
                targets: this.interactionContainer,
                y: "+=8",
                duration: 900,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
            });
    
            this.createElevatorMenu();
    
            this.player.anims.play("bob-idle-down", true);
            this.cameras.main.fadeIn(600, 0, 0, 0);
        } catch (e) {
            console.error("AgitScene create error:", e);
            this.add
                .text(this.scale.width / 2, this.scale.height / 2, `SCENE ERROR:\n${String(e?.message || e)}`, {
                    fontSize: "14px",
                    color: "#ff6666",
                    align: "center",
                })
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(99999);
        }
    },

};
