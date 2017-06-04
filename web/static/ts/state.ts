import { Flag, Level } from "./entities";
import { Constants } from "./constants";
import { Channel } from "phoenix";

export class PlayerState {
  x = 0;
  y = 0;
  left = 3;
  right = 3;
  top = 6;
  x_dir = 1;
  dx = 0;
  dy = 0;
  can_jump = false;
  tick = 0;
  frame = 0;
  id = 0;
  team = 0;

  constructor(x: number, y: number, id: number, team: number) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.team = team;
  }
}

export class GameState {
  roomChan: Channel;
  user_id = 0;
  scores = [] as Array<number>;
  flags = [] as Array<Flag>;
  deathAnimFrame = 0;
  user_team = 0;
  user_nickname = "horsey";
  level: Level;
  fps = 60;
  playerStates: Array<PlayerState>

  constructor(id: number, team: number) {
    this.playerStates = new Array(new PlayerState(0, 0, id, team));
    this.user_id = id;
    this.user_team = team;

    this.scores = new Array(Constants.TEAMS);
    this.scores.fill(0);
    this.flags = new Array(Constants.TEAMS);

    this.level = new Level();
    this.level.create(this);
  }
  get userState() {
    return this.playerStates.filter(x => x.id === this.user_id)[0]
  }

  get nonUserStates() {
    return this.playerStates.filter(x => x.id !== this.user_id);
  }
}