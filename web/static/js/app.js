"use strict";
exports.__esModule = true;
var phoenix_1 = require("phoenix");
var App = (function () {
    function App() {
    }
    App.init = function () {
        var user_id = Math.floor(Math.random() * 10000);
        var socket = new phoenix_1.Socket("/socket", {
            params: { id: user_id }
        });
        socket.connect();
        var chan = socket.channel("rooms:lobby", {});
        console.log(chan);
        chan.join().receive("ignore", function () { return console.log("auth error"); })
            .receive("ok", function (x) { console.log("join ok"); console.log(x); });
        chan.onError(function (e) { return console.log("something went wrong", e); });
        chan.onClose(function (e) { return console.log("channel closed", e); });
        var c = document.getElementById("gameCanvas");
        var ctx = c.getContext("2d");
        var sheet = new Image();
        sheet.src = "images/sheet.png";
        var Key = {
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
        var can_jump = false;
        var x, y, xx, yy;
        var x_dir = 1;
        var tick = 0;
        var frame = 0;
        var dx = 0, dy = 0;
        x = y = xx = yy = 0;
        var fps = 60;
        function run() {
            update();
            draw();
            push();
        }
        ;
        // Start the game loop
        setInterval(run, 1000 / fps);
        var jump_v = 12;
        var v = 4;
        function update() {
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
            if (x >= xx + 32 || x + 32 <= xx)
                return false;
            if (y >= yy + 32 || y + 32 <= yy)
                return false;
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
            });
        }
        chan.on("new:msg", function (msg) {
            if (msg.user_id !== user_id) {
                xx = msg.x;
                yy = msg.y;
            }
        });
    };
    return App;
}());
App.init();
exports["default"] = App;
