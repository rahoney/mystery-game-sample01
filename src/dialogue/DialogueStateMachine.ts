import type { DialogueState } from "../core/case/schemas";

const order: DialogueState[] = ["neutral", "evasive", "pressured", "cracked"];

export class DialogueStateMachine {
  advance(current: DialogueState, requested?: DialogueState): DialogueState {
    if (!requested) return current;
    return order.indexOf(requested) > order.indexOf(current) ? requested : current;
  }

  rank(state: DialogueState): number {
    return order.indexOf(state);
  }
}
