import {Constants} from "./constants";
import { PlayerState } from "./state";

export class Camera {
  static cx = 0;
  static cy = 0;
  static targetX = 0;
  static targetY = 0;

  static update(user: PlayerState) {
    this.targetX = user.x + Constants.PLAYER_W / 2 - Constants.W / 2;
    this.targetY = user.y + Constants.PLAYER_H / 2 - Constants.H / 2;

    this.cx += (this.targetX - this.cx) * 0.1;
    this.cy += (this.targetY - this.cy) * 0.1;

    if (this.cx > Constants.LEVEL_W - Constants.W) this.cx = Constants.LEVEL_W - Constants.W;
    if (this.cx < 0) this.cx = 0;
    if (this.cy > Constants.LEVEL_H - Constants.H) this.cy = Constants.LEVEL_H - Constants.H;
    if (this.cy < 0) this.cy = 0;
  }

  static get x() {
    return Math.floor(this.cx);
  }

  static get y() {
    return Math.floor(this.cy);
  }
}