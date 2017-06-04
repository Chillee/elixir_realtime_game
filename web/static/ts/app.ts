"use strict";
import {
  Socket, Channel
} from "phoenix"

import {Constants} from "./constants";
import {Camera} from "./camera";
import { GameState, PlayerState } from "./state";
import { Level, Collidable, PlayerBlock } from "./entities";
import { Game } from "./game";

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

    this.roomChan.on("update_pos", (msg: { x: number, y: number, user_id: number }) => {
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

    this.roomChan.on("remove_player", (data: { user_id: number }) => {
      const player_idx = this.game.state.playerStates.findIndex((x) => x.id === data.user_id);
      this.game.state.playerStates.splice(player_idx, 1);
    });

    this.roomChan.on("world_data", (data) => {
      for (const player of data.players) {
        this.game.level.collidables.push(new PlayerBlock(player.x, player.y));
      }
    })
  }

}

App.run();

export default App