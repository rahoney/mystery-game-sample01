import type { DialogueState } from "./schemas";

export interface DialogueTurn {
  role: "player" | "npc";
  text: string;
  intent?: string;
}

export interface CaseState {
  version: 1;
  caseId: string;
  currentStage: number;
  pendingStage: number | null;
  currentRoomId: string;
  discoveredEvidenceIds: string[];
  discoveredFactIds: string[];
  unlockedConnectionIds: string[];
  contradictionIds: string[];
  visitedRoomIds: string[];
  examinedHotspotIds: string[];
  interviewedCharacterIds: string[];
  dialogueStates: Record<string, DialogueState>;
  conversationHistory: Record<string, DialogueTurn[]>;
  presentationCount: number;
  interviewCount: number;
  incorrectAttempts: number;
  startedAt: number;
  completedAt: number | null;
}

export function createInitialState(caseId: string, characterIds: string[]): CaseState {
  return {
    version: 1,
    caseId,
    currentStage: 1,
    pendingStage: null,
    currentRoomId: "office",
    discoveredEvidenceIds: [],
    discoveredFactIds: [],
    unlockedConnectionIds: [],
    contradictionIds: [],
    visitedRoomIds: ["office"],
    examinedHotspotIds: [],
    interviewedCharacterIds: [],
    dialogueStates: Object.fromEntries(characterIds.map((id) => [id, "neutral"])),
    conversationHistory: Object.fromEntries(characterIds.map((id) => [id, []])),
    presentationCount: 0,
    interviewCount: 0,
    incorrectAttempts: 0,
    startedAt: Date.now(),
    completedAt: null,
  };
}
