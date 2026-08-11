# Project rules

- The case truth is deterministic and owned by `CaseEngine` plus case data.
- Never call a runtime AI API. Dialogue must go through `DialogueProvider`.
- Never expose secrets through a `VITE_` environment variable.
- Case content is data-driven and validated at load time.
- Run focused tests before a large refactor and `npm run check` before handoff.
- Do not delete content or art slots when final assets are unavailable; preserve fallbacks.
- UI code may ask the engine for state, but must not encode the culprit or win conditions.
