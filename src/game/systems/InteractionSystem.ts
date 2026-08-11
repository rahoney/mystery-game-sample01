export class InteractionSystem {
  private locked = false;

  async run(action: () => void | Promise<void>): Promise<void> {
    if (this.locked) return;
    this.locked = true;
    try {
      await action();
    } finally {
      this.locked = false;
    }
  }
}
