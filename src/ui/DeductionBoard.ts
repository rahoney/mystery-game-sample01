import type { CaseEngine } from "../core/case/CaseEngine";
import { EvidencePanel } from "./EvidencePanel";
import { escapeHtml } from "./html";

export interface DeductionSelection {
  suspectId: string;
  evidenceIds: string[];
  contradictionId: string;
}

export class DeductionBoard {
  private readonly evidence: EvidencePanel;
  constructor(private readonly engine: CaseEngine) {
    this.evidence = new EvidencePanel(engine);
  }

  render(selection: DeductionSelection, feedback = ""): string {
    const state = this.engine.snapshot();
    const contradictions = this.engine.bundle.claims.filter((claim) =>
      state.contradictionIds.includes(claim.contradictionId),
    );
    return `<div class="deduction-board">
      <section><span class="eyebrow">1 · 인물 선택</span><div class="suspect-grid">${this.engine.bundle.characters.map((character) => `<button class="suspect-card ${selection.suspectId === character.id ? "is-selected" : ""}" data-action="select-suspect" data-id="${character.id}"><span class="avatar" style="--avatar:${character.color}">${character.name.slice(0, 1)}</span><strong>${character.name}</strong><small>${character.role}</small></button>`).join("")}</div></section>
      <section><span class="eyebrow">2 · 근거 2–4개</span>${this.evidence.render(true, selection.evidenceIds)}<small class="selection-count">선택 ${selection.evidenceIds.length} / 4</small></section>
      <section><span class="eyebrow">3 · 결정적 모순</span><div class="contradiction-options">${contradictions.map((claim) => `<button data-action="select-final-contradiction" data-id="${claim.contradictionId}" class="${selection.contradictionId === claim.contradictionId ? "is-selected" : ""}"><strong>${escapeHtml(claim.contradictionTitle)}</strong><small>${escapeHtml(claim.text)}</small></button>`).join("")}</div></section>
      ${feedback ? `<div class="deduction-feedback">${escapeHtml(feedback)}</div>` : ""}
      <footer><button data-action="close-modal" class="button">재검토</button><button data-action="submit-deduction" class="button button--danger" ${selection.suspectId && selection.evidenceIds.length >= 2 && selection.contradictionId ? "" : "disabled"}>추론 제출</button></footer>
    </div>`;
  }
}
