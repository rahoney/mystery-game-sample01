import type { DialogueInput, DialogueResult } from "./types";

export interface DialogueProvider {
  respond(input: DialogueInput): Promise<DialogueResult>;
}
