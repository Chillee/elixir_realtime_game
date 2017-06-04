export class PlayerState {
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

export class GameState {
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