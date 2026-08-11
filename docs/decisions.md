# Implementation decisions

## 2026-08-11

- Phaser owns the investigation canvas, while accessible DOM panels own dialogue, notebook, navigation, and deduction. This keeps hotspot interaction game-like without sacrificing keyboard and screen-reader usability.
- Case truth and judgement live in `CaseEngine`; UI code only dispatches actions and renders snapshots.
- Generated art is optional at runtime. CSS/Canvas fallbacks make every room, portrait, and event cut playable when production files are absent.
- Stages unlock automatically when their deterministic criteria are met. The player confirms transitions to preserve pacing.
- Evidence connections are automatically discovered when all required evidence is owned; this avoids drag-and-drop friction in a short vertical slice.
- Synthesized Web Audio cues are used so the demo has sound without shipping unlicensed audio.
- Stage 4 pressure is earned through distinct evidence reactions, not repeated generic questions.
