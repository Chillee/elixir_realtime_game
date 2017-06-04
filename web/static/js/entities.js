"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
class Block {
    constructor(x, y) {
        this.x = 0;
        this.y = 0;
        this.w = constants_1.Constants.PLAYER_W;
        this.h = constants_1.Constants.PLAYER_H;
        this.left = 0;
        this.right = 0;
        this.top = 0;
        this.bottom = 0;
        this.x = x;
        this.y = y;
    }
}
exports.Block = Block;
class PlayerBlock {
    constructor(x, y) {
        this.x = 0;
        this.y = 0;
        this.w = constants_1.Constants.PLAYER_W;
        this.h = constants_1.Constants.PLAYER_H;
        this.left = 0;
        this.right = 0;
        this.top = 0;
        this.bottom = 0;
        this.x = x;
        this.y = y;
    }
}
exports.PlayerBlock = PlayerBlock;
class Spike {
    constructor(x, y) {
        this.x = 0;
        this.y = 0;
        this.w = constants_1.Constants.PLAYER_W;
        this.h = constants_1.Constants.PLAYER_H;
        this.left = 0;
        this.right = 0;
        this.top = constants_1.Constants.PLAYER_H / 2;
        this.bottom = 0;
        this.x = x;
        this.y = y;
    }
}
exports.Spike = Spike;
class Level {
    addDeadPlayer(x, y) {
        // todo
    }
    addBlock(x, y) {
        this.collidables.push(new Block(x, y));
    }
    addSpike(x, y) {
        this.collidables.push(new Spike(x, y));
    }
    create(gs) {
        this.collidables = new Array();
        let levelImage = new Image();
        levelImage.src = "images/level.png";
        levelImage.onload = () => {
            let canvas = document.createElement("canvas");
            canvas.width = levelImage.width;
            canvas.height = levelImage.height;
            let ctx = canvas.getContext("2d");
            ctx.drawImage(levelImage, 0, 0, levelImage.width, levelImage.height);
            let data = ctx.getImageData(0, 0, levelImage.width, levelImage.height).data;
            constants_1.Constants.LEVEL_W = levelImage.width * 32;
            constants_1.Constants.LEVEL_H = levelImage.height * 32;
            for (let y = 0; y < levelImage.height; y++) {
                for (let x = 0; x < levelImage.width; x++) {
                    let r = data[(x + y * levelImage.width) * 4];
                    let g = data[(x + y * levelImage.width) * 4 + 1];
                    let b = data[(x + y * levelImage.width) * 4 + 2];
                    if (r === 0 && g === 0 && b === 0) {
                        this.addBlock(x * 32, y * 32);
                    }
                    if (r === 0 && g === 255 && b === 0) {
                        this.spawnX = x * 32;
                        this.spawnY = y * 32;
                        gs.userState.x = x * 32;
                        gs.userState.y = y * 32;
                    }
                    if (r === 255 && g === 0 && b === 0) {
                        this.addSpike(x * 32, y * 32);
                    }
                }
            }
        };
    }
}
exports.Level = Level;
//# sourceMappingURL=entities.js.map