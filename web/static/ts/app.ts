"use strict";
import {
  Socket, Channel
} from "phoenix"

import {Constants} from "./constants";
import {Camera} from "./camera";
import { GameState, PlayerState } from "./state";
import { Level, Collidable, PlayerBlock } from "./entities";
import { PlayerData, Game } from "./game";

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

<<<<<<< HEAD
    this.roomChan.on("update_player", (msg: { x: number, y: number, user_id: number }) => {
      if (msg.user_id === this.game.user_id) {
=======
    this.roomChan.on("update_player", (msg: PlayerData) => {
      if (msg.id === this.game.user_id) {
>>>>>>> 4aa583152701ee424ed66831eab299c267634cb4
        return;
      }
      const changedPlayer = this.game.state.playerStates.filter(x => x.id === msg.id);
      if (changedPlayer.length === 1) {
        changedPlayer[0].x = msg.x;
        changedPlayer[0].y = msg.y;
      } else if (changedPlayer.length === 0) {
        this.game.state.playerStates.push(new PlayerState(msg.x, msg.y, msg.id, msg.team));
      }
    });

    this.roomChan.on("remove_player", (data: { user_id: number }) => {
      const player_idx = this.game.state.playerStates.findIndex((x) => x.id === data.user_id);
      this.game.state.playerStates.splice(player_idx, 1);
    });

    this.roomChan.on("init_data", (data : { blocks: Array<PlayerData>, id: number, team: number }) => {
      for (const block of data.blocks) {
        this.game.state.level.collidables.push(new PlayerBlock(block.x, block.y, block.id, block.team));
      }
<<<<<<< HEAD
=======
      this.game.state.user_id = data.id;
      this.game.state.user_team = data.team;
    });

    this.roomChan.on("add_block", (data: PlayerData) => {
      this.game.state.level.collidables.push(new PlayerBlock(data.x, data.y, data.id, data.team));
    });

    this.roomChan.on("overview_data", (data : { flag_holder: Array<number | null>, score: Array<number> }) => {
      this.game.state.flag_holders = data.flag_holder;
      this.game.state.score = data.score;
>>>>>>> 4aa583152701ee424ed66831eab299c267634cb4
    });
  }

}

App.run();

export default App