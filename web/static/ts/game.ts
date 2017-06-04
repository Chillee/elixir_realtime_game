import { Level, Collidable, PlayerBlock, Spike, Block, Flag, ScoringArea } from "./entities";
import { GameState, PlayerState } from "./state";
import { Constants } from "./constants";
import { Channel } from "phoenix";
import { Camera } from "./camera";

export class PlayerData {
  x = 0;
  y = 0;
  id = 0;
  team = 0;
  nickname = "";

  constructor(x: number, y: number, id: number, team: number, nickname: string) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.team = team;
    this.nickname = nickname;
  }
}

export class Game {
  canvas: HTMLCanvasElement;
  spriteSheet: HTMLImageElement;
  state: GameState;

  constructor(id: number, team: number) {
    this.canvas = <HTMLCanvasElement>document.getElementById("gameCanvas");
    this.spriteSheet = new Image();
    this.spriteSheet.src = "images/sheet.png";
    this.state = new GameState(id, team);
  }

  private checkCollision(a: PlayerState, b: Collidable) {
    if (a.x >= b.x + b.w - a.left - b.right || a.x + Constants.PLAYER_W - a.right - b.left <= b.x) return false;
    if (a.y >= b.y + b.h - a.top - b.bottom || a.y + Constants.PLAYER_H - b.top <= b.y) return false;
    return true;
  }

  private takeFlag(flag: Flag) {
    this.state.roomChan.push("take_flag", {
      id: this.state.user_id,
      team: flag.team
    }).receive("fail", () => {
      flag.holding_id = null;
    });

    flag.holding_id = this.state.user_id;
  }

  private scoreFlag(flag: Flag) {
    this.state.roomChan.push("score_flag", {
      id: this.state.user_id,
      user_team: this.state.user_team,
      flag_team: flag.team
    });

    flag.holding_id = null;
  }

  private blockInRange(block: PlayerBlock): boolean {
    let blockX = block.x + block.w / 2;
    let blockY = block.y + block.h / 2;
    let pX = this.state.userState.x + Constants.PLAYER_W / 2;
    let pY = this.state.userState.x + Constants.PLAYER_W / 2;
    if (Math.hypot(blockX - pX, blockY - pY) < Constants.DESTROY_RADIUS) {
      return true;
    }
    return false;
  }

  private sudoku() {
    this.state.roomChan.push("sudoku", new PlayerData(
      this.state.userState.x,
      this.state.userState.y,
      this.state.user_id,
      this.state.user_team,
      this.state.user_nickname
    ));
    let ids: Array<number> = new Array();
    for (const obj of this.state.level.collidables) {
      if (obj instanceof PlayerBlock && obj.team != this.state.user_team && this.blockInRange(obj)) {
        ids.push(obj.id);
      }
    }
    this.state.roomChan.push("remove_blocks", { block_ids: ids });
    this.teleportPlayer();
  }

  private killPlayer() {
    this.state.roomChan.push("death", new PlayerData(
      this.state.userState.x,
      this.state.userState.y,
      this.state.user_id,
      this.state.user_team,
      this.state.user_nickname
    ));
    this.teleportPlayer();
  }

  private teleportPlayer() {
    this.state.deathAnimFrame = 30;
    this.state.userState.x = this.state.level.spawnX;
    this.state.userState.y = this.state.level.spawnY;
    this.state.userState.dx = 0;
    this.state.userState.dy = 0;
  }

  run() {
    const collisions = () => {
      const gs = this.state;
      let players = gs.playerStates;
      let user = gs.userState;

      user.can_jump = false;

      user.y += user.dy;
      for (const obj of this.state.level.collidables) {
        if (this.checkCollision(user, obj)) {
          if (obj instanceof ScoringArea) {
            if (obj.team === this.state.user_team) {
              for (const flag of this.state.flags) {
                if (flag.holding_id === this.state.user_id) {
                  this.scoreFlag(flag);
                }
              }
            }
          } else if (obj instanceof PlayerBlock) {
            user.y -= user.dy;
            if (!this.checkCollision(user, obj)) {
              user.y += user.dy;
              if (user.dy > 0) {
                user.dy = 0;
                user.can_jump = !Key.isDown(Key.UP);
                user.y = obj.y - Constants.PLAYER_H + obj.top;
              }
            }
            else {
              user.y += user.dy;
            }
          } else if (obj instanceof Flag) {
            if (obj.holding_id === null && obj.team !== this.state.user_team) {
              obj.holding_id = this.state.user_id;
              this.takeFlag(obj);
            }
          } else {
            if (user.dy > 0) {
              user.dy = 0;
              user.can_jump = !Key.isDown(Key.UP);
              user.y = obj.y - Constants.PLAYER_H + obj.top;
            } else {
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
      for (const obj of this.state.level.collidables) {
        if (this.checkCollision(user, obj) && !(obj instanceof PlayerBlock)) {
          if (obj instanceof ScoringArea) {
            if (obj.team === this.state.user_team) {
              for (const flag of this.state.flags) {
                if (flag.holding_id === this.state.user_id) {
                  this.scoreFlag(flag);
                }
              }
            }
          } else if (obj instanceof Flag) {
            if (obj.holding_id === null && obj.team !== this.state.user_team) {
              obj.holding_id = this.state.user_id;
              this.takeFlag(obj);
            }
          } else {
            if (user.dx > 0) {
              user.x = obj.x - Constants.PLAYER_W + user.right + obj.left;
            }
            else {
              user.x = obj.x + obj.w - user.left - obj.right;
            }
          }
        }
      }
    }

    const draw = () => {
      const ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
      const gs = this.state;
      ctx.fillStyle = 'rgb(139, 206, 210)';
      ctx.fillRect(0, 0, Constants.W, Constants.H);
      ctx.fillStyle = 'rgb(0, 0, 0)';
      const user = this.state.userState;

      for (const obj of this.state.level.collidables) {
        if (obj instanceof PlayerBlock)
          ctx.drawImage(this.spriteSheet, Constants.PLAYER_W * (5 + obj.team), 0, Constants.PLAYER_W, Constants.PLAYER_H,
            obj.x - Camera.x, obj.y - Camera.y, Constants.PLAYER_W, Constants.PLAYER_H);
        if (obj instanceof Block)
          ctx.fillRect(obj.x - Camera.x, obj.y - Camera.y, obj.w, obj.h);
        if (obj instanceof Spike)
          ctx.drawImage(this.spriteSheet, Constants.PLAYER_W * 4, 0, Constants.PLAYER_W, Constants.PLAYER_H,
            obj.x - Camera.x, obj.y - Camera.y, Constants.PLAYER_W, Constants.PLAYER_H);
        if (obj instanceof Flag && obj.holding_id == null) {
          ctx.drawImage(this.spriteSheet, Constants.PLAYER_W * (2 + obj.team), 0, Constants.PLAYER_W, Constants.PLAYER_H,
            obj.x - Camera.x, obj.y - Camera.y, Constants.PLAYER_W, Constants.PLAYER_H);
        }
        if (obj instanceof ScoringArea) {
          ctx.drawImage(this.spriteSheet, Constants.PLAYER_W * (5 + obj.team), Constants.PLAYER_H, Constants.PLAYER_W, Constants.PLAYER_H,
            obj.x - Camera.x, obj.y - Camera.y, Constants.PLAYER_W, Constants.PLAYER_H);
        }
      }

      if (user.x_dir === -1) {
        ctx.translate(Math.floor(user.x) + Constants.PLAYER_W - Camera.x, Math.floor(user.y) - Camera.y);
        ctx.scale(-1, 1);
        if (user.dx != 0) {
          user.frame = Math.floor(user.tick / 5) % 4;
          ctx.drawImage(this.spriteSheet, user.frame * Constants.PLAYER_W, Constants.PLAYER_H * (2 + user.team),
            Constants.PLAYER_W, Constants.PLAYER_H, 0, 0,
            Constants.PLAYER_W, Constants.PLAYER_H);
        }
        else {
          ctx.drawImage(this.spriteSheet, 0, Constants.PLAYER_H * user.team, Constants.PLAYER_W, Constants.PLAYER_H,
            0, 0, Constants.PLAYER_W, Constants.PLAYER_H);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      else {
        if (user.dx != 0) {
          user.frame = Math.floor(user.tick / 5) % 4;
          ctx.drawImage(this.spriteSheet, user.frame * Constants.PLAYER_W, Constants.PLAYER_H * (2 + user.team), Constants.PLAYER_W, Constants.PLAYER_H, Math.floor(user.x) - Camera.x, Math.floor(user.y) - Camera.y, Constants.PLAYER_W, Constants.PLAYER_H);
        }
        else {
          ctx.drawImage(this.spriteSheet, 0, Constants.PLAYER_H * user.team, Constants.PLAYER_W, Constants.PLAYER_H, Math.floor(user.x) - Camera.x, Math.floor(user.y) - Camera.y, Constants.PLAYER_W, Constants.PLAYER_H);
        }
      }
      for (const flag of this.state.flags) {
        if (flag.holding_id === this.state.user_id) {
          ctx.drawImage(this.spriteSheet, Constants.PLAYER_W * (2 + flag.team), 0, Constants.PLAYER_W, Constants.PLAYER_H, Math.floor(user.x) - Camera.x, Math.floor(user.y) - Camera.y - Constants.PLAYER_H, Constants.PLAYER_W, Constants.PLAYER_H);
        }
      }
      for (const player of this.state.nonUserStates) {
        for (const flag of this.state.flags) {
          if (flag.holding_id === player.id) {
            ctx.drawImage(this.spriteSheet, Constants.PLAYER_W * (2 + flag.team), 0, Constants.PLAYER_W, Constants.PLAYER_H, Math.floor(player.x) - Camera.x, Math.floor(player.y) - Camera.y - Constants.PLAYER_H, Constants.PLAYER_W, Constants.PLAYER_H);
          }
        }
        ctx.fillRect(Math.floor(player.x) - Camera.x, Math.floor(player.y) - Camera.y, Constants.PLAYER_W, Constants.PLAYER_H);
      }

      let scoreText = "";
      for (let i = 0; i < Constants.TEAMS; i++) {
        scoreText += `Team ${Constants.TEAM_NAMES[i]} score: ${this.state.scores[i]}\n`;
      }

      ctx.font = '64px PixelFont';
      ctx.textBaseline = 'top';
      let textPadding = {
        x: 10,
        y: 0
      };

      let team0Score = `${this.state.scores[0]}`;
      ctx.fillStyle = 'rgb(255, 255, 255)';
      ctx.fillText(team0Score, textPadding.x, textPadding.y);

      let team1Score = `${this.state.scores[1]}`;
      ctx.fillStyle = 'rgb(172, 35, 48)';
      ctx.fillText(team1Score, Constants.W - ctx.measureText(team1Score).width - textPadding.x, textPadding.y);
    }

    const Key = {
      _pressed: {},

      SPACE: 32,
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,

      isDown: function (keyCode: number) {
        return this._pressed[keyCode];
      },

      onKeydown: (event: KeyboardEvent) => {
        if (event.keyCode == Key.SPACE) {
          this.sudoku();
        }
        Key._pressed[event.keyCode] = true;
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
      if (user.y < 0) {
        user.dy = 0;
        user.y = 0;
      }
      if (user.y >= Constants.LEVEL_H - Constants.PLAYER_H) {
        user.dy = 0;
        user.y = Constants.LEVEL_H - Constants.PLAYER_H;
        user.can_jump = !Key.isDown(Key.UP);
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
        user.dx *= 0.9;
        if (Math.abs(user.dx) < 1) {
          user.dx = 0;
        }
      }
      collisions();
      check_bounds(user);
      user.dy += 0.7;

      if (this.state.deathAnimFrame === 0) {
        Camera.updateTarget(user);
      } else {
        this.state.deathAnimFrame--;
      }
      Camera.update();
    }
    const push = () => {
      this.state.roomChan.push("update_player", new PlayerData(
        this.state.userState.x,
        this.state.userState.y,
        this.state.user_id,
        this.state.user_team,
        this.state.user_nickname))
    }
    setInterval(() => {
      update();
      draw();
      push();
    }, 1000 / this.state.fps);
  }
}