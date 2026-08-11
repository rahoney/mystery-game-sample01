import { beforeEach, describe, expect, it } from "vitest";
import { CaseEngine } from "../../src/core/case/CaseEngine";
import { case001 } from "../../src/data/cases/case-001";

describe("CaseEngine full deterministic path", () => {
  let engine: CaseEngine;
  beforeEach(() => {
    engine = new CaseEngine(case001);
  });

  it("acquires evidence and unlocks a connection", () => {
    engine.examine("usb-dock");
    engine.examine("note-bin");
    engine.examine("desk-floor");
    engine.advanceStage();
    engine.visitRoom("meeting");
    engine.examine("meeting-table");
    expect(engine.snapshot().discoveredEvidenceIds).toContain("locker-tag");
    expect(engine.snapshot().unlockedConnectionIds).toContain("connection-2b");
  });

  it("plays all five stages, supports retry, and closes the case", async () => {
    engine.examine("usb-dock");
    engine.examine("note-bin");
    engine.examine("desk-floor");
    expect(engine.snapshot().pendingStage).toBe(2);
    engine.advanceStage();
    engine.visitRoom("meeting");
    engine.examine("meeting-table");
    engine.examine("meeting-cup");
    engine.visitRoom("lounge");
    engine.examine("lounge-counter");
    expect(engine.snapshot().pendingStage).toBe(3);
    engine.advanceStage();
    for (const id of ["minsu", "jiyeon", "junho", "seoyeon"]) engine.startInterview(id);
    await engine.presentEvidence("seoyeon", "blue-card");
    await engine.presentEvidence("seoyeon", "locker-tag");
    expect(engine.snapshot().pendingStage).toBe(4);
    engine.advanceStage();
    engine.visitRoom("lounge");
    engine.examine("cup-return");
    engine.visitRoom("meeting");
    engine.examine("locker-2b");
    await engine.presentEvidence("seoyeon", "usb-red");
    expect(engine.snapshot().dialogueStates.seoyeon).toBe("cracked");
    expect(engine.snapshot().pendingStage).toBe(5);
    engine.advanceStage();
    const wrong = engine.judgeFinal({
      suspectId: "minsu",
      evidenceIds: ["empty-slot", "blue-card", "usb-red"],
      contradictionId: "seoyeon-touch-conflict",
    });
    expect(wrong.correct).toBe(false);
    expect(engine.snapshot().incorrectAttempts).toBe(1);
    const correct = engine.judgeFinal({
      suspectId: "seoyeon",
      evidenceIds: ["empty-slot", "blue-card", "usb-red"],
      contradictionId: "seoyeon-touch-conflict",
    });
    expect(correct.correct).toBe(true);
    expect(engine.snapshot().completedAt).not.toBeNull();
  });
});
