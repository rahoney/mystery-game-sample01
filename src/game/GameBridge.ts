import type { CaseEngine } from "../core/case/CaseEngine";

export class GameBridge extends EventTarget {
  constructor(readonly engine: CaseEngine) {
    super();
  }

  refresh(): void {
    this.dispatchEvent(new Event("refresh"));
  }

  onRefresh(handler: () => void): () => void {
    this.addEventListener("refresh", handler);
    return () => this.removeEventListener("refresh", handler);
  }
}
