export type SfxName = "click" | "evidence" | "connection" | "danger" | "success" | "reveal";

export class SfxSystem {
  private context?: AudioContext;
  private muted = false;

  setMuted(value: boolean): void {
    this.muted = value;
  }

  isMuted(): boolean {
    return this.muted;
  }

  play(name: SfxName): void {
    if (this.muted) return;
    this.context ??= new AudioContext();
    const ctx = this.context;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(name === "danger" ? 0.14 : 0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
    gain.connect(ctx.destination);
    const notes: Record<SfxName, number[]> = {
      click: [220],
      evidence: [440, 660],
      connection: [392, 523, 659],
      danger: [160, 128],
      success: [330, 440, 660],
      reveal: [196, 294, 392, 587],
    };
    notes[name].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = name === "danger" ? "sawtooth" : "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(now + index * 0.05);
      oscillator.stop(now + 0.16 + index * 0.05);
    });
  }
}
