import type Phaser from "phaser";
import { assetUrl } from "../assets";
import type { CaseEngine, FinalJudgement, ToastPayload } from "../core/case/CaseEngine";
import type { QuestionIntent, Stage } from "../core/case/schemas";
import type { SaveManager } from "../core/save/SaveManager";
import { createGame } from "../game/config";
import { GameBridge } from "../game/GameBridge";
import { SfxSystem, type SfxName } from "../game/systems/SfxSystem";
import { DeductionBoard, type DeductionSelection } from "./DeductionBoard";
import { DialoguePanel } from "./DialoguePanel";
import { evidenceArtwork } from "./EvidenceArtwork";
import { escapeHtml } from "./html";
import { MapPanel } from "./MapPanel";
import { NotebookPanel, type NotebookTab } from "./NotebookPanel";
import { Toast } from "./Toast";

type ModalState =
  | { type: "none" }
  | { type: "notebook"; tab: NotebookTab }
  | { type: "dialogue"; characterId: string }
  | { type: "examine"; hotspotId: string; evidenceIds: string[] }
  | { type: "evidence"; evidenceId: string }
  | { type: "stage"; stage: Stage }
  | { type: "deduction"; feedback: string }
  | { type: "ending" };

export class AppShell {
  private readonly bridge: GameBridge;
  private readonly map: MapPanel;
  private readonly dialogue: DialoguePanel;
  private readonly notebook: NotebookPanel;
  private readonly deduction: DeductionBoard;
  private readonly sfx = new SfxSystem();
  private toast!: Toast;
  private game?: Phaser.Game;
  private started = false;
  private modal: ModalState = { type: "none" };
  private deductionSelection: DeductionSelection = {
    suspectId: "",
    evidenceIds: [],
    contradictionId: "",
  };

  constructor(
    private readonly root: HTMLElement,
    private readonly engine: CaseEngine,
    private readonly save: SaveManager,
  ) {
    this.bridge = new GameBridge(engine);
    this.map = new MapPanel(engine);
    this.dialogue = new DialoguePanel(engine);
    this.notebook = new NotebookPanel(engine);
    this.deduction = new DeductionBoard(engine);
  }

  mount(): void {
    this.root.innerHTML = this.baseMarkup();
    this.toast = new Toast(this.query("#toast-host"));
    this.root.addEventListener("click", (event) => void this.handleClick(event));
    this.root.addEventListener("submit", (event) => void this.handleSubmit(event));
    this.root.addEventListener(
      "error",
      (event) => {
        const image = event.target as HTMLImageElement;
        const fallback = image.dataset?.fallback;
        if (
          image instanceof HTMLImageElement &&
          fallback &&
          image.src !== new URL(fallback, location.href).href
        ) {
          image.src = fallback;
        }
      },
      true,
    );
    this.engine.on<ToastPayload>("toast", (payload) => {
      this.toast.show(payload);
      this.sfx.play((payload.tone ?? "click") as SfxName);
    });
    this.engine.on("change", (state) => {
      this.save.save(state as ReturnType<CaseEngine["snapshot"]>);
      this.update();
    });
    this.engine.on<{ hotspot: { id: string }; evidence: Array<{ id: string }> }>(
      "examine",
      ({ hotspot, evidence }) => {
        this.modal = {
          type: "examine",
          hotspotId: hotspot.id,
          evidenceIds: evidence.map((item) => item.id),
        };
        this.sfx.play(evidence.length ? "evidence" : "click");
        this.renderModal();
      },
    );
    this.engine.on<Stage>("stage-ready", (stage) => {
      this.modal = { type: "stage", stage };
      this.sfx.play("success");
      window.setTimeout(() => this.renderModal(), 220);
    });
    this.engine.on("connection", () => this.sfx.play("connection"));
    this.engine.on("contradiction", () => this.sfx.play("danger"));
    this.engine.on("ending", () => {
      this.modal = { type: "ending" };
      this.sfx.play("reveal");
      this.renderModal();
    });
    this.showTitle();
  }

  private baseMarkup(): string {
    return `<div class="app-shell">
      <section id="title-screen" class="title-screen"></section>
      <section id="game-screen" class="game-screen" hidden>
        <header class="topbar">
          <div class="case-mark"><span>TRACE</span><small>THE LAST VISITOR</small></div>
          <div class="stage-meta"><span id="stage-kicker"></span><strong id="stage-title"></strong></div>
          <div class="objective"><span>현재 목표</span><p id="stage-objective"></p></div>
          <div class="progress-orbit" id="progress-orbit"></div>
        </header>
        <main class="workspace">
          <section class="room-view">
            <div id="phaser-stage" aria-label="조사 공간"></div>
            <div class="room-caption"><div><span id="room-name"></span><p id="room-description"></p></div><div id="hotspot-actions" class="hotspot-actions"></div></div>
          </section>
          <aside class="case-strip">
            <span class="eyebrow">CASE PULSE</span>
            <div class="metric"><strong id="metric-evidence">0</strong><small>증거</small></div>
            <div class="metric"><strong id="metric-people">0/4</strong><small>인물</small></div>
            <div class="metric metric--danger"><strong id="metric-contradictions">0</strong><small>모순</small></div>
            <div class="hint-card"><span>TIP</span><p>빛나는 영역을 클릭해 조사하세요. 찾은 증거는 사건 노트에 자동 기록됩니다.</p></div>
          </aside>
        </main>
        <footer class="command-bar">
          <nav id="map-panel" class="room-tabs"></nav>
          <nav class="main-actions">
            <button data-action="open-notebook" class="command"><span>⌘</span>사건 노트<i id="notebook-badge"></i></button>
            <button data-action="open-interview" id="interview-button" class="command"><span>◉</span>인물 인터뷰</button>
            <button data-action="open-deduction" id="deduction-button" class="command command--danger" hidden><span>◆</span>최종 추론</button>
            <button data-action="toggle-sound" class="icon-button" aria-label="소리 켜기/끄기">♪</button>
            <button data-action="reset-case" class="icon-button" aria-label="사건 초기화">↺</button>
          </nav>
        </footer>
      </section>
      <div id="modal-layer" class="modal-layer" hidden></div>
      <div id="toast-host" class="toast-host" aria-live="polite"></div>
    </div>`;
  }

  private showTitle(): void {
    const title = this.query("#title-screen");
    const hasSave = this.save.hasSave() && this.engine.snapshot().discoveredEvidenceIds.length > 0;
    title.innerHTML = `<div class="title-noise"></div><div class="title-content">
      <span class="title-eyebrow">A SPATIAL DEDUCTION GAME</span>
      <h1><em>흔적</em><small>마지막 접속자</small></h1>
      <p>${escapeHtml(this.engine.bundle.meta.premise)}</p>
      <div class="title-actions">
        <button data-action="new-game" class="button button--primary">NEW GAME</button>
        <button data-action="continue-game" class="button" ${hasSave ? "" : "disabled"}>CONTINUE</button>
      </div>
      <div class="case-file"><span>CASE 001</span><i></i><small>Seoul · 20:42 · Internal Theft</small></div>
    </div><div class="title-visual"><div class="usb-silhouette"><i></i><span></span></div><b>?</b></div>`;
  }

  private startGame(reset: boolean): void {
    if (reset) {
      this.save.clear();
      this.engine.reset();
    }
    this.started = true;
    this.query<HTMLElement>("#title-screen").hidden = true;
    this.query<HTMLElement>("#game-screen").hidden = false;
    this.game ??= createGame(this.bridge);
    this.update();
  }

  private update(): void {
    if (!this.started) return;
    const state = this.engine.snapshot();
    const stage = this.engine.currentStage();
    const room = this.engine.currentRoom();
    const progress = this.engine.stages.progress(state);
    this.text("#stage-kicker", `STAGE ${stage.id} / 5 · ${stage.subtitle}`);
    this.text("#stage-title", stage.title);
    this.text("#stage-objective", stage.objective);
    this.query("#progress-orbit").innerHTML =
      `<strong>${progress.total ? progress.met : "✓"}<small>/${progress.total || ""}</small></strong><span>조건</span>`;
    this.text("#room-name", room.name);
    this.text("#room-description", room.description);
    this.text("#metric-evidence", state.discoveredEvidenceIds.length);
    this.text("#metric-people", `${state.interviewedCharacterIds.length}/4`);
    this.text("#metric-contradictions", state.contradictionIds.length);
    this.query("#notebook-badge").textContent = String(state.discoveredEvidenceIds.length);
    this.query("#map-panel").innerHTML = this.map.render();
    this.query("#hotspot-actions").innerHTML = this.engine
      .availableHotspots()
      .map(
        (hotspot) =>
          `<button data-action="examine-hotspot" data-id="${hotspot.id}" class="${state.examinedHotspotIds.includes(hotspot.id) ? "is-done" : ""}">${state.examinedHotspotIds.includes(hotspot.id) ? "✓" : "+"} ${escapeHtml(hotspot.label)}</button>`,
      )
      .join("");
    this.query<HTMLButtonElement>("#interview-button").disabled = state.currentStage < 3;
    this.query<HTMLElement>("#deduction-button").hidden = state.currentStage < 5;
    if (this.modal.type !== "none") this.renderModal();
  }

  private async handleClick(event: Event): Promise<void> {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-action]");
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    const id = button.dataset.id ?? "";
    if (action !== "toggle-sound") this.sfx.play("click");
    switch (action) {
      case "new-game":
        this.startGame(true);
        break;
      case "continue-game":
        this.startGame(false);
        break;
      case "visit-room":
        this.engine.visitRoom(id);
        break;
      case "examine-hotspot":
        this.engine.examine(id);
        break;
      case "open-notebook":
        this.modal = { type: "notebook", tab: "evidence" };
        this.renderModal();
        break;
      case "notebook-tab":
        this.modal = { type: "notebook", tab: id as NotebookTab };
        this.renderModal();
        break;
      case "evidence-detail":
        this.modal = { type: "evidence", evidenceId: id };
        this.renderModal();
        break;
      case "open-interview":
        this.openDialogue(this.engine.bundle.characters[0].id);
        break;
      case "select-character":
        this.openDialogue(id);
        break;
      case "ask-intent": {
        if (this.modal.type !== "dialogue") break;
        await this.engine.ask(this.modal.characterId, id as QuestionIntent);
        this.renderModal();
        this.scrollDialogue();
        break;
      }
      case "present-evidence": {
        if (this.modal.type !== "dialogue") break;
        const select = this.query<HTMLSelectElement>("#evidence-select");
        if (select.value) await this.engine.presentEvidence(this.modal.characterId, select.value);
        this.renderModal();
        this.scrollDialogue();
        break;
      }
      case "present-evidence-direct": {
        if (this.modal.type !== "dialogue") break;
        await this.engine.presentEvidence(this.modal.characterId, id);
        this.renderModal();
        this.scrollDialogue();
        break;
      }
      case "advance-stage":
        this.engine.advanceStage();
        this.closeModal();
        break;
      case "open-deduction":
        this.modal = { type: "deduction", feedback: "" };
        this.renderModal();
        break;
      case "select-suspect":
        this.deductionSelection.suspectId = id;
        this.renderModal();
        break;
      case "toggle-final-evidence":
        this.toggleFinalEvidence(id);
        this.renderModal();
        break;
      case "select-final-contradiction":
        this.deductionSelection.contradictionId = id;
        this.renderModal();
        break;
      case "submit-deduction":
        this.submitDeduction();
        break;
      case "close-modal":
        this.closeModal();
        break;
      case "toggle-sound":
        this.sfx.setMuted(!this.sfx.isMuted());
        button.classList.toggle("is-muted", this.sfx.isMuted());
        break;
      case "reset-case":
        if (window.confirm("사건 진행을 모두 지우고 처음으로 돌아갈까요?")) {
          this.engine.reset();
          this.save.clear();
          this.modal = { type: "none" };
          this.started = false;
          this.game?.destroy(true);
          this.game = undefined;
          this.query<HTMLElement>("#game-screen").hidden = true;
          this.query<HTMLElement>("#title-screen").hidden = false;
          this.showTitle();
        }
        break;
    }
  }

  private async handleSubmit(event: Event): Promise<void> {
    const form = (event.target as HTMLElement).closest<HTMLFormElement>(
      '[data-form="free-question"]',
    );
    if (!form || this.modal.type !== "dialogue") return;
    event.preventDefault();
    const data = new FormData(form);
    const question = String(data.get("question") ?? "").trim();
    if (!question) return;
    await this.engine.ask(this.modal.characterId, undefined, question);
    this.renderModal();
    this.scrollDialogue();
  }

  private openDialogue(characterId: string): void {
    this.modal = { type: "dialogue", characterId };
    const state = this.engine.snapshot();
    if (!state.interviewedCharacterIds.includes(characterId))
      this.engine.startInterview(characterId);
    this.renderModal();
    this.scrollDialogue();
  }

  private renderModal(): void {
    const layer = this.query<HTMLElement>("#modal-layer");
    if (this.modal.type === "none") {
      if (this.game) this.game.input.enabled = true;
      layer.hidden = true;
      layer.innerHTML = "";
      return;
    }
    if (this.game) this.game.input.enabled = false;
    layer.hidden = false;
    let body = "";
    let className = "modal-card";
    let title = "사건 노트";
    if (this.modal.type === "notebook") body = this.notebook.render(this.modal.tab);
    else if (this.modal.type === "dialogue") {
      title = "인물 인터뷰";
      body = this.dialogue.render(this.modal.characterId);
      className += " modal-card--wide";
    } else if (this.modal.type === "evidence") {
      title = "증거 상세";
      const evidence = this.engine.evidence.get(this.modal.evidenceId);
      body = evidence
        ? `<article class="evidence-focus"><div class="evidence-object" data-kind="${evidence.category}">${evidenceArtwork(evidence, "evidence-focus__image")}</div><div><span class="eyebrow">${evidence.category} · ${evidence.importance}</span><h2>${escapeHtml(evidence.name)}</h2><p>${escapeHtml(evidence.longDescription)}</p><div class="tag-row">${evidence.tags.map((tag) => `<i>#${escapeHtml(tag)}</i>`).join("")}</div></div></article>`
        : "";
    } else if (this.modal.type === "examine") {
      title = "조사 결과";
      const actualHotspot = this.engine.bundle.rooms
        .flatMap((room) => room.hotspots)
        .find((item) => item.id === (this.modal.type === "examine" ? this.modal.hotspotId : ""));
      const found = this.modal.evidenceIds
        .map((id) => this.engine.evidence.get(id))
        .filter(Boolean);
      body = `<article class="examine-result"><span class="scan-line"></span><span class="eyebrow">EXAMINED · ${escapeHtml(actualHotspot?.label ?? "")}</span><p>${escapeHtml(actualHotspot?.examineText ?? "")}</p>${found.length ? `<div class="found-evidence">${found.map((item) => `<div class="found-evidence__art">${evidenceArtwork(item!, "found-evidence__image")}</div><span>FOUND</span><strong>${escapeHtml(item!.name)}</strong><small>${escapeHtml(item!.shortDescription)}</small>`).join("")}</div>` : `<small>이미 조사한 장소입니다. 새로운 증거는 없습니다.</small>`}</article>`;
    } else if (this.modal.type === "stage") {
      title = `STAGE ${this.modal.stage.id - 1} CLEAR`;
      body = `<div class="stage-transition"><span>${String(this.modal.stage.id).padStart(2, "0")}</span><div><em>NEXT STAGE</em><h2>${escapeHtml(this.modal.stage.title)}</h2><p>${escapeHtml(this.modal.stage.intro)}</p><button data-action="advance-stage" class="button button--primary">계속하기</button></div></div>`;
      className += " modal-card--stage";
    } else if (this.modal.type === "deduction") {
      title = "최종 추론";
      body = this.deduction.render(this.deductionSelection, this.modal.feedback);
      className += " modal-card--wide modal-card--deduction";
    } else if (this.modal.type === "ending") {
      title = "CASE CLOSED";
      body = this.endingMarkup();
      className += " modal-card--wide modal-card--ending";
    }
    layer.innerHTML = `<div class="${className}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><header class="modal-header"><span>${escapeHtml(title)}</span>${this.modal.type === "stage" || this.modal.type === "ending" ? "" : '<button data-action="close-modal" aria-label="닫기">×</button>'}</header><div class="modal-body">${body}</div></div>`;
  }

  private endingMarkup(): string {
    const state = this.engine.snapshot();
    const seconds = Math.max(
      1,
      Math.round(((state.completedAt ?? Date.now()) - state.startedAt) / 1000),
    );
    return `<div class="ending"><div class="ending-seal"><span>CASE</span><strong>CLOSED</strong><small>001</small></div><div class="ending-story"><img class="ending-cut" src="${assetUrl("assets/events/case-closed.webp")}" alt="사건 동선 재구성" /><span class="eyebrow">사건 재구성 · 20:18—20:27</span><h2>마지막 접속자는 서연이었다.</h2><ol><li><b>20:16</b> 서연은 편의점에서 홍보 자료 확인에 쓸 음료와 붉은 펜을 샀다.</li><li><b>20:18</b> 파란 카드로 사무실에 재입실했다.</li><li><b>20:20</b> USB를 연결해 홍보 캡처를 확인했고 보안 경고에 당황했다.</li><li><b>20:23</b> USB를 회의실 보관함 2B에 숨기고 열쇠를 떨어뜨렸다.</li><li><b>20:27</b> 다시 퇴실한 뒤, 처음에는 만지지 않았다고 주장했다.</li></ol><p>민수의 개인 빌드, 지연의 개인 전화, 준호의 순찰 공백은 모두 거짓말의 이유였지만 USB를 옮긴 행동은 아니었다.</p></div><div class="ending-stats"><div><strong>${state.discoveredEvidenceIds.length}</strong><span>발견 단서</span></div><div><strong>${state.interviewCount}</strong><span>인터뷰</span></div><div><strong>${state.contradictionIds.length}</strong><span>모순</span></div><div><strong>${state.incorrectAttempts}</strong><span>오답</span></div><div><strong>${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}</strong><span>플레이 시간</span></div></div><button data-action="reset-case" class="button button--primary">새 사건처럼 다시 플레이</button></div>`;
  }

  private toggleFinalEvidence(id: string): void {
    const selected = this.deductionSelection.evidenceIds;
    if (selected.includes(id))
      this.deductionSelection.evidenceIds = selected.filter((item) => item !== id);
    else if (selected.length < 4) selected.push(id);
    else
      this.toast.show({ title: "선택 제한", message: "근거는 최대 4개까지 선택할 수 있습니다." });
  }

  private submitDeduction(): void {
    const judgement: FinalJudgement = this.engine.judgeFinal(this.deductionSelection);
    if (!judgement.correct) {
      this.modal = { type: "deduction", feedback: judgement.feedback };
      this.sfx.play("danger");
      this.renderModal();
    }
  }

  private closeModal(): void {
    this.modal = { type: "none" };
    this.renderModal();
  }

  private scrollDialogue(): void {
    requestAnimationFrame(() => {
      const log = this.root.querySelector<HTMLElement>("#dialogue-log");
      if (log) log.scrollTop = log.scrollHeight;
    });
  }

  private query<T extends HTMLElement = HTMLElement>(selector: string): T {
    const found = this.root.querySelector<T>(selector);
    if (!found) throw new Error(`Element not found: ${selector}`);
    return found;
  }

  private text(selector: string, value: string | number): void {
    this.query(selector).textContent = String(value);
  }
}
