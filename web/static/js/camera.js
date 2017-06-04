"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
class Camera {
    static update(user) {
        this.targetX = user.x + constants_1.Constants.PLAYER_W / 2 - constants_1.Constants.W / 2;
        this.targetY = user.y + constants_1.Constants.PLAYER_H / 2 - constants_1.Constants.H / 2;
        this.cx += (this.targetX - this.cx) * 0.1;
        this.cy += (this.targetY - this.cy) * 0.1;
        if (this.cx > constants_1.Constants.LEVEL_W - constants_1.Constants.W)
            this.cx = constants_1.Constants.LEVEL_W - constants_1.Constants.W;
        if (this.cx < 0)
            this.cx = 0;
        if (this.cy > constants_1.Constants.LEVEL_H - constants_1.Constants.H)
            this.cy = constants_1.Constants.LEVEL_H - constants_1.Constants.H;
        if (this.cy < 0)
            this.cy = 0;
    }
    static get x() {
        return Math.floor(this.cx);
    }
    static get y() {
        return Math.floor(this.cy);
    }
}
Camera.cx = 0;
Camera.cy = 0;
Camera.targetX = 0;
Camera.targetY = 0;
exports.Camera = Camera;
//# sourceMappingURL=camera.js.map