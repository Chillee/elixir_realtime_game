"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const phoenix_1 = require("phoenix");
const state_1 = require("./state");
const entities_1 = require("./entities");
const game_1 = require("./game");
class App {
    static init() {
        this.socket = new phoenix_1.Socket("/socket", {});
        this.socket.connect();
        this.roomChan = this.socket.channel("rooms:lobby", {});
        this.roomChan.join().receive("ignore", () => console.log("auth error"))
            .receive("ok", () => { console.log("join ok"); });
        this.roomChan.onError(e => console.log("something went wrong", e));
    }
    static run() {
        this.init();
        // chan.onClose(e => console.log("channel closed", e))
        this.game = new game_1.Game();
        const game = this.game;
        const c = game.canvas;
        const sheet = game.spriteSheet;
        const gs = game.state;
        // Start the game loop
        game.run(this.roomChan);
        this.roomChan.on("update_pos", (msg) => {
            if (msg.user_id === this.game.user_id) {
                return;
            }
            const changedPlayer = this.game.state.playerStates.filter(x => x.id === msg.user_id);
            if (changedPlayer.length === 1) {
                changedPlayer[0].x = msg.x;
                changedPlayer[0].y = msg.y;
            }
            else {
                this.game.state.playerStates.push(new state_1.PlayerState(msg.x, msg.y, msg.user_id));
            }
        });
        this.roomChan.on("remove_player", (data) => {
            const player_idx = this.game.state.playerStates.findIndex((x) => x.id === data.user_id);
            this.game.state.playerStates.splice(player_idx, 1);
        });
        this.roomChan.on("world_data", (data) => {
            for (const player of data.players) {
                this.game.level.collidables.push(new entities_1.PlayerBlock(player.x, player.y));
            }
        });
    }
}
App.run();
exports.default = App;
//# sourceMappingURL=app.js.map