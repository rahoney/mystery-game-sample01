import type { CaseBundle, Evidence } from "../case/schemas";

export class EvidenceManager {
  constructor(private readonly bundle: CaseBundle) {}

  get(id: string): Evidence | undefined {
    return this.bundle.evidence.find((item) => item.id === id);
  }

  owned(ids: string[]): Evidence[] {
    return ids.map((id) => this.get(id)).filter((item): item is Evidence => Boolean(item));
  }
}
