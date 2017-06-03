"use strict";
import {
  Socket
} from "phoenix"

class App {

  public static init() {
    const user_id = Math.floor(Math.random()*10000);
    let socket = new Socket("/socket", {
      params: {id: user_id}
    })

    socket.connect();

    const chan = socket.channel("rooms:lobby", {})
    chan.join().receive("ignore", () => console.log("auth error"))
               .receive("ok", () => {console.log("join ok")})
    chan.onError(e => console.log("something went wrong", e))
    // chan.onClose(e => console.log("channel closed", e))

    const c = <HTMLCanvasElement>document.getElementById("gameCanvas");
    const ctx = c.getContext("2d") as CanvasRenderingContext2D;

    const sheet = new Image();
    sheet.src = "images/sheet.png";

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

    let can_jump = false;
    let x = 0, y = 0, xx = 0, yy = 0;
    let x_dir = 1;
    let tick = 0;
    let frame = 0;
    let dx = 0, dy = 0;
    const fps = 60;

    function run() {
      update();
      draw();
      push();
    };

    // Start the game loop
    setInterval(run, 1000 / fps);

    const jump_v = 12;
    const v = 4;

    const update = () => {
      tick += 1;
      dx = 0;
      if (Key.isDown(Key.UP) && can_jump) {
        dy = -jump_v;
        can_jump = false;
      }
      if (Key.isDown(Key.LEFT)) {
        dx = -v;
        x_dir = -1;
      }
      if (Key.isDown(Key.RIGHT)) {
        dx = v;
        x_dir = 1;
      }
      collisions();
      dy += 0.7;

      if (y > 480 - 32) {
        dy = 0;
        y = 480 - 32;
        can_jump = true;
      }
    }

    function colliding() {
      if (x >= xx + 32 || x + 32 <= xx) return false;
      if (y >= yy + 32 || y + 32 <= yy) return false;
      return true;
    }

    function collisions() {
      y += dy;
      if (colliding()) {
        y -= dy;
        if (!colliding()) {
          y += dy;
          if (dy > 0) {
            dy = 0;
            can_jump = true;
            y = yy - 32;
          }
          else {
            y = yy + 32;
          }
        }
        else {
          y += dy;
        }
      }
      x += dx;
    }

    function draw() {
      ctx.fillStyle = 'rgb(255, 255, 255)';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = 'rgb(0, 0, 0)';
      if (x_dir == -1) {
        ctx.translate(x + 32, y);
        ctx.scale(-1, 1);
        if (dx != 0) {
          frame = Math.floor(tick / 5) % 4;
          ctx.drawImage(sheet, frame * 32, 32, 32, 32, 0, 0, 32, 32);
        }
        else {
          ctx.drawImage(sheet, 0, 0, 32, 32, 0, 0, 32, 32);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      else {
        if (dx != 0) {
          frame = Math.floor(tick / 5) % 4;
          ctx.drawImage(sheet, frame * 32, 32, 32, 32, x, y, 32, 32);
        }
        else {
          ctx.drawImage(sheet, 0, 0, 32, 32, x, y, 32, 32);
        }
      }
      ctx.fillRect(xx, yy, 32, 32);
    }

    function push() {
      chan.push("new:msg", {
        user: '1',
        x: x,
        y: y,
        user_id: user_id
      })
    }

    chan.on("new:msg", msg => {
      if (msg.user_id !== user_id) {
        xx = msg.x;
        yy = msg.y;
      }
    })
  }

}

App.init();

export default App