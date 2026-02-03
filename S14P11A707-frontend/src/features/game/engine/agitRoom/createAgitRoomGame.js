import Phaser from "phaser";

import { createAgitScene } from "./scenes/createAgitScene";
import { createBootScene } from "./scenes/createBootScene";

export function createAgitRoomGame({
    parent,
    initialClues,
    initialRoomIndexRef,
    onClueInspectedRef,
    onRoomChangedRef,
    isDialogActiveRef,
    inputFocusedRef,
    canUseElevatorRef,
    enablePuzzles = true,
    enableRushers = false,
}) {
    if (!parent) throw new Error("createAgitRoomGame: parent is required");

    const BootScene = createBootScene({ initialClues, initialRoomIndexRef, onClueInspectedRef, onRoomChangedRef });
    const AgitScene = createAgitScene({ enablePuzzles, enableRushers, isDialogActiveRef, inputFocusedRef, canUseElevatorRef });

    const config = {
        type: Phaser.AUTO,
        width: 640,
        height: 640,
        parent,
        backgroundColor: "#000000",
        pixelArt: true,
        physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } },
        scene: [BootScene, AgitScene],
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        input: {
            mouse: { target: parent },
            touch: { target: parent },
        },
    };

    const game = new Phaser.Game(config);
    if (game?.canvas) {
        game.canvas.style.pointerEvents = "auto";
        game.canvas.style.cursor = "default";
    }

    return game;
}

