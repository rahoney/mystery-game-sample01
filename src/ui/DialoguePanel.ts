import type { CaseEngine } from "../core/case/CaseEngine";
import { evidenceArtwork } from "./EvidenceArtwork";
import { escapeHtml } from "./html";

const intents = [
  ["LOCATION", "당시 어디 있었나요?"],
  ["USB", "USB를 본 적 있나요?"],
  ["PERSON", "다른 사람을 봤나요?"],
  ["TIMELINE", "시간 순서를 말해 주세요"],
  ["ALIBI", "알리바이를 증명할 수 있나요?"],
  ["MOTIVE", "남아 있던 이유는?"],
] as const;

export class DialoguePanel {
  constructor(private readonly engine: CaseEngine) {}

  render(characterId: string): string {
    const state = this.engine.snapshot();
    const character = this.engine.bundle.characters.find((item) => item.id === characterId)!;
    const dialogueState = state.dialogueStates[characterId];
    const expression = {
      neutral: "neutral",
      evasive: "nervous",
      pressured: "defensive",
      cracked: "resigned",
    }[dialogueState];
    const history = state.conversationHistory[characterId] ?? [];
    const evidence = this.engine.evidence.owned(state.discoveredEvidenceIds);
    return `<div class="dialogue-layout">
      <aside class="suspect-rail" aria-label="인터뷰 대상">
        ${this.engine.bundle.characters
          .map(
            (
              item,
            ) => `<button data-action="select-character" data-id="${item.id}" class="suspect-chip ${item.id === characterId ? "is-active" : ""}">
              <span class="avatar avatar--sm" style="--avatar:${item.color}">${item.name.slice(0, 1)}</span>
              <span><strong>${item.name}</strong><small>${item.role}</small></span>
              ${state.interviewedCharacterIds.includes(item.id) ? "<i>✓</i>" : ""}
            </button>`,
          )
          .join("")}
      </aside>
      <section class="dialogue-main">
        <header class="character-header">
          <div class="portrait portrait--${dialogueState}" style="--avatar:${character.color}">
            <img src="/assets/characters/${character.id}-${expression}.webp" alt="${escapeHtml(character.name)} · ${this.stateLabel(dialogueState)}" />
          </div>
          <div><span class="eyebrow">${escapeHtml(character.role)}</span><h2>${escapeHtml(character.name)}</h2><p>${escapeHtml(character.personality)}</p></div>
          <span class="state-pill state-pill--${dialogueState}">${this.stateLabel(dialogueState)}</span>
        </header>
        <div class="dialogue-log" id="dialogue-log">
          ${
            history
              .map(
                (turn) =>
                  `<div class="dialogue-turn dialogue-turn--${turn.role}"><span>${turn.role === "npc" ? character.name : "나"}</span><p>${escapeHtml(turn.text).replaceAll("\n", "<br>")}</p></div>`,
              )
              .join("") ||
            `<div class="empty-state">대화를 시작하면 증언이 여기에 기록됩니다.</div>`
          }
        </div>
        <div class="question-row">${intents.map(([id, label]) => `<button class="chip" data-action="ask-intent" data-id="${id}">${label}</button>`).join("")}</div>
        <form class="free-question" data-form="free-question">
          <input name="question" maxlength="120" autocomplete="off" placeholder="자유롭게 질문하세요 — 예: 20시쯤 어디 있었나요?" />
          <button type="submit" class="button button--primary">질문</button>
        </form>
        <div class="present-row">
          <label>증거 제시</label>
          <div class="present-evidence-strip">${
            evidence.length
              ? evidence
                  .map(
                    (
                      item,
                    ) => `<button type="button" data-action="present-evidence-direct" data-id="${item.id}" title="${escapeHtml(item.name)}">
                      ${evidenceArtwork(item, "present-evidence-image")}<span>${escapeHtml(item.name)}</span>
                    </button>`,
                  )
                  .join("")
              : "<small>먼저 증거를 수집하세요.</small>"
          }</div>
        </div>
      </section>
    </div>`;
  }

  private stateLabel(state: string): string {
    return (
      { neutral: "평온", evasive: "회피", pressured: "압박", cracked: "무너짐" }[state] ?? state
    );
  }
}
