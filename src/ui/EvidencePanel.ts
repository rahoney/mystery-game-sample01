import type { CaseEngine } from "../core/case/CaseEngine";
import { evidenceArtwork } from "./EvidenceArtwork";
import { escapeHtml } from "./html";

export class EvidencePanel {
  constructor(private readonly engine: CaseEngine) {}

  render(selectable = false, selected: string[] = []): string {
    const state = this.engine.snapshot();
    const evidence = this.engine.evidence.owned(state.discoveredEvidenceIds);
    if (!evidence.length) return `<div class="empty-state">아직 확보한 증거가 없습니다.</div>`;
    return `<div class="evidence-grid">${evidence
      .map(
        (
          item,
        ) => `<button class="evidence-card ${selected.includes(item.id) ? "is-selected" : ""}" ${
          selectable
            ? `data-action="toggle-final-evidence" data-id="${item.id}"`
            : `data-action="evidence-detail" data-id="${item.id}"`
        }>
          <span class="evidence-card__type">${item.category}</span>
          <span class="evidence-card__art">${evidenceArtwork(item, "evidence-card__image")}</span>
          <strong>${escapeHtml(item.name)}</strong>
          <small>${escapeHtml(item.shortDescription)}</small>
        </button>`,
      )
      .join("")}</div>`;
  }
}
