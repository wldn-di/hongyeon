export function initAgitSceneState(scene, { enablePuzzles, isDialogActiveRef, inputFocusedRef, canUseElevatorRef }) {
    scene.ENABLE_PUZZLES = Boolean(enablePuzzles);
    scene.isDialogActiveRef = isDialogActiveRef;
    scene.inputFocusedRef = inputFocusedRef;
    scene.canUseElevatorRef = canUseElevatorRef;

    scene.assetsDB = [];
    scene.availableRoomTypes = [];

    scene.ROOM_COUNT = 6;
    scene.ROOM_WIDTH = 320;
    scene.ROOM_GAP = 1000;
    scene.currentRoomIndex = 0;

    scene.roomsData = [];

    scene.darkOverlay = null;
    scene.lightSprite = null;

    // 손전등
    scene.flashlight = null;
    scene.isFlashlightOn = false;
    scene.flashAlpha = 0;
    scene.flashAlphaIntent = 0;
    scene.flashPower = 0;
    scene.flashJitterSeed = Math.random() * 1000;
    scene.flashJitterSeed2 = Math.random() * 1000;
    scene.flashJitterSeed3 = Math.random() * 1000;
    scene.FLASHLIGHT_CLUE_REVEAL_MIN_ALPHA = 0.15;
    scene.FLASHLIGHT_CLUE_REVEAL_RADIUS = 210;
    scene.FLASHLIGHT_CLUE_REVEAL_HALF_ANGLE = Math.PI / 10;
    scene.flashBattery = 1;
    // 게이지 기반(약 10초 사용 가능) + 천천히 회복, 회복 중에도 재사용 가능
    scene.FLASHLIGHT_BATTERY_DRAIN_PER_SEC = 0.1;
    scene.FLASHLIGHT_BATTERY_RECHARGE_PER_SEC = 0.0625;

    // 노이즈/그레인
    scene.staticNoise = null;
    scene.grainBaseAlpha = 0.045;

    scene.dustEmitter = null;
    scene.footstepEmitter = null;
    scene.steamEmitter = null;
    scene.dripEmitter = null;

    scene.emAmbientDust = null;
    scene.emSteam = null;
    scene.emDrip = null;

    // SFX
    scene.sfxFlashlight = null;
    scene.sfxNoise = null;
    scene.sfxRumble = null;
    scene.sfxWalk = null;
    scene.sfxElevator = null;

    scene.noiseCooldownUntil = 0;
    scene.noiseStopAt = 0;

    scene.lastFootstepTime = 0;

    scene.furnitureGroup = null;
    scene.wallGroup = null;

    scene.isTransitioning = false;
    scene.lastDirection = "down";

    scene.reflection = null;

    // Elevator door overlay
    scene.elevatorDoorLeft = null;
    scene.elevatorDoorRight = null;

    // UI
    scene.interactionContainer = null;
    scene.interactionText = null;
    scene.interactionKeyBg = null;
    scene.interactionKeyText = null;
    scene.interactionActionText = null;
    scene.floorHudContainer = null;
    scene.floorHudBg = null;
    scene.floorHudText = null;
    scene.floorHudAccent = null;
    scene.floorHudTopLine = null;
    scene.flashHudContainer = null;
    scene.flashHudBg = null;
    scene.flashHudBatteryFill = null;
    scene.flashHudStatusText = null;

    // ✅ 프롬프트 BG 레퍼런스(빛나는 연출용)
    scene.promptBg = null;
    scene.elevatorMenuContainer = null;
    scene.elevatorMenuBg = null;
    scene.elevatorMenuGlow = null;
    scene.elevatorMenuTitle = null;
    scene.elevatorMenuHint = null;
    scene.elevatorMenuUpRow = null;
    scene.elevatorMenuDownRow = null;
    scene.elevatorMenuUpText = null;
    scene.elevatorMenuDownText = null;
    scene.elevatorMenuUpKey = null;
    scene.elevatorMenuDownKey = null;
    scene.isElevatorMenuOpen = false;
    scene.elevatorGlows = [];
    scene.elevatorGlowPulseSeed = Math.random() * 1000;
    scene.uiBeepCooldownUntil = 0;

    scene.flashDust = null;
    scene.flashDustEmitter = null;
    scene.flashDustOn = false;

    scene.baseZoom = 1;

    // 비네팅
    scene.vignette = null;

    // 가까운 오브젝트 하이라이트 글로우
    scene.interactGlow = null;
    scene.highlightTarget = null;
    scene.lastHighlightCheck = 0;
    scene.HIGHLIGHT_RADIUS = 85;

    // ----------------------------
    // ✅ 임시 증거(단서) 시스템
    // ----------------------------
    scene.clues = [];
    scene.CLUE_SCALE = 0.8;
    scene.CLUE_HIGHLIGHT_RADIUS = 55;
    scene.CLUE_INTERACT_RADIUS = 40;
    scene.CLUE_NEAR_REVEAL_RADIUS = 18;

    scene.isInspecting = false;
    scene.inspectTarget = null;

    scene.inspectUI = null;
    scene.inspectTitleText = null;
    scene.inspectBodyText = null;

    scene.isPuzzleActive = false;
    scene.puzzleContainer = null;
    scene.puzzleTitle = null;
    scene.puzzleHint = null;
    scene.puzzleCountdownText = null;
    scene.puzzleTimeoutEvent = null;
    scene.puzzleEndsAt = 0;
    scene.puzzleLeftSockets = [];
    scene.puzzleRightSockets = [];
    scene.puzzleLines = [];
    scene.puzzleActiveLeft = null;
    scene.puzzleSolvedCount = 0;
    scene.puzzleTarget = null;
    scene.puzzleType = null;
    scene.lastCluePuzzleType = null;
    scene.timingBar = null;
    scene.timingZone = null;
    scene.timingIndicator = null;
    scene.timingTween = null;
    scene.elevatorWirePending = false;

    // QTE (clue puzzle)
    scene.qteSequence = [];
    scene.qteIndex = 0;
    scene.qteSequenceText = null;
    scene.qteProgressText = null;

    // Balance (clue puzzle)
    scene.balanceBar = null;
    scene.balanceZone = null;
    scene.balanceIndicator = null;
    scene.balanceProgressText = null;
    scene.balanceX = 0;
    scene.balanceV = 0;
    scene.balanceHoldMs = 0;
    scene.balanceHoldTargetMs = 0;
    scene.balanceNoiseSeed = Math.random() * 1000;
    scene.balanceNoiseSeed2 = Math.random() * 1000;

    // Dial safe (clue puzzle)
    scene.dialGroup = null;
    scene.dialGraphics = null;
    scene.dialPointer = null;
    scene.dialMarkers = [];
    scene.dialRotation = 0;
    scene.dialTargets = [];
    scene.dialTargetIndex = 0;
    scene.dialStatusText = null;

    scene.keyEsc = null;

    // ✅ [추가] 증거 반짝 파티클
    scene.clueSparkle = null; // ParticleEmitterManager
    scene.clueSparkleEmitter = null; // Emitter
    scene.clueSparkleOn = false;

    scene.initialClues = [];
    scene.onClueInspected = null;
    scene.onRoomChanged = null;
    scene.initialRoomIndex = 0;
}
