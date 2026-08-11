import { describe, expect, it } from "vitest";
import { DialogueStateMachine } from "../../src/dialogue/DialogueStateMachine";

describe("DialogueStateMachine", () => {
  const machine = new DialogueStateMachine();
  it("only advances", () => {
    expect(machine.advance("neutral", "pressured")).toBe("pressured");
    expect(machine.advance("pressured", "evasive")).toBe("pressured");
  });
});
