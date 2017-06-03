"use strict";
import {
  Socket, Channel
} from "phoenix"

class GameState {
  x = 0;
  y = 0;
  xx = 0;
  yy = 0;
  can_jump = false;
  x_dir = 1;
  tick = 0;
  frame = 0;
  dx = 0;
  dy = 0;
  fps = 60;
}

class Game {
  canvas: HTMLCanvasElement;
  spriteSheet: HTMLImageElement;
  state: GameState;

  constructor() {
    this.canvas = <HTMLCanvasElement>document.getElementById("gameCanvas");
    this.spriteSheet = new Image();
    this.spriteSheet.src = "images/sheet.png";
    this.state = new GameState();
  }

  run(roomChan: Channel, user_id: number) {
    const collisions = () => {
      const gs = this.state;
      function colliding() {
        if (gs.x >= gs.xx + 32 || gs.x + 32 <= gs.xx) return false;
        if (gs.y >= gs.yy + 32 || gs.y + 32 <= gs.yy) return false;
        return true;
      }
      gs.y += gs.dy;
      if (colliding()) {
        gs.y -= gs.dy;
        if (!colliding()) {
          gs.y += gs.dy;
          if (gs.dy > 0) {
            gs.dy = 0;
            gs.can_jump = true;
            gs.y = gs.yy - 32;
          }
          else {
            gs.y = gs.yy + 32;
          }
        }
        else {
          gs.y += gs.dy;
        }
      }
      gs.x += gs.dx;
    }

    const draw = () => {
      const ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
      const gs = this.state;
      ctx.fillStyle = 'rgb(255, 255, 255)';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = 'rgb(0, 0, 0)';
      if (gs.x_dir == -1) {
        ctx.translate(gs.x + 32, gs.y);
        ctx.scale(-1, 1);
        if (gs.dx != 0) {
          gs.frame = Math.floor(gs.tick / 5) % 4;
          ctx.drawImage(this.spriteSheet, gs.frame * 32, 32, 32, 32, 0, 0, 32, 32);
        }
        else {
          ctx.drawImage(this.spriteSheet, 0, 0, 32, 32, 0, 0, 32, 32);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      else {
        if (gs.dx != 0) {
          gs.frame = Math.floor(gs.tick / 5) % 4;
          ctx.drawImage(this.spriteSheet, gs.frame * 32, 32, 32, 32, gs.x, gs.y, 32, 32);
        }
        else {
          ctx.drawImage(this.spriteSheet, 0, 0, 32, 32, gs.x, gs.y, 32, 32);
        }
      }
      ctx.fillRect(gs.xx, gs.yy, 32, 32);
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
      gs.tick += 1;
      gs.dx = 0;
      if (Key.isDown(Key.UP) && gs.can_jump) {
        gs.dy = -jump_v;
        gs.can_jump = false;
      }
      if (Key.isDown(Key.LEFT)) {
        gs.dx = -v;
        gs.x_dir = -1;
      }
      if (Key.isDown(Key.RIGHT)) {
        gs.dx = v;
        gs.x_dir = 1;
      }
      collisions();
      gs.dy += 0.7;

      if (gs.y > 480 - 32) {
        gs.dy = 0;
        gs.y = 480 - 32;
        gs.can_jump = true;
      }
    }
    const push = () => {
      roomChan.push("new:msg", {
        user: '1',
        x: this.state.x,
        y: this.state.y,
        user_id: user_id
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
  private static readonly user_id = Math.floor(Math.random()*10000);;
  private static socket: Socket;
  private static roomChan: Channel;

  private static init() {
    this.socket = new Socket("/socket", {
      params: {id: this.user_id}
    })
    this.socket.connect();
    this.roomChan = this.socket.channel("rooms:lobby", {})
    this.roomChan.join().receive("ignore", () => console.log("auth error"))
               .receive("ok", () => {console.log("join ok")})
    this.roomChan.onError(e => console.log("something went wrong", e))
  }

  public static run() {
    this.init();
    // chan.onClose(e => console.log("channel closed", e))

    const game = new Game();
    const c = game.canvas;
    const sheet = game.spriteSheet;
    const gs = game.state;




    // Start the game loop
    game.run(this.roomChan, this.user_id);


    this.roomChan.on("new:msg", msg => {
      if (msg.user_id !== this.user_id) {
        gs.xx = msg.x;
        gs.yy = msg.y;
      }
    })
  }

}

App.run();

export default App