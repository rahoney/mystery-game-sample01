import { MockDialogueProvider } from "../../dialogue/MockDialogueProvider";
import type { QuestionIntent } from "./schemas";
import { ConnectionEngine } from "../evidence/ConnectionEngine";
import { EvidenceManager } from "../evidence/EvidenceManager";
import { StageManager } from "../stages/StageManager";
import type { DialogueTurn } from "./CaseState";
import { createInitialState, type CaseState } from "./CaseState";
import type { CaseBundle, Hotspot } from "./schemas";

export type EngineEventName =
  "change" | "toast" | "stage-ready" | "examine" | "connection" | "contradiction" | "ending";

export interface ToastPayload {
  title: string;
  message: string;
  tone?: "normal" | "evidence" | "connection" | "danger" | "success";
}

export interface FinalSubmission {
  suspectId: string;
  evidenceIds: string[];
  contradictionId: string;
}

export interface FinalJudgement {
  correct: boolean;
  feedback: string;
  signals: { suspect: boolean; evidence: boolean; contradiction: boolean };
}

export class CaseEngine extends EventTarget {
  readonly evidence: EvidenceManager;
  readonly connections: ConnectionEngine;
  readonly stages: StageManager;
  readonly dialogue: MockDialogueProvider;
  private state: CaseState;

  constructor(
    readonly bundle: CaseBundle,
    savedState?: CaseState | null,
  ) {
    super();
    this.evidence = new EvidenceManager(bundle);
    this.connections = new ConnectionEngine(bundle);
    this.stages = new StageManager(bundle.stages);
    this.dialogue = new MockDialogueProvider(bundle);
    this.state =
      savedState ??
      createInitialState(
        bundle.meta.id,
        bundle.characters.map((item) => item.id),
      );
  }

  on<T>(name: EngineEventName, listener: (payload: T) => void): () => void {
    const wrapped = (event: Event) => listener((event as CustomEvent<T>).detail);
    this.addEventListener(name, wrapped);
    return () => this.removeEventListener(name, wrapped);
  }

  private emit<T>(name: EngineEventName, payload: T): void {
    this.dispatchEvent(new CustomEvent(name, { detail: payload }));
  }

  snapshot(): CaseState {
    return structuredClone(this.state);
  }

  reset(): void {
    this.state = createInitialState(
      this.bundle.meta.id,
      this.bundle.characters.map((item) => item.id),
    );
    this.emit("change", this.snapshot());
  }

  currentStage() {
    return this.stages.get(this.state.currentStage);
  }

  currentRoom() {
    return (
      this.bundle.rooms.find((room) => room.id === this.state.currentRoomId) ?? this.bundle.rooms[0]
    );
  }

  availableHotspots(roomId = this.state.currentRoomId): Hotspot[] {
    const room = this.bundle.rooms.find((item) => item.id === roomId);
    if (!room) return [];
    return room.hotspots.filter(
      (hotspot) =>
        this.state.currentStage >= hotspot.minStage &&
        this.state.currentStage <= hotspot.maxStage &&
        hotspot.requiresEvidenceIds.every((id) => this.state.discoveredEvidenceIds.includes(id)) &&
        hotspot.requiresFactIds.every((id) => this.state.discoveredFactIds.includes(id)),
    );
  }

  visitRoom(roomId: string): void {
    if (!this.currentStage().unlockedRooms.includes(roomId)) return;
    this.state.currentRoomId = roomId;
    if (!this.state.visitedRoomIds.includes(roomId)) this.state.visitedRoomIds.push(roomId);
    this.commit();
  }

  examine(hotspotId: string): void {
    const hotspot = this.availableHotspots().find((item) => item.id === hotspotId);
    if (!hotspot) return;
    if (!this.state.examinedHotspotIds.includes(hotspotId))
      this.state.examinedHotspotIds.push(hotspotId);
    const newlyAcquired = hotspot.grantsClueIds.filter(
      (id) => !this.state.discoveredEvidenceIds.includes(id),
    );
    this.state.discoveredEvidenceIds.push(...newlyAcquired);
    this.emit("examine", {
      hotspot,
      evidence: newlyAcquired.map((id) => this.evidence.get(id)).filter(Boolean),
    });
    for (const id of newlyAcquired) {
      const item = this.evidence.get(id);
      if (item)
        this.emit<ToastPayload>("toast", {
          title: "새로운 증거",
          message: item.name,
          tone: "evidence",
        });
    }
    this.resolveConnections();
    this.commit();
  }

  startInterview(characterId: string): string {
    if (this.state.currentStage < 3) return "아직 사람들의 증언을 들을 때가 아니다.";
    if (!this.state.interviewedCharacterIds.includes(characterId))
      this.state.interviewedCharacterIds.push(characterId);
    this.state.interviewCount += 1;
    const greeting = this.dialogue.greeting(characterId, this.state.dialogueStates[characterId]);
    this.pushTurn(characterId, { role: "npc", text: greeting });
    this.commit();
    return greeting;
  }

  async ask(characterId: string, intent?: QuestionIntent, freeText?: string): Promise<string> {
    const playerText = freeText?.trim() || this.questionLabel(intent ?? "OTHER");
    this.pushTurn(characterId, { role: "player", text: playerText, intent });
    this.state.interviewCount += 1;
    const result = await this.dialogue.respond({
      characterId,
      freeText,
      questionIntent: intent,
      presentedEvidenceIds: [],
      discoveredFactIds: [...this.state.discoveredFactIds],
      conversationHistory: [...this.state.conversationHistory[characterId]],
      currentDialogueState: this.state.dialogueStates[characterId],
    });
    this.state.dialogueStates[characterId] = result.nextState;
    const text = result.suggestion ? `${result.text}\n${result.suggestion}` : result.text;
    this.pushTurn(characterId, { role: "npc", text, intent: result.intent });
    this.commit();
    return text;
  }

  async presentEvidence(characterId: string, evidenceId: string): Promise<string> {
    const evidence = this.evidence.get(evidenceId);
    if (!evidence || !this.state.discoveredEvidenceIds.includes(evidenceId))
      return "아직 소유하지 않은 증거입니다.";
    this.pushTurn(characterId, { role: "player", text: `[증거 제시] ${evidence.name}` });
    this.state.presentationCount += 1;
    this.state.interviewCount += 1;
    const result = await this.dialogue.respond({
      characterId,
      questionIntent: "OBJECT",
      presentedEvidenceIds: [evidenceId],
      discoveredFactIds: [...this.state.discoveredFactIds],
      conversationHistory: [...this.state.conversationHistory[characterId]],
      currentDialogueState: this.state.dialogueStates[characterId],
    });
    const previousState = this.state.dialogueStates[characterId];
    this.state.dialogueStates[characterId] = result.nextState;
    if (result.unlockFactId && !this.state.discoveredFactIds.includes(result.unlockFactId))
      this.state.discoveredFactIds.push(result.unlockFactId);
    if (result.contradictionId && !this.state.contradictionIds.includes(result.contradictionId)) {
      this.state.contradictionIds.push(result.contradictionId);
      const claim = this.bundle.claims.find(
        (item) => item.contradictionId === result.contradictionId,
      );
      this.emit("contradiction", claim);
      this.emit<ToastPayload>("toast", {
        title: "증언 불일치",
        message: claim?.contradictionTitle ?? result.contradictionId,
        tone: "danger",
      });
    }
    if (previousState !== result.nextState)
      this.emit<ToastPayload>("toast", {
        title: "태도 변화",
        message: `${this.characterName(characterId)} · ${this.stateLabel(result.nextState)}`,
        tone: "connection",
      });
    this.pushTurn(characterId, { role: "npc", text: result.text, intent: result.intent });
    this.resolveConnections();
    this.commit();
    return result.text;
  }

  advanceStage(): boolean {
    if (this.state.pendingStage !== this.state.currentStage + 1) return false;
    this.state.currentStage += 1;
    this.state.pendingStage = null;
    const stage = this.currentStage();
    if (!stage.unlockedRooms.includes(this.state.currentRoomId))
      this.state.currentRoomId = stage.unlockedRooms[0];
    this.emit<ToastPayload>("toast", {
      title: `STAGE ${stage.id}`,
      message: stage.title,
      tone: "success",
    });
    this.emit("change", this.snapshot());
    return true;
  }

  judgeFinal(submission: FinalSubmission): FinalJudgement {
    const suspect = submission.suspectId === this.bundle.meta.culpritId;
    const selected = new Set(submission.evidenceIds);
    const evidence =
      submission.evidenceIds.length >= 2 &&
      submission.evidenceIds.length <= 4 &&
      this.bundle.meta.finalRequiredEvidenceIds.filter((id) => selected.has(id)).length >= 2;
    const contradiction = this.bundle.meta.finalRequiredContradictionIds.includes(
      submission.contradictionId,
    );
    const correct = suspect && evidence && contradiction;
    let feedback = "사건의 인물과 물증, 모순이 모두 맞물립니다.";
    if (!suspect && evidence)
      feedback = "물증의 방향은 정확하지만 선택한 인물의 동선과 연결되지 않습니다.";
    else if (suspect && !evidence)
      feedback = "인물은 맞지만 근거가 약합니다. 재입실과 USB 발견 위치를 함께 설명해 보세요.";
    else if (suspect && evidence && !contradiction)
      feedback = "거의 완성됐습니다. ‘만지지 않았다’는 진술을 무너뜨린 모순이 필요합니다.";
    else if (!suspect && !evidence)
      feedback = "현재 설명은 인물과 물증이 모두 느슨합니다. 시간순 연결 카드를 다시 검토하세요.";
    if (correct) {
      this.state.completedAt = Date.now();
      this.emit("ending", { submission });
    } else {
      this.state.incorrectAttempts += 1;
    }
    this.emit("change", this.snapshot());
    return { correct, feedback, signals: { suspect, evidence, contradiction } };
  }

  private pushTurn(characterId: string, turn: DialogueTurn): void {
    this.state.conversationHistory[characterId] ??= [];
    this.state.conversationHistory[characterId].push(turn);
  }

  private resolveConnections(): void {
    const unlocked = this.connections.newlyUnlocked(
      this.state.discoveredEvidenceIds,
      this.state.unlockedConnectionIds,
    );
    for (const connection of unlocked) {
      this.state.unlockedConnectionIds.push(connection.id);
      if (!this.state.discoveredFactIds.includes(connection.unlocksFactId))
        this.state.discoveredFactIds.push(connection.unlocksFactId);
      this.emit("connection", connection);
      this.emit<ToastPayload>("toast", {
        title: "연결된 추론",
        message: connection.title,
        tone: "connection",
      });
    }
  }

  private commit(): void {
    if (this.stages.canClear(this.state) && this.state.pendingStage === null) {
      this.state.pendingStage = this.state.currentStage + 1;
      this.emit("stage-ready", this.stages.get(this.state.pendingStage));
    }
    this.emit("change", this.snapshot());
  }

  private questionLabel(intent: QuestionIntent): string {
    const labels: Record<QuestionIntent, string> = {
      LOCATION: "당시 어디 있었나요?",
      USB: "USB를 본 적 있나요?",
      OBJECT: "이 물건을 아나요?",
      PERSON: "다른 사람을 봤나요?",
      TIMELINE: "시간 순서대로 말해 주세요.",
      ALIBI: "알리바이를 증명할 수 있나요?",
      MOTIVE: "USB를 옮길 이유가 있었나요?",
      OTHER: "다른 질문",
    };
    return labels[intent];
  }

  private characterName(characterId: string): string {
    return this.bundle.characters.find((item) => item.id === characterId)?.name ?? characterId;
  }

  private stateLabel(state: string): string {
    return (
      { neutral: "평온", evasive: "회피", pressured: "압박", cracked: "무너짐" }[state] ?? state
    );
  }
}
