import type { CaseBundle, EvidenceConnection } from "../case/schemas";

export class ConnectionEngine {
  constructor(private readonly bundle: CaseBundle) {}

  newlyUnlocked(ownedEvidenceIds: string[], existingIds: string[]): EvidenceConnection[] {
    const owned = new Set(ownedEvidenceIds);
    const existing = new Set(existingIds);
    return this.bundle.connections.filter(
      (connection) =>
        !existing.has(connection.id) && connection.requiresEvidence.every((id) => owned.has(id)),
    );
  }
}
