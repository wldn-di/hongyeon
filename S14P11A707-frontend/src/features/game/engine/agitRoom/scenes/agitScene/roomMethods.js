import Phaser from "phaser";

export const roomMethods = {
    updateCameraBounds(roomIndex) {
        const room = this.roomsData[roomIndex];
        this.cameras.main.setBounds(room.x, room.y, this.ROOM_WIDTH, this.ROOM_WIDTH);
    },

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
    },

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
    },

};
