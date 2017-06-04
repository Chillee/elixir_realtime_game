"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("./entities");
const state_1 = require("./state");
const constants_1 = require("./constants");
const camera_1 = require("./camera");
class Game {
    constructor() {
        this.deathAnimFrame = 0;
        this.user_id = Math.floor(Math.random() * 10000);
        this.canvas = document.getElementById("gameCanvas");
        this.spriteSheet = new Image();
        this.spriteSheet.src = "images/sheet.png";
        this.state = new state_1.GameState(this.user_id);
        this.level = new entities_1.Level();
        this.level.create(this.state);
    }
    checkCollision(a, b) {
        if (a.x >= b.x + b.w - a.left - b.right || a.x + constants_1.Constants.PLAYER_W - a.right - b.left <= b.x)
            return false;
        if (a.y >= b.y + b.h - a.top - b.bottom || a.y + constants_1.Constants.PLAYER_H - b.top <= b.y)
            return false;
        return true;
    }
    killPlayer() {
        this.deathAnimFrame = 10;
        this.state.userState.x = this.level.spawnX;
        this.state.userState.y = this.level.spawnY;
        this.state.userState.dx = 0;
        this.state.userState.dy = 0;
    }
    run(roomChan) {
        const collisions = () => {
            const gs = this.state;
            let players = gs.playerStates;
            let user = gs.userState;
            user.can_jump = false;
            user.y += user.dy;
            for (const obj of this.level.collidables) {
                if (this.checkCollision(user, obj)) {
                    if (obj instanceof entities_1.PlayerBlock) {
                        user.y -= user.dy;
                        if (!this.checkCollision(user, obj)) {
                            user.y += user.dy;
                            if (user.dy > 0) {
                                user.dy = 0;
                                user.can_jump = true;
                                user.y = obj.y - constants_1.Constants.PLAYER_H + obj.top;
                            }
                        }
                        else {
                            user.y += user.dy;
                        }
                    }
                    else {
                        if (user.dy > 0) {
                            user.dy = 0;
                            user.can_jump = true;
                            user.y = obj.y - constants_1.Constants.PLAYER_H + obj.top;
                        }
                        else {
                            user.dy = 0;
                            user.y = obj.y + obj.h - user.top - obj.bottom;
                        }
                        if (obj instanceof entities_1.Spike) {
                            this.killPlayer();
                        }
                    }
                }
            }
            user.x += user.dx;
            for (const obj of this.level.collidables) {
                if (this.checkCollision(user, obj) && !(obj instanceof entities_1.PlayerBlock)) {
                    if (user.dx > 0) {
                        user.x = obj.x - constants_1.Constants.PLAYER_W + user.right + obj.left;
                    }
                    else {
                        user.x = obj.x + obj.w - user.left - obj.right;
                    }
                }
            }
        };
        const draw = () => {
            const ctx = this.canvas.getContext("2d");
            const gs = this.state;
            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.fillRect(0, 0, constants_1.Constants.W, constants_1.Constants.H);
            ctx.fillStyle = 'rgb(0, 0, 0)';
            const user = this.state.userState;
            for (const obj of this.level.collidables) {
                if (obj instanceof entities_1.PlayerBlock)
                    ctx.fillRect(obj.x - camera_1.Camera.x, obj.y - camera_1.Camera.y, obj.w, obj.h);
                if (obj instanceof entities_1.Block)
                    ctx.fillRect(obj.x - camera_1.Camera.x, obj.y - camera_1.Camera.y, obj.w, obj.h);
                if (obj instanceof entities_1.Spike)
                    ctx.drawImage(this.spriteSheet, constants_1.Constants.PLAYER_W * 4, 0, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, obj.x - camera_1.Camera.x, obj.y - camera_1.Camera.y, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
            }
            if (user.x_dir === -1) {
                ctx.translate(user.x + constants_1.Constants.PLAYER_W - camera_1.Camera.x, user.y - camera_1.Camera.y);
                ctx.scale(-1, 1);
                if (user.dx != 0) {
                    user.frame = Math.floor(user.tick / 5) % 4;
                    ctx.drawImage(this.spriteSheet, user.frame * constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, 0, 0, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                }
                else {
                    ctx.drawImage(this.spriteSheet, 0, 0, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, 0, 0, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                }
                ctx.setTransform(1, 0, 0, 1, 0, 0);
            }
            else {
                if (user.dx != 0) {
                    user.frame = Math.floor(user.tick / 5) % 4;
                    ctx.drawImage(this.spriteSheet, user.frame * constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, user.x - camera_1.Camera.x, user.y - camera_1.Camera.y, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                }
                else {
                    ctx.drawImage(this.spriteSheet, 0, 0, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, user.x - camera_1.Camera.x, user.y - camera_1.Camera.y, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                }
            }
            for (const player of this.state.nonUserStates) {
                ctx.fillRect(player.x - camera_1.Camera.x, player.y - camera_1.Camera.y, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
            }
            if (this.deathAnimFrame >= 5) {
                this.deathAnimFrame--;
                ctx.fillStyle = 'rgb(0, 0, 0)';
                ctx.fillRect(0, 0, constants_1.Constants.W, constants_1.Constants.H);
            }
            else if (this.deathAnimFrame > 0) {
                this.deathAnimFrame--;
                ctx.fillStyle = 'rgb(255, 255, 255)';
                ctx.fillRect(0, 0, constants_1.Constants.W, constants_1.Constants.H);
            }
        };
        const Key = {
            _pressed: {},
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            isDown: function (keyCode) {
                return this._pressed[keyCode];
            },
            onKeydown: function (event) {
                this._pressed[event.keyCode] = true;
            },
            onKeyup: function (event) {
                delete this._pressed[event.keyCode];
            }
        };
        window.addEventListener('keyup', function (event) {
            Key.onKeyup(event);
        }, false);
        window.addEventListener('keydown', function (event) {
            Key.onKeydown(event);
        }, false);
        const check_bounds = (user) => {
            if (user.x < 0)
                user.x = 0;
            if (user.x > constants_1.Constants.LEVEL_W - constants_1.Constants.PLAYER_W)
                user.x = constants_1.Constants.LEVEL_W - constants_1.Constants.PLAYER_W;
            if (user.y < 0)
                user.y = 0;
            if (user.y > constants_1.Constants.LEVEL_H - constants_1.Constants.PLAYER_H) {
                user.dy = 0;
                user.y = constants_1.Constants.LEVEL_H - constants_1.Constants.PLAYER_H;
                user.can_jump = true;
            }
        };
        const update = () => {
            const jump_v = 12;
            const v = 4;
            const gs = this.state;
            const user = gs.userState;
            user.tick += 1;
            if (Key.isDown(Key.UP) && user.can_jump) {
                user.dy = -jump_v;
                user.can_jump = false;
            }
            if (Key.isDown(Key.LEFT)) {
                user.dx += (-v - user.dx) * 0.2;
                user.x_dir = -1;
            }
            else if (Key.isDown(Key.RIGHT)) {
                user.dx += (v - user.dx) * 0.2;
                user.x_dir = 1;
            }
            else {
                user.dx *= 0.98;
                if (Math.abs(user.dx) < 1) {
                    user.dx = 0;
                }
            }
            collisions();
            user.dy += 0.7;
            check_bounds(user);
            camera_1.Camera.update(user);
        };
        const push = () => {
            roomChan.push("update_pos", {
                x: this.state.userState.x,
                y: this.state.userState.y,
                user_id: this.user_id
            });
        };
        setInterval(() => {
            update();
            draw();
            push();
        }, 1000 / this.state.fps);
    }
}
exports.Game = Game;
//# sourceMappingURL=game.js.map