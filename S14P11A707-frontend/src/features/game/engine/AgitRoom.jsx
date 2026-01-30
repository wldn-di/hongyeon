import React, { useEffect, useRef, useState } from "react";

import { createAgitRoomGame } from "./agitRoom/createAgitRoomGame";

const clamp01 = (value) => {
    const v = Number(value);
    if (!Number.isFinite(v)) return 0;
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
};

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
    const [flashStatus, setFlashStatus] = useState({
        battery: 1,
        isOn: false,
    });

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
        const intervalId = window.setInterval(() => {
            const game = gameInstance.current;
            const scene = game?.scene?.getScene?.("AgitScene");
            if (!scene) return;

            const next = {
                battery: clamp01(scene.flashBattery),
                isOn: Boolean(scene.isFlashlightOn),
            };

            setFlashStatus((prev) => {
                const sameBattery = Math.abs(prev.battery - next.battery) < 0.004;
                if (sameBattery && prev.isOn === next.isOn) return prev;
                return next;
            });
        }, 120);

        return () => window.clearInterval(intervalId);
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

    const batteryPct = Math.round(flashStatus.battery * 100);
    const isCharging = !flashStatus.isOn && flashStatus.battery < 0.999;
    const statusLabel = batteryPct <= 15 ? "LOW" : isCharging ? "CHG" : flashStatus.isOn ? "ON" : "OFF";

    const batteryFillColor = batteryPct <= 15 ? "bg-amber-300" : isCharging ? "bg-emerald-400" : "bg-blue-400";

    return (
        <div
            ref={gameContainer}
            className="w-full h-full rounded-lg overflow-hidden relative outline-none"
            tabIndex={0}
            onClick={() => gameContainer.current?.focus()}
        >
            <div className="absolute top-3 left-3 z-50 pointer-events-none select-none">
                <div className="px-3 py-2 rounded-lg border border-white/10 bg-black/60 backdrop-blur">
                    <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="text-[10px] tracking-widest font-bold text-blue-200/90">FLASHLIGHT</div>
                        <div className="text-[10px] font-bold text-blue-100/90">
                            {statusLabel} {batteryPct}%
                        </div>
                    </div>

                    <div className="w-40 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className={`h-full ${batteryFillColor} transition-[width] duration-200`}
                            style={{ width: `${batteryPct}%` }}
                        />
                    </div>

                    <div className="mt-1 text-[10px] text-white/40">
                        SHIFT <span className="text-white/30">to toggle</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
