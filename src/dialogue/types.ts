import type { DialogueState, QuestionIntent } from "../core/case/schemas";
import type { DialogueTurn } from "../core/case/CaseState";

export interface DialogueInput {
  characterId: string;
  freeText?: string;
  questionIntent?: QuestionIntent;
  presentedEvidenceIds: string[];
  discoveredFactIds: string[];
  conversationHistory: DialogueTurn[];
  currentDialogueState: DialogueState;
}

export interface DialogueResult {
  text: string;
  intent: QuestionIntent;
  nextState: DialogueState;
  contradictionId?: string;
  unlockFactId?: string;
  suggestion?: string;
}
