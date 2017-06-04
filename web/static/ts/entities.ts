import { Constants } from "./constants";
import { GameState } from "./state";

export interface Collidable {
  x: number;
  y: number;
  w: number;
  h: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export class Block implements Collidable {
  x = 0;
  y = 0;
  w = Constants.PLAYER_W;
  h = Constants.PLAYER_H;
  left = 0;
  right = 0;
  top = 0;
  bottom = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export class PlayerBlock implements Collidable {
  x = 0;
  y = 0;
  w = Constants.PLAYER_W;
  h = Constants.PLAYER_H;
  left = 0;
  right = 0;
  top = 0;
  bottom = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export class Spike implements Collidable {
  x = 0;
  y = 0;
  w = Constants.PLAYER_W;
  h = Constants.PLAYER_H;
  left = 0;
  right = 0;
  top = Constants.PLAYER_H / 2;
  bottom = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export class Level {
  spawnX: number;
  spawnY: number;
  collidables: Array<Collidable>;

  addDeadPlayer(x: number, y: number) {
    // todo
  }

  addBlock(x: number, y: number) {
    this.collidables.push(new Block(x, y));
  }

  addSpike(x: number, y: number) {
    this.collidables.push(new Spike(x, y));
  }

  create(gs: GameState) {
    this.collidables = new Array();

    let levelImage = new Image();
    levelImage.src = "images/level.png";
    levelImage.onload = () => {
      let canvas = document.createElement("canvas");
      canvas.width = levelImage.width;
      canvas.height = levelImage.height;
      let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
      ctx.drawImage(levelImage, 0, 0, levelImage.width, levelImage.height);
      let data = ctx.getImageData(0, 0, levelImage.width, levelImage.height).data;

      Constants.LEVEL_W = levelImage.width * 32;
      Constants.LEVEL_H = levelImage.height * 32;

      for (let y = 0; y < levelImage.height; y++) {
        for (let x = 0; x < levelImage.width; x++) {
          let r = data[(x + y * levelImage.width) * 4];
          let g = data[(x + y * levelImage.width) * 4 + 1];
          let b = data[(x + y * levelImage.width) * 4 + 2];

          if (r === 0 && g === 0 && b === 0) {
            this.addBlock(x * 32, y * 32);
          }
          if (r === 0 && g === 255 && b === 0) {
            this.spawnX = x * 32;
            this.spawnY = y * 32;
            gs.userState.x = x * 32;
            gs.userState.y = y * 32;
          }
          if (r === 255 && g === 0 && b === 0) {
            this.addSpike(x * 32, y * 32);
          }
        }
      }
    }
  }
}