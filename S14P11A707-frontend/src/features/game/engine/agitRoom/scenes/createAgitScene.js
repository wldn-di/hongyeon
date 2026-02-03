import Phaser from "phaser";

import { ambienceMethods } from "./agitScene/ambienceMethods";
import { clueMethods } from "./agitScene/clueMethods";
import { effectsMethods } from "./agitScene/effectsMethods";
import { elevatorMethods } from "./agitScene/elevatorMethods";
import { initAgitSceneState } from "./agitScene/initAgitSceneState";
import { lifecycleMethods } from "./agitScene/lifecycleMethods";
import { puzzleMethods } from "./agitScene/puzzleMethods";
import { roomMethods } from "./agitScene/roomMethods";
import { uiMethods } from "./agitScene/uiMethods";
import { updateMethods } from "./agitScene/updateMethods";

export function createAgitScene({ enablePuzzles, enableRushers, isDialogActiveRef, inputFocusedRef, canUseElevatorRef }) {
    class AgitScene extends Phaser.Scene {
        constructor() {
            super("AgitScene");
            initAgitSceneState(this, { enablePuzzles, enableRushers, isDialogActiveRef, inputFocusedRef, canUseElevatorRef });
        }
    }

    Object.assign(
        AgitScene.prototype,
        lifecycleMethods,
        clueMethods,
        puzzleMethods,
        effectsMethods,
        ambienceMethods,
        elevatorMethods,
        uiMethods,
        roomMethods,
        updateMethods,
    );

    return AgitScene;
}

