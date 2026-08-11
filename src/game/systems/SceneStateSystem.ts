import type { CaseState } from "../../core/case/CaseState";

export class SceneStateSystem {
  private lastKey = "";

  changed(state: CaseState): boolean {
    const key = JSON.stringify({
      stage: state.currentStage,
      room: state.currentRoomId,
      evidence: state.discoveredEvidenceIds,
      examined: state.examinedHotspotIds,
      facts: state.discoveredFactIds,
    });
    if (key === this.lastKey) return false;
    this.lastKey = key;
    return true;
  }
}
