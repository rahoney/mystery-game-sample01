import type { CaseEngine } from "../core/case/CaseEngine";
import { EvidencePanel } from "./EvidencePanel";
import { escapeHtml } from "./html";

export type NotebookTab = "evidence" | "characters" | "timeline" | "contradictions" | "connections";

export class NotebookPanel {
  private readonly evidence: EvidencePanel;

  constructor(private readonly engine: CaseEngine) {
    this.evidence = new EvidencePanel(engine);
  }

  render(active: NotebookTab): string {
    const tabs: Array<[NotebookTab, string]> = [
      ["evidence", "증거"],
      ["characters", "인물"],
      ["timeline", "타임라인"],
      ["contradictions", "모순"],
      ["connections", "연결된 추론"],
    ];
    return `<div class="notebook">
      <nav class="notebook-tabs">${tabs.map(([id, label]) => `<button data-action="notebook-tab" data-id="${id}" class="${id === active ? "is-active" : ""}">${label}${this.badge(id)}</button>`).join("")}</nav>
      <div class="notebook-content">${this.content(active)}</div>
    </div>`;
  }

  private badge(tab: NotebookTab): string {
    const state = this.engine.snapshot();
    const count = {
      evidence: state.discoveredEvidenceIds.length,
      characters: state.interviewedCharacterIds.length,
      timeline: state.discoveredFactIds.length,
      contradictions: state.contradictionIds.length,
      connections: state.unlockedConnectionIds.length,
    }[tab];
    return count ? `<i>${count}</i>` : "";
  }

  private content(tab: NotebookTab): string {
    const state = this.engine.snapshot();
    if (tab === "evidence") return this.evidence.render();
    if (tab === "characters")
      return `<div class="profile-grid">${this.engine.bundle.characters.map((character) => `<article class="profile-card"><img class="profile-photo" src="/assets/characters/${character.id}-neutral.webp" alt="${escapeHtml(character.name)}" /><div><h3>${character.name}</h3><p>${character.role}</p><small>${escapeHtml(character.personality)}</small><em>${state.interviewedCharacterIds.includes(character.id) ? `대화함 · ${state.dialogueStates[character.id]}` : "아직 대화하지 않음"}</em></div></article>`).join("")}</div>`;
    if (tab === "timeline") {
      const facts = this.engine.bundle.facts.filter((fact) =>
        state.discoveredFactIds.includes(fact.id),
      );
      return this.listOrEmpty(
        facts.map(
          (fact) =>
            `<article class="note-row"><span>STAGE ${fact.stage}</span><p>${escapeHtml(fact.text)}</p></article>`,
        ),
      );
    }
    if (tab === "contradictions") {
      const claims = this.engine.bundle.claims.filter((claim) =>
        state.contradictionIds.includes(claim.contradictionId),
      );
      return this.listOrEmpty(
        claims.map(
          (claim) =>
            `<article class="note-row note-row--danger"><span>증언 불일치</span><h3>${escapeHtml(claim.contradictionTitle)}</h3><blockquote>“${escapeHtml(claim.text)}”</blockquote><p>${escapeHtml(claim.explanation)}</p></article>`,
        ),
      );
    }
    const connections = this.engine.bundle.connections.filter((item) =>
      state.unlockedConnectionIds.includes(item.id),
    );
    return this.listOrEmpty(
      connections.map(
        (item) =>
          `<article class="note-row note-row--connection"><span>CONNECTION</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></article>`,
      ),
    );
  }

  private listOrEmpty(rows: string[]): string {
    return rows.length
      ? `<div class="note-list">${rows.join("")}</div>`
      : `<div class="empty-state">아직 기록이 없습니다.</div>`;
  }
}
