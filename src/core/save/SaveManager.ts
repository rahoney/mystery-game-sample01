import type { CaseState } from "../case/CaseState";

const KEY = "trace-case-001-save-v1";

export class SaveManager {
  load(): CaseState | null {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as CaseState) : null;
    } catch {
      return null;
    }
  }

  save(state: CaseState): void {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  clear(): void {
    localStorage.removeItem(KEY);
  }

  hasSave(): boolean {
    return Boolean(localStorage.getItem(KEY));
  }
}
