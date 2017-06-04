"use strict";
import {
  Socket, Channel
} from "phoenix"

class Constants {
  static readonly PLAYER_W = 32;
  static readonly PLAYER_H = 32;
  static readonly W = 640;
  static readonly H = 640;
  static readonly LEVEL_W = 1024;
  static readonly LEVEL_H = 1024;
}

class Camera {
  static cx = 0;
  static cy = 0;
  static targetX = 0;
  static targetY = 0;

  static update(user: PlayerState) {
    this.targetX = user.x + Constants.PLAYER_W / 2 - Constants.W / 2;
    this.targetY = user.y + Constants.PLAYER_H / 2 - Constants.H / 2;

    this.cx += (this.targetX - this.cx) * 0.1;
    this.cy += (this.targetY - this.cy) * 0.1;

    if (this.cx > Constants.LEVEL_W - Constants.W) this.cx = Constants.LEVEL_W - Constants.W;
    if (this.cx < 0) this.cx = 0;
    if (this.cy > Constants.LEVEL_H - Constants.H) this.cy = Constants.LEVEL_H - Constants.H;
    if (this.cy < 0) this.cy = 0;
  }

  static get x() {
    return Math.floor(this.cx);
  }

  static get y() {
    return Math.floor(this.cy);
  }
}

class PlayerState {
  x = 0;
  y = 0;
  left = 3;
  right = 3;
  top = 6;
  x_dir = 1;
  id = 0;
  dx = 0;
  dy = 0;
  can_jump = false;
  tick = 0;
  frame = 0;

  constructor(x: number, y: number, id: number) {
    this.x = x;
    this.y = y;
    this.id = id;
  }
}

interface Collidable {
  x: number;
  y: number;
  w: number;
  h: number;
}

class Block implements Collidable {
  x = 0;
  y = 0;
  w = Constants.PLAYER_W;
  h = Constants.PLAYER_H;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

class Level {
  collidables: Array<Collidable>;

  addDeadPlayer(x: number, y: number) {
    // todo
  }

  addBlock(x: number, y: number) {
    this.collidables.push(new Block(x, y));
  }

  create() {
    this.collidables = new Array();

    let levelImage = new Image();
    levelImage.src = "images/level.png";
    levelImage.onload = () => {
      let canvas = document.createElement("canvas");
      canvas.width = levelImage.width;
      canvas.height = levelImage.height;
      let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
      ctx.drawImage(levelImage, 0, 0, levelImage.width, levelImage.height);
      let data = ctx.getImageData(0, 0, levelImage.width, levelImage.height).data;

      for (let y = 0; y < levelImage.width; y++) {
        for (let x = 0; x < levelImage.height; x++) {
          let r = data[(x + y * levelImage.width) * 4];
          let g = data[(x + y * levelImage.width) * 4 + 1];
          let b = data[(x + y * levelImage.width) * 4 + 2];

          if (r === 0 && g === 0 && b === 0) {
            this.addBlock(x * 32, y * 32);
          }
          else if (r == 0 && g == 255 && b == 0) {

          }
        }
      }
    }
  }
}

class GameState {
  user_id: number;
  fps = 60;
  playerStates: Array<PlayerState>

  constructor(user_id: number) {
    this.user_id = user_id;
    this.playerStates = new Array(new PlayerState(0, 0, user_id));
  }
  get userState() {
    return this.playerStates.filter(x => x.id === this.user_id)[0]
  }

  get nonUserStates() {
    return this.playerStates.filter(x => x.id !== this.user_id);
  }
}

class Game {
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
    this.level.create();
  }

  private checkCollision(a: PlayerState, b: Collidable) {
    if (a.x >= b.x + b.w - a.left || a.x + Constants.PLAYER_W - a.right <= b.x) return false;
    if (a.y >= b.y + b.h - a.top || a.y + Constants.PLAYER_H <= b.y) return false;
    return true;
  }

  run(roomChan: Channel) {
    const collisions = () => {
      const gs = this.state;
      let players = gs.playerStates;
      let user = gs.userState;
      user.y += user.dy;
      for (const obj of this.level.collidables) {
        if (this.checkCollision(user, obj)) {
          if (user.dy > 0) {
            user.dy = 0;
            user.can_jump = true;
            user.y = obj.y - Constants.PLAYER_H;
          }
          else {
            user.dy = 0;
            user.y = obj.y + obj.h - user.top;
          }
        }
      }
      user.x += user.dx;
      for (const obj of this.level.collidables) {
        if (this.checkCollision(user, obj)) {
          if (user.dx > 0) {
            user.x = obj.x - Constants.PLAYER_W + user.right;
          }
          else {
            user.x = obj.x + obj.w - user.left;
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
        ctx.fillRect(obj.x - Camera.x, obj.y - Camera.y, obj.w, obj.h);
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
      user.dx = 0;
      if (Key.isDown(Key.UP) && user.can_jump) {
        user.dy = -jump_v;
        user.can_jump = false;
      }
      if (Key.isDown(Key.LEFT)) {
        user.dx = -v;
        user.x_dir = -1;
      }
      if (Key.isDown(Key.RIGHT)) {
        user.dx = v;
        user.x_dir = 1;
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
class App {
  static socket: Socket;
  static roomChan: Channel;
  static game: Game;

  private static init() {
    this.socket = new Socket("/socket", {})
    this.socket.connect();
    this.roomChan = this.socket.channel("rooms:lobby", {})
    this.roomChan.join().receive("ignore", () => console.log("auth error"))
      .receive("ok", () => { console.log("join ok") })
    this.roomChan.onError(e => console.log("something went wrong", e))
    this.roomChan.on("update_pos", (msg:{x: number, y:number, user_id: number}) => {
      if (msg.user_id === this.game.user_id) {
        return;
      }
      const changedPlayer = this.game.state.playerStates.filter(x => x.id === msg.user_id);
      if (changedPlayer.length === 1) {
        changedPlayer[0].x = msg.x;
        changedPlayer[0].y = msg.y;
      } else {
        this.game.state.playerStates.push(new PlayerState(msg.x, msg.y, msg.user_id));
      }
    });

    this.roomChan.on("remove_player", (data:{user_id: number}) => {
      const player_idx = this.game.state.playerStates.findIndex((x) => x.id === data.user_id);
      this.game.state.playerStates.splice(player_idx, 1);
    });

    this.roomChan.on("world_data", (data) => {
      for (const player of data.players) {
        this.game.state.playerStates.push(new PlayerState(player.x, player.y, -1));
      }
    })
  }

  public static run() {
    this.init();
    // chan.onClose(e => console.log("channel closed", e))

    this.game = new Game();
    const game = this.game;
    const c = game.canvas;
    const sheet = game.spriteSheet;
    const gs = game.state;

    // Start the game loop
    game.run(this.roomChan);

  }

}

App.run();

export default App