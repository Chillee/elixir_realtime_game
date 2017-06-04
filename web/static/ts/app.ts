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

    this.roomChan.on("update_player", (msg: PlayerData) => {
      if (msg.id === this.game.state.user_id) {
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

    this.roomChan.on("remove_player", (res) => {
      const data = res.data;
      const new_id = res.new_id;
      const player_idx = this.game.state.playerStates.findIndex((x) => x.id === data.id);
      console.log(data.id, this.game.state.user_id);
      if (data.id !== this.game.state.user_id) {
        this.game.state.playerStates.splice(player_idx, 1);
      } else {
        const new_id = Math.floor(Math.random() * 10000);
        (this.game.state.playerStates.find(x => x.id === data.id) as PlayerState).id = new_id;
        this.game.state.user_id = new_id;
      }
    });

    this.roomChan.on("init_data", (data : { blocks: Array<PlayerData>, id: number, team: number }) => {
      for (const block of data.blocks) {
        this.game.state.level.collidables.push(new PlayerBlock(block.x, block.y, block.id, block.team));
      }
      (this.game.state.playerStates.find(x => x.id === this.game.state.user_id) as PlayerState).id = data.id;
      this.game.state.user_id = data.id;

      // this.game.state.user_team = data.team;
    });

    this.roomChan.on("add_block", (data: PlayerData) => {
      this.game.state.level.collidables.push(new PlayerBlock(data.x, data.y, data.id, data.team));
    });

    this.roomChan.on("overview_data", (data : { flag_holder: Array<number | null>, score: Array<number> }) => {
      this.game.state.flag_holders = data.flag_holder;
      this.game.state.score = data.score;
    });
  }

}

App.run();

export default App