import Phaser from "phaser";

export function createBootScene({ initialClues, initialRoomIndexRef, onClueInspectedRef, onRoomChangedRef }) {
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

    return BootScene;
}
