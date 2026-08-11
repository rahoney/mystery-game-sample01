import Phaser from "phaser";
import type { GameBridge } from "./GameBridge";
import { BootScene } from "./scenes/BootScene";
import { EndingScene } from "./scenes/EndingScene";
import { InvestigationScene } from "./scenes/InvestigationScene";
import { StageTransitionScene } from "./scenes/StageTransitionScene";
import { TitleScene } from "./scenes/TitleScene";

export function createGame(bridge: GameBridge): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "phaser-stage",
    backgroundColor: "#090d14",
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, pixelArt: false, roundPixels: true },
    scene: [
      BootScene,
      TitleScene,
      new InvestigationScene(bridge),
      StageTransitionScene,
      EndingScene,
    ],
    audio: { disableWebAudio: false },
  });
}
