# Architecture

`CaseEngine` is the single deterministic domain boundary. It composes evidence, connections, dialogue state, stage progression, save data, and final judgement. Every mutation emits a new serializable snapshot.

`MockDialogueProvider` converts an intent and current immutable case context into authored responses. It can change presentation state only through the engine; it cannot change truth data.

`InvestigationScene` renders rooms and hotspots in Phaser. `AppShell` renders the surrounding DOM application and communicates with the scene through `GameBridge` events.

Case JSON is parsed with Zod before play. `scripts/validate-case.ts` adds cross-reference and solvability checks that schemas alone cannot express.

Local storage holds only player progress. Static case truth is reloaded from validated data on every session, preventing save files from rewriting the solution.
