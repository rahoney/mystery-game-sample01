import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload(): void {
    this.load.image("room-office", "/assets/backgrounds/office-main.webp");
    this.load.image("room-meeting", "/assets/backgrounds/meeting-room.webp");
    this.load.image("room-lounge", "/assets/backgrounds/lounge.webp");
  }

  create(): void {
    this.scene.start("investigation");
  }
}
