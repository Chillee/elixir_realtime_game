import { Level, Collidable, PlayerBlock, Spike, Block } from "./entities";
import { GameState, PlayerState } from "./state";
import { Constants } from "./constants";
import { Channel } from "phoenix";
import { Camera } from "./camera";

export class Game {
  deathAnimFrame = 0;
  user_id = Math.floor(Math.random() * 10000);
  canvas: HTMLCanvasElement;
  spriteSheet: HTMLImageElement;
  level: Level;
  state: GameState;

  constructor() {
    this.canvas = <HTMLCanvasElement>document.getElementById("gameCanvas");
    this.spriteSheet = new Image();
    this.spriteSheet.src = "images/sheet.png";
    this.state = new GameState(this.user_id);

    this.level = new Level();
    this.level.create(this.state);
  }

  private checkCollision(a: PlayerState, b: Collidable) {
    if (a.x >= b.x + b.w - a.left - b.right || a.x + Constants.PLAYER_W - a.right - b.left <= b.x) return false;
    if (a.y >= b.y + b.h - a.top - b.bottom || a.y + Constants.PLAYER_H - b.top <= b.y) return false;
    return true;
  }

  private killPlayer() {
    this.deathAnimFrame = 10;
    this.state.userState.x = this.level.spawnX;
    this.state.userState.y = this.level.spawnY;
    this.state.userState.dx = 0;
    this.state.userState.dy = 0;
  }

  run(roomChan: Channel) {
    const collisions = () => {
      const gs = this.state;
      let players = gs.playerStates;
      let user = gs.userState;

      user.can_jump = false;

      user.y += user.dy;
      for (const obj of this.level.collidables) {
        if (this.checkCollision(user, obj)) {
          if (obj instanceof PlayerBlock) {
            user.y -= user.dy;
            if (!this.checkCollision(user, obj)) {
              user.y += user.dy;
              if (user.dy > 0) {
                user.dy = 0;
                user.can_jump = true;
                user.y = obj.y - Constants.PLAYER_H + obj.top;
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
              user.y = obj.y - Constants.PLAYER_H + obj.top;
            }
            else {
              user.dy = 0;
              user.y = obj.y + obj.h - user.top - obj.bottom;
            }
            if (obj instanceof Spike) {
              this.killPlayer();
            }
          }
        }
      }
      user.x += user.dx;
      for (const obj of this.level.collidables) {
        if (this.checkCollision(user, obj) && !(obj instanceof PlayerBlock)) {
          if (user.dx > 0) {
            user.x = obj.x - Constants.PLAYER_W + user.right + obj.left;
          }
          else {
            user.x = obj.x + obj.w - user.left - obj.right;
          }
        }
      }
    }

    const draw = () => {
      const ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
      const gs = this.state;
      ctx.fillStyle = 'rgb(255, 255, 255)';
      ctx.fillRect(0, 0, Constants.W, Constants.H);
      ctx.fillStyle = 'rgb(0, 0, 0)';
      const user = this.state.userState;

      for (const obj of this.level.collidables) {
        if (obj instanceof PlayerBlock)
          ctx.fillRect(obj.x - Camera.x, obj.y - Camera.y, obj.w, obj.h);
        if (obj instanceof Block)
          ctx.fillRect(obj.x - Camera.x, obj.y - Camera.y, obj.w, obj.h);
        if (obj instanceof Spike)
          ctx.drawImage(this.spriteSheet, Constants.PLAYER_W * 4, 0, Constants.PLAYER_W, Constants.PLAYER_H,
            obj.x - Camera.x, obj.y - Camera.y, Constants.PLAYER_W, Constants.PLAYER_H);
      }

      if (user.x_dir === -1) {
        ctx.translate(user.x + Constants.PLAYER_W - Camera.x, user.y - Camera.y);
        ctx.scale(-1, 1);
        if (user.dx != 0) {
          user.frame = Math.floor(user.tick / 5) % 4;
          ctx.drawImage(this.spriteSheet, user.frame * Constants.PLAYER_W, Constants.PLAYER_H,
            Constants.PLAYER_W, Constants.PLAYER_H, 0, 0,
            Constants.PLAYER_W, Constants.PLAYER_H);
        }
        else {
          ctx.drawImage(this.spriteSheet, 0, 0, Constants.PLAYER_W, Constants.PLAYER_H,
            0, 0, Constants.PLAYER_W, Constants.PLAYER_H);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      else {
        if (user.dx != 0) {
          user.frame = Math.floor(user.tick / 5) % 4;
          ctx.drawImage(this.spriteSheet, user.frame * Constants.PLAYER_W, Constants.PLAYER_H, Constants.PLAYER_W, Constants.PLAYER_H, user.x - Camera.x, user.y - Camera.y, Constants.PLAYER_W, Constants.PLAYER_H);
        }
        else {
          ctx.drawImage(this.spriteSheet, 0, 0, Constants.PLAYER_W, Constants.PLAYER_H, user.x - Camera.x, user.y - Camera.y, Constants.PLAYER_W, Constants.PLAYER_H);
        }
      }
      for (const player of this.state.nonUserStates) {
        ctx.fillRect(player.x - Camera.x, player.y - Camera.y, Constants.PLAYER_W, Constants.PLAYER_H);
      }

      if (this.deathAnimFrame >= 5) {
        this.deathAnimFrame--;
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, Constants.W, Constants.H);
      }
      else if (this.deathAnimFrame > 0) {
        this.deathAnimFrame--;
        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.fillRect(0, 0, Constants.W, Constants.H);
      }
    }

    const Key = {
      _pressed: {},

      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,

      isDown: function (keyCode: number) {
        return this._pressed[keyCode];
      },

      onKeydown: function (event: KeyboardEvent) {
        this._pressed[event.keyCode] = true;
      },

      onKeyup: function (event: KeyboardEvent) {
        delete this._pressed[event.keyCode];
      }
    };
    window.addEventListener('keyup', function (event) {
      Key.onKeyup(event);
    }, false);
    window.addEventListener('keydown', function (event) {
      Key.onKeydown(event);
    }, false);

    const check_bounds = (user: PlayerState) => {
      if (user.x < 0)
        user.x = 0;
      if (user.x > Constants.LEVEL_W - Constants.PLAYER_W)
        user.x = Constants.LEVEL_W - Constants.PLAYER_W;
      if (user.y < 0)
        user.y = 0;
      if (user.y > Constants.LEVEL_H - Constants.PLAYER_H) {
        user.dy = 0;
        user.y = Constants.LEVEL_H - Constants.PLAYER_H;
        user.can_jump = true;
      }
    }

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

      Camera.update(user);
    }
    const push = () => {
      roomChan.push("update_pos", {
        x: this.state.userState.x,
        y: this.state.userState.y,
        user_id: this.user_id
      })
    }
    setInterval(() => {
      update();
      draw();
      push();
    }, 1000 / this.state.fps);
  }
}