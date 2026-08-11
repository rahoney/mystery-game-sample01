import type { CaseBundle, QuestionIntent } from "../core/case/schemas";
import type { DialogueProvider } from "./DialogueProvider";
import { DialogueStateMachine } from "./DialogueStateMachine";
import { IntentParser } from "./IntentParser";
import type { DialogueInput, DialogueResult } from "./types";

export class MockDialogueProvider implements DialogueProvider {
  private readonly parser = new IntentParser();
  private readonly stateMachine = new DialogueStateMachine();

  constructor(private readonly bundle: CaseBundle) {}

  async respond(input: DialogueInput): Promise<DialogueResult> {
    const authored = this.bundle.dialogue.characters.find(
      (item) => item.characterId === input.characterId,
    );
    if (!authored) throw new Error(`Dialogue not found: ${input.characterId}`);
    const intent: QuestionIntent =
      input.questionIntent ?? this.parser.parse(input.freeText ?? "").intent;
    const evidenceId = input.presentedEvidenceIds.at(-1);
    if (evidenceId) {
      const possible = authored.evidenceReactions.filter((item) => item.evidenceId === evidenceId);
      const reaction = possible
        .sort((a, b) => this.stateMachine.rank(b.minState) - this.stateMachine.rank(a.minState))
        .find(
          (item) =>
            this.stateMachine.rank(input.currentDialogueState) >=
            this.stateMachine.rank(item.minState),
        );
      if (reaction) {
        return {
          text: reaction.text,
          intent,
          nextState: this.stateMachine.advance(input.currentDialogueState, reaction.nextState),
          contradictionId: reaction.contradictionId,
          unlockFactId: reaction.unlockFactId,
        };
      }
      return {
        text: "그 물건만으로는 제가 더 말씀드릴 게 없네요. 다른 정황과 함께 봐 주세요.",
        intent,
        nextState: input.currentDialogueState,
      };
    }
    const text = authored.responses[input.currentDialogueState][intent];
    return {
      text,
      intent,
      nextState: input.currentDialogueState,
      suggestion: intent === "OTHER" ? "예: ‘20시쯤 어디에 있었나요?’처럼 물어보세요." : undefined,
    };
  }

  greeting(characterId: string, state: DialogueResult["nextState"]): string {
    const authored = this.bundle.dialogue.characters.find(
      (item) => item.characterId === characterId,
    );
    return authored?.greetings[state] ?? "무엇을 알고 싶으신가요?";
  }
}
