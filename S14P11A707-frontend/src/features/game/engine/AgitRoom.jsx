import React, { useEffect, useRef } from "react";

import { createAgitRoomGame } from "./agitRoom/createAgitRoomGame";

export default function AgitRoom({
    clues = [],
    onClueInspected,
    onRoomChanged,
    isDialogActive = false,
    inputFocused = false,
    canUseElevator = true,
    initialRoomIndex = 0,
    enablePuzzles = false,
}) {
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
        if (!gameContainer.current) return;

        const initialClues = Array.isArray(clues) ? clues : [];

        try {
            gameInstance.current = createAgitRoomGame({
                parent: gameContainer.current,
                initialClues,
                initialRoomIndexRef,
                onClueInspectedRef,
                onRoomChangedRef,
                isDialogActiveRef,
                inputFocusedRef,
                canUseElevatorRef,
                enablePuzzles,
            });
        } catch (e) {
            console.error("Failed to create AgitRoom Phaser game:", e);
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

