import Phaser from "phaser";
import type { Hotspot } from "../../core/case/schemas";

export class HotspotSystem {
  private objects: Phaser.GameObjects.GameObject[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onExamine: (id: string) => void,
  ) {}

  render(hotspots: Hotspot[], examinedIds: string[], width: number, height: number): void {
    this.clear();
    for (const hotspot of hotspots) {
      const x = (hotspot.x / 100) * width;
      const y = (hotspot.y / 100) * height;
      const w = (hotspot.width / 100) * width;
      const h = (hotspot.height / 100) * height;
      const examined = examinedIds.includes(hotspot.id);
      const color = Phaser.Display.Color.HexStringToColor(hotspot.accent ?? "#e7c776").color;
      const zone = this.scene.add
        .rectangle(x, y, w, h, color, examined ? 0.04 : 0.08)
        .setStrokeStyle(examined ? 1 : 2, color, examined ? 0.35 : 0.85)
        .setInteractive({ useHandCursor: true });
      const dot = this.scene.add
        .circle(x, y - h / 2 - 8, examined ? 3 : 5, color, examined ? 0.45 : 1)
        .setStrokeStyle(2, 0x081019, 0.8);
      const label = this.scene.add
        .text(x, y - h / 2 - 21, examined ? `✓ ${hotspot.label}` : hotspot.label, {
          fontFamily: "Pretendard, Inter, sans-serif",
          fontSize: "13px",
          color: "#f7f1de",
          backgroundColor: "#070b11dd",
          padding: { x: 8, y: 5 },
        })
        .setOrigin(0.5, 1)
        .setAlpha(examined ? 0.5 : 0);
      if (!examined) {
        this.scene.tweens.add({
          targets: dot,
          scale: { from: 0.75, to: 1.3 },
          alpha: { from: 0.45, to: 1 },
          yoyo: true,
          repeat: -1,
          duration: 900,
          ease: "Sine.InOut",
        });
      }
      zone.on("pointerover", () => {
        label.setAlpha(1);
        zone.setFillStyle(color, 0.18);
      });
      zone.on("pointerout", () => {
        label.setAlpha(examined ? 0.5 : 0);
        zone.setFillStyle(color, examined ? 0.04 : 0.08);
      });
      zone.on("pointerdown", () => this.onExamine(hotspot.id));
      this.objects.push(zone, dot, label);
    }
  }

  clear(): void {
    for (const object of this.objects) object.destroy();
    this.objects = [];
  }
}
