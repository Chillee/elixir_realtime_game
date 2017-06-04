"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PlayerState {
    constructor(x, y, id) {
        this.x = 0;
        this.y = 0;
        this.left = 3;
        this.right = 3;
        this.top = 6;
        this.x_dir = 1;
        this.id = 0;
        this.dx = 0;
        this.dy = 0;
        this.can_jump = false;
        this.tick = 0;
        this.frame = 0;
        this.x = x;
        this.y = y;
        this.id = id;
    }
}
exports.PlayerState = PlayerState;
class GameState {
    constructor(user_id) {
        this.fps = 60;
        this.user_id = user_id;
        this.playerStates = new Array(new PlayerState(0, 0, user_id));
    }
    get userState() {
        return this.playerStates.filter(x => x.id === this.user_id)[0];
    }
    get nonUserStates() {
        return this.playerStates.filter(x => x.id !== this.user_id);
    }
}
exports.GameState = GameState;
//# sourceMappingURL=state.js.map