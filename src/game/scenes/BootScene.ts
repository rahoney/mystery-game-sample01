import Phaser from "phaser";
import { assetUrl } from "../../assets";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload(): void {
    this.load.image("room-office", assetUrl("assets/backgrounds/office-main.webp"));
    this.load.image("room-meeting", assetUrl("assets/backgrounds/meeting-room.webp"));
    this.load.image("room-lounge", assetUrl("assets/backgrounds/lounge.webp"));
  }

  create(): void {
    this.scene.start("investigation");
  }
}
