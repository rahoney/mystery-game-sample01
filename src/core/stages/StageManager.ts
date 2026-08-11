import type { CaseState } from "../case/CaseState";
import type { DialogueState, Stage, StageCondition } from "../case/schemas";

const stateRank: Record<DialogueState, number> = {
  neutral: 0,
  evasive: 1,
  pressured: 2,
  cracked: 3,
};

export class StageManager {
  constructor(private readonly stages: Stage[]) {}

  get(id: number): Stage {
    const stage = this.stages.find((item) => item.id === id);
    if (!stage) throw new Error(`Unknown stage: ${id}`);
    return stage;
  }

  isConditionMet(condition: StageCondition, state: CaseState): boolean {
    switch (condition.type) {
      case "evidence":
        return Boolean(condition.id && state.discoveredEvidenceIds.includes(condition.id));
      case "evidenceCount":
        return state.discoveredEvidenceIds.length >= (condition.count ?? Infinity);
      case "roomsVisited":
        return state.visitedRoomIds.length >= (condition.count ?? Infinity);
      case "connectionCount":
        return state.unlockedConnectionIds.length >= (condition.count ?? Infinity);
      case "charactersInterviewed":
        return state.interviewedCharacterIds.length >= (condition.count ?? Infinity);
      case "presentationCount":
        return state.presentationCount >= (condition.count ?? Infinity);
      case "contradictionCount":
        return state.contradictionIds.length >= (condition.count ?? Infinity);
      case "dialogueState": {
        if (!condition.characterId || !condition.state) return false;
        return (
          stateRank[state.dialogueStates[condition.characterId] ?? "neutral"] >=
          stateRank[condition.state]
        );
      }
    }
  }

  progress(state: CaseState): { met: number; total: number } {
    const conditions = this.get(state.currentStage).clearConditions;
    return {
      met: conditions.filter((item) => this.isConditionMet(item, state)).length,
      total: conditions.length,
    };
  }

  canClear(state: CaseState): boolean {
    if (state.currentStage >= 5) return false;
    return this.get(state.currentStage).clearConditions.every((item) =>
      this.isConditionMet(item, state),
    );
  }
}
