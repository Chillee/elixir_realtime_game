"use strict";
import {
  Socket, Channel
} from "phoenix"

class PlayerState {
  x = 0;
  y = 0;
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
  user_id = Math.floor(Math.random()*10000);
  canvas: HTMLCanvasElement;
  spriteSheet: HTMLImageElement;
  state: GameState;

  constructor() {
    this.canvas = <HTMLCanvasElement>document.getElementById("gameCanvas");
    this.spriteSheet = new Image();
    this.spriteSheet.src = "images/sheet.png";
    this.state = new GameState(this.user_id);
  }

  private checkPlayerCollision(a: PlayerState, b: PlayerState): Boolean {
    if (a.x >= b.x + 32 || a.x + 32 <= b.x) return false;
    if (a.y >= b.y + 32 || a.y + 32 <= b.y) return false;
    return true;
  }

  run(roomChan: Channel) {
    const collisions = () => {
      const gs = this.state;
      let players = gs.playerStates;
      let user = gs.userState;
      user.y += user.dy;
      for (const player of gs.nonUserStates) {
        if (this.checkPlayerCollision(user, player)) {
          user.y -= user.dy;
          if (!this.checkPlayerCollision(user, player)) {
            user.y += user.dy;
            if (user.dy > 0) {
              user.dy = 0;
              user.can_jump = true;
              user.y = player.y - 32;
            }
            else {
              user.y = player.y + 32;
            }
          }
          else {
            user.y += user.dy;
          }
        }
      }
      user.x += user.dx;
    }

    const draw = () => {
      const ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
      const gs = this.state;
      ctx.fillStyle = 'rgb(255, 255, 255)';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = 'rgb(0, 0, 0)';
      const user = this.state.userState;
      if (user.x_dir == -1) {
        ctx.translate(user.x + 32, user.y);
        ctx.scale(-1, 1);
        if (user.dx != 0) {
          user.frame = Math.floor(user.tick / 5) % 4;
          ctx.drawImage(this.spriteSheet, user.frame * 32, 32, 32, 32, 0, 0, 32, 32);
        }
        else {
          ctx.drawImage(this.spriteSheet, 0, 0, 32, 32, 0, 0, 32, 32);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      else {
        if (user.dx != 0) {
          user.frame = Math.floor(user.tick / 5) % 4;
          ctx.drawImage(this.spriteSheet, user.frame * 32, 32, 32, 32, user.x, user.y, 32, 32);
        }
        else {
          ctx.drawImage(this.spriteSheet, 0, 0, 32, 32, user.x, user.y, 32, 32);
        }
      }
      for (const player of this.state.nonUserStates) {
        ctx.fillRect(player.x, player.y, 32, 32);
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

      if (user.y > 480 - 32) {
        user.dy = 0;
        user.y = 480 - 32;
        user.can_jump = true;
      }
    }
    const push = () => {
      roomChan.push("new:msg", {
        user: '1',
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
               .receive("ok", () => {console.log("join ok")})
    this.roomChan.onError(e => console.log("something went wrong", e))
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

    this.roomChan.on("new:msg", (msg:{x: number, y:number, user_id: number}) => {
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
    })
  }

}

App.run();

export default App