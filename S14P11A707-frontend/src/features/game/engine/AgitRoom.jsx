import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

export default function AgitRoom({
    clues = [],
    onClueInspected,
    onRoomChanged,
    isDialogActive = false,
    inputFocused = false,
    canUseElevator = true,
    initialRoomIndex = 0,
}) {
    const ENABLE_PUZZLES = false;
    const gameContainer = useRef(null);
    const gameInstance = useRef(null);
    const onClueInspectedRef = useRef(onClueInspected);
    const onRoomChangedRef = useRef(onRoomChanged);
    const isDialogActiveRef = useRef(isDialogActive);
    const inputFocusedRef = useRef(inputFocused);
    const canUseElevatorRef = useRef(canUseElevator);
    const initialRoomIndexRef = useRef(initialRoomIndex);

    useEffect(() => {
        onClueInspectedRef.current = onClueInspected;
    }, [onClueInspected]);

    useEffect(() => {
        onRoomChangedRef.current = onRoomChanged;
    }, [onRoomChanged]);

    useEffect(() => {
        isDialogActiveRef.current = isDialogActive;
    }, [isDialogActive]);

    useEffect(() => {
        inputFocusedRef.current = inputFocused;
    }, [inputFocused]);

    useEffect(() => {
        canUseElevatorRef.current = canUseElevator;
    }, [canUseElevator]);

    useEffect(() => {
        initialRoomIndexRef.current = initialRoomIndex;
    }, [initialRoomIndex]);

    useEffect(() => {
        if (!gameInstance.current) return;
        const scene = gameInstance.current.scene?.getScene("AgitScene");
        if (!scene || !scene.setClues) return;
        scene.setClues(Array.isArray(clues) ? clues : []);
    }, [clues]);

    useEffect(() => {
        if (gameInstance.current) return;

        const initialClues = Array.isArray(clues) ? clues : [];

        class BootScene extends Phaser.Scene {
            constructor() {
                super("BootScene");
                this.loadingText = null;
            }

            preload() {
                const w = this.scale.width;
                const h = this.scale.height;

                this.loadingText = this.add
                    .text(w / 2, h / 2, "Loading...", {
                        fontSize: "16px",
                        color: "#ffffff",
                        fontStyle: "bold",
                    })
                    .setOrigin(0.5);

                this.load.on("progress", (p) => {
                    if (this.loadingText) this.loadingText.setText(`Loading... ${Math.floor(p * 100)}%`);
                });

                this.load.on("loaderror", (file) => {
                    const key = file?.key ?? "unknown";
                    const url = file?.url ?? "";
                    if (this.loadingText) this.loadingText.setText(`LOAD ERROR:\n${key}\n${url}`);
                    console.error("LOAD ERROR:", file);
                });

                this.load.text("itemsCSV", "/assets/object/items.csv");
            }

            create() {
                try {
                    const csvText = this.cache.text.get("itemsCSV") || "";
                    const parsedData = this.parseCSV(csvText);
                    this.scene.start("AgitScene", {
                        assets: parsedData,
                        clues: initialClues,
                        initialRoomIndex: initialRoomIndexRef.current,
                        onClueInspected: (payload) => {
                            try {
                                onClueInspectedRef.current?.(payload);
                            } catch (e) {
                                console.error("onClueInspected callback error:", e);
                            }
                        },
                        onRoomChanged: (roomIndex) => {
                            try {
                                onRoomChangedRef.current?.(roomIndex);
                            } catch (e) {
                                console.error("onRoomChanged callback error:", e);
                            }
                        },
                    });
                } catch (e) {
                    console.error("BootScene create error:", e);
                    if (this.loadingText) this.loadingText.setText(`BOOT ERROR:\n${String(e?.message || e)}`);
                }
            }

            parseCSV(text) {
                const lines = (text || "").split("\n");
                const result = [];
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    const columns = line.split(",");
                    if (columns.length >= 4) {
                        result.push({
                            object_name: columns[0].trim(),
                            item_type: columns[1].trim(),
                            room: columns[2].trim(),
                            placement: columns[3].trim(),
                        });
                    }
                }
                return result;
            }
        }

        class AgitScene extends Phaser.Scene {
            constructor() {
                super("AgitScene");

                this.assetsDB = [];
                this.availableRoomTypes = [];

                this.ROOM_COUNT = 6;
                this.ROOM_WIDTH = 320;
                this.ROOM_GAP = 1000;
                this.currentRoomIndex = 0;

                this.roomsData = [];

                this.darkOverlay = null;
                this.lightSprite = null;

                // 손전등
                this.flashlight = null;
                this.isFlashlightOn = false;
                this.flashAlpha = 0;
                this.flashAlphaIntent = 0;
                this.flashJitterSeed = Math.random() * 1000;
                this.flashJitterSeed2 = Math.random() * 1000;
                this.flashJitterSeed3 = Math.random() * 1000;

                // 노이즈/그레인
                this.staticNoise = null;
                this.grainBaseAlpha = 0.035;

                this.dustEmitter = null;
                this.footstepEmitter = null;
                this.steamEmitter = null;
                this.dripEmitter = null;

                this.emAmbientDust = null;
                this.emSteam = null;
                this.emDrip = null;

                // SFX
                this.sfxFlashlight = null;
                this.sfxNoise = null;
                this.sfxRumble = null;
                this.sfxWalk = null;
                this.sfxElevator = null;

                this.noiseCooldownUntil = 0;
                this.noiseStopAt = 0;

                this.lastFootstepTime = 0;

                this.furnitureGroup = null;
                this.wallGroup = null;

                this.isTransitioning = false;
                this.lastDirection = "down";

                this.reflection = null;

                // Elevator door overlay
                this.elevatorDoorLeft = null;
                this.elevatorDoorRight = null;

                // UI
                this.interactionContainer = null;
                this.interactionText = null;
                this.interactionKeyBg = null;
                this.interactionKeyText = null;
                this.interactionActionText = null;
                this.floorHudContainer = null;
                this.floorHudBg = null;
                this.floorHudText = null;
                this.floorHudAccent = null;
                this.floorHudTopLine = null;

                // ✅ 프롬프트 BG 레퍼런스(빛나는 연출용)
                this.promptBg = null;
                this.elevatorMenuContainer = null;
                this.elevatorMenuBg = null;
                this.elevatorMenuGlow = null;
                this.elevatorMenuTitle = null;
                this.elevatorMenuHint = null;
                this.elevatorMenuUpRow = null;
                this.elevatorMenuDownRow = null;
                this.elevatorMenuUpText = null;
                this.elevatorMenuDownText = null;
                this.elevatorMenuUpKey = null;
                this.elevatorMenuDownKey = null;
                this.isElevatorMenuOpen = false;
                this.elevatorGlows = [];
                this.elevatorGlowPulseSeed = Math.random() * 1000;
                this.uiBeepCooldownUntil = 0;

                this.flashDust = null;
                this.flashDustEmitter = null;
                this.flashDustOn = false;

                this.baseZoom = 1;

                // 비네팅
                this.vignette = null;

                // 가까운 오브젝트 하이라이트 글로우
                this.interactGlow = null;
                this.highlightTarget = null;
                this.lastHighlightCheck = 0;
                this.HIGHLIGHT_RADIUS = 85;

                // ----------------------------
                // ✅ 임시 증거(단서) 시스템
                // ----------------------------
                this.clues = [];
                this.CLUE_SCALE = 0.8;
                this.CLUE_HIGHLIGHT_RADIUS = 55;
                this.CLUE_INTERACT_RADIUS = 40;

                this.isInspecting = false;
                this.inspectTarget = null;

                this.inspectUI = null;
                this.inspectTitleText = null;
                this.inspectBodyText = null;

                this.isPuzzleActive = false;
                this.puzzleContainer = null;
                this.puzzleTitle = null;
                this.puzzleHint = null;
                this.puzzleLeftSockets = [];
                this.puzzleRightSockets = [];
                this.puzzleLines = [];
                this.puzzleActiveLeft = null;
                this.puzzleSolvedCount = 0;
                this.puzzleTarget = null;
                this.puzzleType = null;
                this.timingBar = null;
                this.timingZone = null;
                this.timingIndicator = null;
                this.timingTween = null;
                this.elevatorWirePending = false;

                this.keyEsc = null;

                // ✅ [추가] 증거 반짝 파티클
                this.clueSparkle = null;          // ParticleEmitterManager
                this.clueSparkleEmitter = null;   // Emitter
                this.clueSparkleOn = false;

                this.initialClues = [];
                this.onClueInspected = null;
                this.onRoomChanged = null;
                this.initialRoomIndex = 0;
            }

            init(data) {
                if (data.assets) {
                    this.assetsDB = data.assets;
                    this.availableRoomTypes = [...new Set(data.assets.map((item) => item.room))];
                }

                this.initialClues = Array.isArray(data?.clues) ? data.clues : [];
                this.onClueInspected = typeof data?.onClueInspected === "function" ? data.onClueInspected : null;
                this.onRoomChanged = typeof data?.onRoomChanged === "function" ? data.onRoomChanged : null;
                this.initialRoomIndex = Number.isFinite(data?.initialRoomIndex) ? data.initialRoomIndex : 0;
            }

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
            }

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
                    this.createFloorHud();
                    this.updateFloorHud(startIndex);

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
            }

            // ------------------------------------------------------------
            // ✅ [추가] 증거 스파클 파티클(근처에서만 ON)
            // ------------------------------------------------------------
            createClueSparkle() {
                if (!this.textures.exists("clue_spark")) {
                    const g = this.make.graphics({ x: 0, y: 0, add: false });
                    g.fillStyle(0xffffff, 1);
                    g.fillCircle(2, 2, 2);
                    g.generateTexture("clue_spark", 4, 4);
                    g.destroy();
                }

                // on:false 로 시작 꺼두기
                this.clueSparkle = this.add.particles(0, 0, "clue_spark", {
                    lifespan: { min: 280, max: 560 },
                    speed: { min: 6, max: 18 },
                    angle: { min: 250, max: 290 }, // 위로 살짝 퍼짐
                    scale: { start: 1.0, end: 0 },
                    alpha: { start: 0.9, end: 0 },
                    quantity: 1,
                    frequency: 120,
                    blendMode: "ADD",
                    on: false,
                });

                this.clueSparkle.setDepth(12010);
                this.clueSparkleEmitter = this.clueSparkle.emitters?.list?.[0] ?? null;
                this.clueSparkleOn = false;
            }

            setClueSparkle(active, x, y) {
                if (!this.clueSparkle || !this.clueSparkleEmitter) return;

                if (active) {
                    this.clueSparkle.setPosition(x, y);
                    if (!this.clueSparkleOn) {
                        this.clueSparkleEmitter.start();
                        this.clueSparkleOn = true;
                    }
                } else {
                    if (this.clueSparkleOn) {
                        this.clueSparkleEmitter.stop();
                        this.clueSparkleOn = false;
                    }
                }
            }

            resetClueVisual(clue) {
                if (!clue || !clue.active) return;
                const baseTint = clue.getData("baseTint") ?? 0xffffff;
                const baseScale = clue.getData("baseScale") ?? this.CLUE_SCALE;
                clue.setTint(baseTint);
                clue.setAlpha(1);
                clue.setScale(baseScale);
            }

            // ------------------------------
            // ✅ 조사 UI + 임시 증거
            // ------------------------------
            createInspectUI() {
                const w = this.sys.game.config.width;
                const h = this.sys.game.config.height;

                this.inspectUI = this.add.container(w / 2, h / 2).setScrollFactor(0).setDepth(30000).setVisible(false);

                const panelW = 300;
                const panelH = 200;

                const bg = this.add.rectangle(0, 0, panelW, panelH, 0x000000, 0.9).setStrokeStyle(2, 0xffffff);
                const title = this.add.text(-panelW / 2 + 18, -panelH / 2 + 14, "TITLE", {
                    fontSize: "18px",
                    color: "#ffffff",
                    fontStyle: "bold",
                });

                const body = this.add.text(-panelW / 2 + 18, -panelH / 2 + 48, "BODY", {
                    fontSize: "14px",
                    color: "#dddddd",
                    wordWrap: { width: panelW - 36 },
                    lineSpacing: 4,
                });

                const hint = this.add
                    .text(panelW / 2 - 18, panelH / 2 - 14, "SPACE/ESC 닫기", { fontSize: "12px", color: "#aaaaaa" })
                    .setOrigin(1, 1);

                this.inspectTitleText = title;
                this.inspectBodyText = body;
                this.inspectUI.add([bg, title, body, hint]);
            }

            openWirePuzzle(target) {
                this.openCluePuzzle(target);
            }

            openCluePuzzle(target) {
                if (!target || this.isPuzzleActive) return;
                if (!ENABLE_PUZZLES) {
                    if (target?.active) this.openInspect(target);
                    return;
                }

                this.isPuzzleActive = true;
                this.puzzleTarget = target;
                this.puzzleSolvedCount = 0;
                this.puzzleActiveLeft = null;
                this.puzzleType = "timing";

                if (this.highlightTarget === target) this.highlightTarget = null;
                if (this.interactGlow) {
                    this.interactGlow.setVisible(false);
                    this.interactGlow.setAlpha(0);
                }
                this.setClueSparkle(false);
                this.interactionContainer?.setVisible(false);

                if (this.puzzleType === "wire") {
                    this.buildWirePuzzle();
                } else {
                    this.buildTimingPuzzle();
                }
            }

            openElevatorWirePuzzle() {
                if (this.isPuzzleActive) return false;
                if (!ENABLE_PUZZLES) return false;

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
            }

            closeWirePuzzle() {
                this.isPuzzleActive = false;
                this.puzzleActiveLeft = null;
                this.puzzleSolvedCount = 0;
                this.puzzleTarget = null;
                this.puzzleType = null;
                this.elevatorWirePending = false;
                if (this.timingTween) {
                    this.timingTween.stop();
                    this.timingTween = null;
                }
                this.timingBar = null;
                this.timingZone = null;
                this.timingIndicator = null;

                if (this.puzzleContainer) {
                    this.puzzleContainer.destroy(true);
                    this.puzzleContainer = null;
                }
                this.puzzleLeftSockets = [];
                this.puzzleRightSockets = [];
                this.puzzleLines = [];
                this.puzzleTitle = null;
                this.puzzleHint = null;
            }

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

                const hint = this.add.text(0, 96, "CONNECT MATCHING COLORS", { fontSize: "9px", color: "#7f90a8" }).setOrigin(0.5);

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
            }

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

                const hint = this.add.text(0, 96, "CLICK / SPACE TO STOP", { fontSize: "9px", color: "#7f90a8" }).setOrigin(0.5);

                const barW = 220;
                const barH = 10;
                const bar = this.add.rectangle(0, 0, barW, barH, 0x1b2430, 1).setStrokeStyle(1, 0x7fb2ff, 0.9);

                const zoneW = 40;
                const zoneMinX = -barW / 2 + zoneW / 2;
                const zoneMaxX = barW / 2 - zoneW / 2;
                const zoneX = Phaser.Math.Between(zoneMinX, zoneMaxX);
                const zone = this.add.rectangle(zoneX, 0, zoneW, barH + 6, 0x7fb2ff, 0.35).setStrokeStyle(1, 0xffffff, 0.6);

                const indicator = this.add.rectangle(-barW / 2, 0, 8, barH + 8, 0xfff07a, 1).setStrokeStyle(1, 0xffffff, 0.8);

                container.add([bg, title, hint, bar, zone, indicator]);

                this.puzzleContainer = container;
                this.puzzleTitle = title;
                this.puzzleHint = hint;
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
            }

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
            }

            handlePuzzlePointerDown(pointer) {
                if (!this.isPuzzleActive) return;
                if (this.puzzleType === "wire" && (!this.puzzleLeftSockets.length || !this.puzzleRightSockets.length)) return;

                this.handlePuzzlePointerAtScreen(pointer.x, pointer.y);
            }

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
            }

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
            }

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
            }

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
                    if (this.puzzleHint) this.puzzleHint.setText("UNLOCKED");
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
                }
            }

            tryTimingStop() {
                if (!this.timingIndicator || !this.timingZone) return;
                if (!this.timingTween) return;

                this.timingTween.stop();
                this.timingTween = null;

                const indicatorX = this.timingIndicator.x;
                const zoneLeft = this.timingZone.x - this.timingZone.width / 2;
                const zoneRight = this.timingZone.x + this.timingZone.width / 2;

                if (indicatorX >= zoneLeft && indicatorX <= zoneRight) {
                    if (this.puzzleHint) this.puzzleHint.setText("UNLOCKED");
                    this.playUiBeep(860, 0.06, 0.08);
                    this.time.delayedCall(180, () => {
                        const target = this.puzzleTarget;
                        this.closeWirePuzzle();
                        if (target?.active) this.openInspect(target);
                    });
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
            }

            openInspect(target) {
                if (!target) return;

                const title = target.getData("title") || "Unknown";
                const body = target.getData("body") || "";
                const evidenceId = target.getData("evidenceId") ?? null;
                const clueId = target.getData("clueId") ?? null;

                try {
                    this.onClueInspected?.({ evidenceId, clueId, title, body });
                } catch (e) {
                    console.error("AgitScene onClueInspected error:", e);
                }

                this.isInspecting = true;
                this.inspectTarget = null;

                this.inspectTitleText.setText(title);
                this.inspectBodyText.setText(body);
                this.inspectUI.setVisible(true);

                // 하이라이트/스파클 정리
                if (this.highlightTarget === target) this.highlightTarget = null;
                if (this.interactGlow) {
                    this.interactGlow.setVisible(false);
                    this.interactGlow.setAlpha(0);
                }
                this.setClueSparkle(false);

                // clues 배열에서 제거 + 삭제
                const idx = this.clues.indexOf(target);
                if (idx !== -1) this.clues.splice(idx, 1);
                target.destroy();

                this.interactionContainer?.setVisible(false);
            }

            closeInspect() {
                this.isInspecting = false;
                this.inspectTarget = null;
                this.inspectUI?.setVisible(false);
            }

            spawnClues(clues) {
                const makeClue = ({ clueId, evidenceId, roomIndex, localX, localY, title, body }) => {
                    const room = this.roomsData[roomIndex];
                    if (!room) return;

                    const x = room.x + localX;
                    const y = room.y + localY;

                    const clue = this.add.image(x, y, "clue_object");
                    clue.setScale(this.CLUE_SCALE);
                    clue.setDepth(y);
                    clue.setTint(0xffffff);
                    clue.setData("clueId", clueId ?? null);
                    clue.setData("evidenceId", evidenceId ?? null);
                    clue.setData("title", title ?? "Unknown");
                    clue.setData("body", body ?? "");
                    clue.setData("baseTint", 0xffffff);
                    clue.setData("baseScale", this.CLUE_SCALE);
                    clue.setData("baseY", clue.y);
                    this.clues.push(clue);
                };

                (Array.isArray(clues) ? clues : []).forEach((c, idx) => {
                    const roomIndex = Number.isFinite(c?.roomIndex) ? c.roomIndex : null;
                    const localX = Number.isFinite(c?.localX) ? c.localX : null;
                    const localY = Number.isFinite(c?.localY) ? c.localY : null;
                    if (roomIndex == null || localX == null || localY == null) return;

                    makeClue({
                        clueId: c?.clueId ?? idx,
                        evidenceId: c?.evidenceId ?? null,
                        roomIndex,
                        localX,
                        localY,
                        title: c?.title ?? "Unknown",
                        body: c?.body ?? "",
                    });
                });
            }

            clearClues() {
                if (!Array.isArray(this.clues) || this.clues.length === 0) return;
                this.clues.forEach((clue) => {
                    if (clue && clue.destroy) clue.destroy();
                });
                this.clues = [];
            }

            setClues(nextClues) {
                this.clearClues();
                this.spawnClues(nextClues);
            }

            getNearestClue(maxDist) {
                if (!this.player || this.clues.length === 0) return null;

                let best = null;
                let bestD = Infinity;
                for (const obj of this.clues) {
                    if (!obj || !obj.active) continue;
                    const dx = obj.x - this.player.x;
                    const dy = obj.y - this.player.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < bestD) {
                        bestD = d;
                        best = obj;
                    }
                }
                if (!best || bestD > maxDist) return null;
                return { obj: best, dist: bestD };
            }

            updateNearestClueHighlight(time) {
                if (!this.interactGlow || !this.player || this.isInspecting) return;

                // 90ms마다만 갱신(성능)
                if (time < this.lastHighlightCheck + 90) {
                    // 펄스만 조금 유지(글로우만)
                    if (this.highlightTarget && this.interactGlow.visible) {
                        const pulse = 0.5 + 0.5 * Math.sin(time * 0.02 + (this.highlightTarget.x + this.highlightTarget.y) * 0.01);
                        this.interactGlow.setAlpha(Phaser.Math.Clamp(0.14 + 0.10 * pulse, 0, 0.35));
                    }
                    return;
                }
                this.lastHighlightCheck = time;

                const nearest = this.getNearestClue(this.CLUE_HIGHLIGHT_RADIUS);

                // 범위 밖이면 원복
                if (!nearest) {
                    if (this.highlightTarget) {
                        const baseTint = this.highlightTarget.getData("baseTint") ?? 0xffffff;
                        const baseScale = this.highlightTarget.getData("baseScale") ?? this.CLUE_SCALE;
                        const baseY = this.highlightTarget.getData("baseY") ?? this.highlightTarget.y;

                        this.highlightTarget.setTint(baseTint);
                        this.highlightTarget.setAlpha(1);
                        this.highlightTarget.setScale(baseScale);
                        this.highlightTarget.y = baseY;
                        this.highlightTarget.setDepth(baseY);
                    }

                    this.highlightTarget = null;
                    this.interactGlow.setVisible(false);
                    this.interactGlow.setAlpha(0);

                    this.setClueSparkle(false);
                    return;
                }

                const best = nearest.obj;
                const dist = nearest.dist;

                // 타겟 바뀌면 이전 타겟 원복
                if (this.highlightTarget !== best) {
                    if (this.highlightTarget) {
                        const baseTint = this.highlightTarget.getData("baseTint") ?? 0xffffff;
                        const baseScale = this.highlightTarget.getData("baseScale") ?? this.CLUE_SCALE;
                        const baseY = this.highlightTarget.getData("baseY") ?? this.highlightTarget.y;

                        this.highlightTarget.setTint(baseTint);
                        this.highlightTarget.setAlpha(1);
                        this.highlightTarget.setScale(baseScale);
                        this.highlightTarget.y = baseY;
                        this.highlightTarget.setDepth(baseY);
                    }

                    this.highlightTarget = best;

                    // 혹시 baseY/baseScale이 없으면 안전하게 저장(이미 있으면 무시)
                    if (best.getData("baseY") == null) best.setData("baseY", best.y);
                    if (best.getData("baseScale") == null) best.setData("baseScale", this.CLUE_SCALE);
                    if (best.getData("baseTint") == null) best.setData("baseTint", 0xffffff);
                }

                // 가까울수록 강도 증가
                const t = Phaser.Math.Clamp(1 - dist / this.CLUE_HIGHLIGHT_RADIUS, 0, 1);

                // 펄스(반짝/확대)
                const pulse = 0.5 + 0.5 * Math.sin(time * 0.02 + (best.x + best.y) * 0.01);

                // ✅ 둥실(bob) : 위아래 이동
                const baseY = best.getData("baseY") ?? best.y;
                const bobAmp = 3; // <- 움직임 크기(원하면 6~12)
                const bob = Math.sin(time * 0.004 + best.x * 0.01) * bobAmp * (0.35 + 0.65 * t);
                best.y = baseY + bob;
                best.setDepth(best.y);

                // ✅ 증거 자체 반짝/확대(폭 더 큼)
                const baseScale = best.getData("baseScale") ?? this.CLUE_SCALE;

                // 스케일 폭: 0.09 -> 0.14로 더 크게(원하면 0.18까지)
                const scaleAmp = 0.14;
                best.setTint(0xffffff);
                best.setAlpha(0.82 + 0.18 * pulse); // 알파도 조금 더 크게
                best.setScale(baseScale * (1 + scaleAmp * pulse * (0.35 + 0.65 * t)));

                // ✅ 글로우 강화(가까울수록 밝고 크게)
                this.interactGlow.setVisible(true);
                this.interactGlow.setPosition(best.x, best.y);

                const w = best.displayWidth || best.width || 64;
                const h = best.displayHeight || best.height || 64;
                const s = Math.max(w, h) / 130;

                this.interactGlow.setScale(s * (1 + 0.35 * t));
                this.interactGlow.setDepth((best.depth ?? best.y) + 0.5);

                const glowA = 0.10 + 0.38 * t + 0.10 * pulse;
                this.interactGlow.setAlpha(Phaser.Math.Clamp(glowA, 0, 0.75));

                // ✅ 아주 가까우면 스파클 ON
                const sparkleOn = t > 0.55;
                this.setClueSparkle(sparkleOn, best.x, best.y - 12);
            }

            // ------------------------------
            // 이하 기존 함수들(너 코드 그대로)
            // ------------------------------
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
            }

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
                        imgData.data[i + 3] = 50;
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
            }

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
            }

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
            }

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
            }

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
            }

            createReflection() {
                this.reflection = this.add.sprite(this.player.x, this.player.y, "bob");
                this.reflection.setScale(1.5);
                this.reflection.setFlipY(true);
                this.reflection.setOrigin(0.5, 0);
                this.reflection.setAlpha(0.25);
                this.reflection.setDepth(5);
                this.reflection.setTint(0x000000);
            }

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
            }

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
            }

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
            }

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
            }

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
            }

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
            }

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
            }

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
            }

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
            }

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
            }

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
            }

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
            }

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
            }

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
            }

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
            }

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
            }

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
            }

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
            }

            openElevatorMenu() {
                if (!this.elevatorMenuContainer) return;
                this.isElevatorMenuOpen = true;
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
            }

            closeElevatorMenu() {
                if (!this.elevatorMenuContainer) return;
                this.isElevatorMenuOpen = false;
                this.elevatorMenuContainer.setVisible(false);
            }

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
            }

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
            }

            startElevatorTransition(nextIndex) {
                if (this.isTransitioning) return;
                this.isTransitioning = true;
                this.interactionContainer?.setVisible(false);
                this.closeElevatorMenu?.();

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
                            this.isTransitioning = false;
                        });
                    });
                });
            }

            updateCameraBounds(roomIndex) {
                const room = this.roomsData[roomIndex];
                this.cameras.main.setBounds(room.x, room.y, this.ROOM_WIDTH, this.ROOM_WIDTH);
            }

            decorateRoom(roomType, offsetX, offsetY) {
                if (!this.furnitureGroup) this.furnitureGroup = this.physics.add.group();

                const candidates = this.assetsDB.filter((item) => item.room === roomType);
                if (candidates.length === 0) return;

                const shuffled = Phaser.Utils.Array.Shuffle([...candidates]);
                const selectedItems = [];
                const usedTypes = new Set();
                const targetCount = Phaser.Math.Between(3, 5);

                for (const item of shuffled) {
                    if (selectedItems.length >= targetCount) break;
                    if (!usedTypes.has(item.item_type)) {
                        selectedItems.push(item);
                        usedTypes.add(item.item_type);
                    }
                }

                const placedRects = [];
                selectedItems.forEach((item) => {
                    let x, y;
                    let valid = false;
                    let attempts = 0;

                    const tex = this.textures.get(item.object_name);
                    if (!tex || !tex.getSourceImage) return;
                    const texture = tex.getSourceImage();
                    if (!texture) return;

                    const itemW = texture.width;
                    const itemH = texture.height;

                    while (!valid && attempts < 20) {
                        attempts++;
                        x = Phaser.Math.Between(30, this.ROOM_WIDTH - 30) + offsetX;
                        y = Phaser.Math.Between(80, this.ROOM_WIDTH - 30) + offsetY;

                        const centerX = offsetX + this.ROOM_WIDTH / 2;
                        const doorY = offsetY + 40;
                        const distDoor = Phaser.Math.Distance.Between(x, y, centerX, doorY);

                        if (distDoor > 60) {
                            const newRect = new Phaser.Geom.Rectangle(x - itemW / 2, y - itemH / 2, itemW, itemH);
                            Phaser.Geom.Rectangle.Inflate(newRect, 10, 10);

                            let isOverlapping = false;
                            for (const existingRect of placedRects) {
                                if (Phaser.Geom.Intersects.RectangleToRectangle(newRect, existingRect)) {
                                    isOverlapping = true;
                                    break;
                                }
                            }

                            if (!isOverlapping) {
                                valid = true;
                                placedRects.push(new Phaser.Geom.Rectangle(x - itemW / 2, y - itemH / 2, itemW, itemH));
                            }
                        }
                    }

                    if (valid) {
                        const furniture = this.physics.add.image(x, y, item.object_name);
                        furniture.setDepth(y);
                        furniture.setImmovable(true);
                        furniture.body.pushable = false;
                        furniture.setVelocity(0, 0);
                        furniture.setTint(0x999999);

                        if (furniture.width > 0) {
                            const widthScale = 0.5;
                            const heightScale = 0.2;
                            const newWidth = furniture.width * widthScale;
                            const newHeight = furniture.height * heightScale;
                            const offX = (furniture.width - newWidth) / 2 + 8;
                            const offY = furniture.height - newHeight - 10;
                            furniture.body.setSize(newWidth, newHeight);
                            furniture.body.setOffset(offX, offY);
                        }

                        this.furnitureGroup.add(furniture);
                    }
                });
            }

            createAnimations() {
                const skin = "bob";
                const idleSkin = "bob_idle";
                if (this.anims.exists(`${skin}-right`)) return;

                this.anims.create({
                    key: `${skin}-right`,
                    frames: this.anims.generateFrameNumbers(skin, { start: 0, end: 5 }),
                    frameRate: 10,
                    repeat: -1,
                });
                this.anims.create({
                    key: `${skin}-up`,
                    frames: this.anims.generateFrameNumbers(skin, { start: 6, end: 11 }),
                    frameRate: 10,
                    repeat: -1,
                });
                this.anims.create({
                    key: `${skin}-left`,
                    frames: this.anims.generateFrameNumbers(skin, { start: 12, end: 17 }),
                    frameRate: 10,
                    repeat: -1,
                });
                this.anims.create({
                    key: `${skin}-down`,
                    frames: this.anims.generateFrameNumbers(skin, { start: 18, end: 23 }),
                    frameRate: 10,
                    repeat: -1,
                });

                this.anims.create({
                    key: `${skin}-idle-right`,
                    frames: this.anims.generateFrameNumbers(idleSkin, { start: 0, end: 5 }),
                    frameRate: 10,
                    repeat: -1,
                });
                this.anims.create({
                    key: `${skin}-idle-up`,
                    frames: this.anims.generateFrameNumbers(idleSkin, { start: 6, end: 11 }),
                    frameRate: 10,
                    repeat: -1,
                });
                this.anims.create({
                    key: `${skin}-idle-left`,
                    frames: this.anims.generateFrameNumbers(idleSkin, { start: 12, end: 17 }),
                    frameRate: 10,
                    repeat: -1,
                });
                this.anims.create({
                    key: `${skin}-idle-down`,
                    frames: this.anims.generateFrameNumbers(idleSkin, { start: 18, end: 23 }),
                    frameRate: 10,
                    repeat: -1,
                });
            }

            update(time) {
                if (!this.player) return;

                if (this.isPuzzleActive) {
                    this.player.body.setVelocity(0);
                    this.closeElevatorMenu?.();
                    if (this.puzzleType === "timing" && Phaser.Input.Keyboard.JustDown(this.keySpace)) {
                        this.tryTimingStop();
                    }
                    if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
                        this.closeWirePuzzle();
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

                // ✅ 추가: 튜토리얼 대화 중이거나 입력창 포커스 시 이동 차단
                if (isDialogActiveRef.current || inputFocusedRef.current) {
                    this.player.body.setVelocity(0);
                    this.closeElevatorMenu?.();
                    return;
                }

                // 손전등 토글
                if (Phaser.Input.Keyboard.JustDown(this.keyShift)) {
                    this.isFlashlightOn = !this.isFlashlightOn;
                    if (this.sfxFlashlight) this.sfxFlashlight.play();

                    this.flashAlphaIntent = this.isFlashlightOn ? 1 : 0;
                    if (this.flashlight) this.flashlight.setVisible(true);
                }

                // 노이즈
                if (this.staticNoise) {
                    this.staticNoise.tilePositionX += Phaser.Math.Between(0, 3);
                    this.staticNoise.tilePositionY += Phaser.Math.Between(0, 3);

                    if (this.sfxNoise && this.sfxNoise.isPlaying && this.noiseStopAt > 0 && time > this.noiseStopAt) {
                        this.sfxNoise.stop();
                        this.noiseStopAt = 0;
                    }

                    if (Math.random() < 0.002) {
                        this.staticNoise.setAlpha(Phaser.Math.FloatBetween(0.16, 0.28));

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

                // 손전등 업데이트
                if (this.flashlight) {
                    this.flashAlpha = Phaser.Math.Linear(this.flashAlpha, this.flashAlphaIntent, 0.18);

                    if (this.flashAlphaIntent === 0 && this.flashAlpha < 0.02) {
                        this.flashlight.setAlpha(0);
                        this.flashlight.setVisible(false);
                    } else {
                        this.flashlight.setVisible(true);

                        const flicker = 0.92 + 0.08 * (0.5 + 0.5 * Math.sin(time * 0.06 + this.flashJitterSeed));
                        this.flashlight.setAlpha(Phaser.Math.Clamp(this.flashAlpha * flicker, 0, 1));

                        if (this.isFlashlightOn) {
                            const forwardOffset = 8;
                            const verticalOffset = 12;

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

                            const jitterRot =
                                (Math.sin(time * 0.01 + this.flashJitterSeed2) * 0.4 + Phaser.Math.FloatBetween(-0.4, 0.4)) * (Math.PI / 180);
                            const jitterX = Math.sin(time * 0.01 + this.flashJitterSeed3) * 0.2;
                            const jitterY = Math.sin(time * 0.015 + this.flashJitterSeed2) * 0.1;

                            this.flashlight.setPosition(targetX + jitterX, targetY + jitterY);

                            const targetRad = Phaser.Math.DegToRad(angleDeg) + jitterRot;
                            this.flashlight.rotation = Phaser.Math.Angle.RotateTo(this.flashlight.rotation, targetRad, 0.17);

                            const s = 1.0 + 0.018 * Math.sin(time * 0.03 + this.flashJitterSeed);
                            this.flashlight.setScale(s);
                        }
                    }
                }

                // ✅ 증거 하이라이트 업데이트(반짝/글로우/스파클)
                this.updateFlashlightDust(time);
                this.updateNearestClueHighlight(time);

                const currentRoom = this.roomsData[this.currentRoomIndex];
                if (!currentRoom) return;

                const portalX = currentRoom.x + this.ROOM_WIDTH / 2 + 8;
                const portalY = currentRoom.y + 43;
                const nearPortal = Phaser.Math.Distance.Between(this.player.x, this.player.y, portalX, portalY) < 40;
                this.updateElevatorGlows(time, nearPortal);

                if (this.isElevatorMenuOpen) {
                    if (!nearPortal || !canUseElevatorRef.current) {
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

                        const upPressed = Phaser.Input.Keyboard.JustDown(this.wasd.up);
                        const downPressed = Phaser.Input.Keyboard.JustDown(this.wasd.down);

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

                // 상호작용 우선순위: 증거 > 엘리베이터
                const nearestClue = this.getNearestClue(this.CLUE_INTERACT_RADIUS);

                if (nearestClue) {
                    this.interactionContainer.setPosition(this.player.x, this.player.y - 34);
                    this.updateInteractionPrompt("INSPECT", 0xffffcc);
                    this.interactionContainer.setVisible(true);

                    // ✅ 프롬프트도 살짝 반짝
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
                        // ✅ 추가: 엘리베이터 사용 가능 여부 체크 (특정 튜토리얼 단계에서 차단)
                        if (!canUseElevatorRef.current) return;

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
            }
        }

        const config = {
            type: Phaser.AUTO,
            width: 640,
            height: 640,
            parent: gameContainer.current,
            backgroundColor: "#000000",
            pixelArt: true,
            physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } },
            scene: [BootScene, AgitScene],
            scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
            input: {
                mouse: { target: gameContainer.current },
                touch: { target: gameContainer.current },
            },
        };

        gameInstance.current = new Phaser.Game(config);
        if (gameInstance.current?.canvas) {
            gameInstance.current.canvas.style.pointerEvents = "auto";
            gameInstance.current.canvas.style.cursor = "default";
        }

        return () => {
            if (gameInstance.current) {
                gameInstance.current.destroy(true);
                gameInstance.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!gameContainer.current) return;

        const refreshScale = () => {
            const game = gameInstance.current;
            if (!game) return;
            try {
                game.scale?.refresh?.();
            } catch {}
        };

        refreshScale();

        if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(() => refreshScale());
            ro.observe(gameContainer.current);
            return () => ro.disconnect();
        }

        window.addEventListener("resize", refreshScale);
        return () => window.removeEventListener("resize", refreshScale);
    }, []);

    return (
        <div
            ref={gameContainer}
            className="w-full h-full rounded-lg overflow-hidden relative outline-none"
            tabIndex={0}
            onClick={() => gameContainer.current?.focus()}
        />
    );
}
