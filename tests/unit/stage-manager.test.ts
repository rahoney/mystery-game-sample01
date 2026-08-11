import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/core/case/CaseState";
import { StageManager } from "../../src/core/stages/StageManager";
import { case001 } from "../../src/data/cases/case-001";

describe("StageManager", () => {
  it("requires every stage-one condition", () => {
    const state = createInitialState(
      case001.meta.id,
      case001.characters.map((item) => item.id),
    );
    const manager = new StageManager(case001.stages);
    state.discoveredEvidenceIds = ["empty-slot"];
    expect(manager.canClear(state)).toBe(false);
    state.discoveredEvidenceIds.push("torn-note");
    expect(manager.canClear(state)).toBe(true);
  });
});
