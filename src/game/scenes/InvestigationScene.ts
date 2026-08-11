import Phaser from "phaser";
import type { GameBridge } from "../GameBridge";
import { HotspotSystem } from "../systems/HotspotSystem";
import { SceneStateSystem } from "../systems/SceneStateSystem";

export class InvestigationScene extends Phaser.Scene {
  private hotspotSystem!: HotspotSystem;
  private readonly stateSystem = new SceneStateSystem();
  private backgroundObjects: Phaser.GameObjects.GameObject[] = [];
  private offChange?: () => void;

  constructor(private readonly bridge: GameBridge) {
    super("investigation");
  }

  create(): void {
    this.hotspotSystem = new HotspotSystem(this, (id) => this.bridge.engine.examine(id));
    this.offChange = this.bridge.engine.on("change", () => this.renderWorld());
    this.scale.on("resize", () => this.renderWorld(true));
    this.renderWorld(true);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.offChange?.());
  }

  private renderWorld(force = false): void {
    const state = this.bridge.engine.snapshot();
    if (!force && !this.stateSystem.changed(state)) return;
    const { width, height } = this.scale;
    this.clearBackground();
    const room = this.bridge.engine.currentRoom();
    const [dark, mid, light] = room.palette.map(
      (color) => Phaser.Display.Color.HexStringToColor(color).color,
    );
    this.cameras.main.setBackgroundColor(dark);
    const textureKey = `room-${room.id}`;
    if (this.textures.exists(textureKey)) {
      const art = this.add.image(width / 2, height / 2, textureKey).setDisplaySize(width, height);
      this.backgroundObjects.push(art);
      const grade = this.add.graphics();
      grade.fillStyle(0x07101a, 0.13).fillRect(0, 0, width, height);
      this.backgroundObjects.push(grade);
    } else {
      const graphics = this.add.graphics();
      graphics.fillGradientStyle(mid, mid, dark, dark, 1);
      graphics.fillRect(0, 0, width, height);
      this.backgroundObjects.push(graphics);
      this.drawRoom(room.id, width, height, dark, mid, light);
    }
    const vignette = this.add.graphics();
    vignette.fillStyle(0x020409, 0.16).fillRect(0, 0, width, height * 0.09);
    vignette.fillStyle(0x020409, 0.26).fillRect(0, height * 0.92, width, height * 0.08);
    this.backgroundObjects.push(vignette);
    this.hotspotSystem.render(
      this.bridge.engine.availableHotspots(),
      state.examinedHotspotIds,
      width,
      height,
    );
    this.cameras.main.fadeIn(260, 4, 7, 12);
  }

  private drawRoom(
    roomId: string,
    width: number,
    height: number,
    dark: number,
    mid: number,
    light: number,
  ): void {
    const g = this.add.graphics();
    const line = Phaser.Display.Color.IntegerToColor(light).darken(30).color;
    g.lineStyle(2, line, 0.5);
    g.fillStyle(light, 0.08);
    g.beginPath();
    g.moveTo(width * 0.08, height * 0.2);
    g.lineTo(width * 0.5, height * 0.04);
    g.lineTo(width * 0.94, height * 0.24);
    g.lineTo(width * 0.5, height * 0.48);
    g.closePath();
    g.fillPath().strokePath();
    g.fillStyle(dark, 0.45);
    g.fillRect(0, height * 0.77, width, height * 0.23);
    if (roomId === "office") {
      this.isoDesk(g, width * 0.18, height * 0.43, width * 0.25, height * 0.17, mid, light);
      this.isoDesk(g, width * 0.48, height * 0.39, width * 0.25, height * 0.17, mid, light);
      this.isoDesk(g, width * 0.33, height * 0.65, width * 0.27, height * 0.17, mid, light);
      this.windowGrid(g, width * 0.1, height * 0.08, width * 0.65, height * 0.18, light);
      g.fillStyle(0xa44a4c, 0.6).fillRect(
        width * 0.49,
        height * 0.46,
        width * 0.045,
        height * 0.025,
      );
    } else if (roomId === "meeting") {
      this.windowGrid(g, width * 0.06, height * 0.08, width * 0.66, height * 0.29, light);
      this.isoDesk(g, width * 0.25, height * 0.49, width * 0.47, height * 0.23, mid, light);
      for (let i = 0; i < 3; i += 1)
        g.fillStyle(dark, 0.7).fillRoundedRect(
          width * (0.75 + i * 0.06),
          height * 0.18,
          width * 0.05,
          height * 0.36,
          3,
        );
    } else {
      g.fillStyle(light, 0.12).fillRect(width * 0.06, height * 0.24, width * 0.38, height * 0.27);
      g.fillStyle(dark, 0.7).fillRect(width * 0.08, height * 0.33, width * 0.32, height * 0.1);
      this.isoDesk(g, width * 0.37, height * 0.52, width * 0.32, height * 0.19, mid, light);
      this.windowGrid(g, width * 0.58, height * 0.1, width * 0.34, height * 0.25, light);
    }
    this.backgroundObjects.push(g);
  }

  private isoDesk(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    mid: number,
    light: number,
  ): void {
    g.fillStyle(light, 0.34);
    g.beginPath()
      .moveTo(x, y)
      .lineTo(x + w * 0.65, y - h * 0.35)
      .lineTo(x + w, y + h * 0.22)
      .lineTo(x + w * 0.34, y + h * 0.62)
      .closePath()
      .fillPath();
    g.fillStyle(mid, 0.72).fillRect(x + w * 0.34, y + h * 0.56, w * 0.04, h * 0.8);
    g.fillRect(x + w * 0.92, y + h * 0.2, w * 0.04, h * 0.75);
  }

  private windowGrid(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
  ): void {
    g.fillStyle(0x07101b, 0.66).fillRect(x, y, w, h);
    g.lineStyle(1, color, 0.25);
    for (let i = 1; i < 8; i += 1) g.lineBetween(x + (w * i) / 8, y, x + (w * i) / 8, y + h);
    for (let i = 1; i < 3; i += 1) g.lineBetween(x, y + (h * i) / 3, x + w, y + (h * i) / 3);
    for (let i = 0; i < 19; i += 1)
      g.fillStyle(i % 3 ? 0xd8bd73 : 0x70a7ff, 0.3 + (i % 4) * 0.12).fillRect(
        x + ((i * 47) % Math.max(1, w - 10)),
        y + ((i * 29) % Math.max(1, h - 8)),
        3,
        3,
      );
  }

  private clearBackground(): void {
    this.hotspotSystem?.clear();
    for (const object of this.backgroundObjects) object.destroy();
    this.backgroundObjects = [];
  }
}
