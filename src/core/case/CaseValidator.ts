import type { CaseBundle } from "./schemas";

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCase(bundle: CaseBundle): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const unique = (values: string[], label: string) => {
    if (new Set(values).size !== values.length) errors.push(`${label} ID가 중복되었습니다.`);
  };
  unique(
    bundle.facts.map((item) => item.id),
    "fact",
  );
  unique(
    bundle.characters.map((item) => item.id),
    "character",
  );
  unique(
    bundle.rooms.map((item) => item.id),
    "room",
  );
  unique(
    bundle.evidence.map((item) => item.id),
    "evidence",
  );
  unique(
    bundle.connections.map((item) => item.id),
    "connection",
  );

  const factIds = new Set(bundle.facts.map((item) => item.id));
  const characterIds = new Set(bundle.characters.map((item) => item.id));
  const roomIds = new Set(bundle.rooms.map((item) => item.id));
  const evidenceIds = new Set(bundle.evidence.map((item) => item.id));
  const dialogueIds = new Set(bundle.dialogue.characters.map((item) => item.characterId));
  const claimIds = new Set(bundle.claims.map((item) => item.id));

  if (!characterIds.has(bundle.meta.culpritId)) errors.push("정답 인물 ID가 유효하지 않습니다.");
  if (bundle.characters.filter((item) => item.id === bundle.meta.culpritId).length !== 1)
    errors.push("정답 인물은 정확히 한 명이어야 합니다.");

  for (const evidence of bundle.evidence) {
    if (!roomIds.has(evidence.discoveredAt)) errors.push(`${evidence.id}: 발견 room이 없습니다.`);
    for (const factId of evidence.supportsFacts)
      if (!factIds.has(factId)) errors.push(`${evidence.id}: fact ${factId}가 없습니다.`);
    for (const claimId of evidence.contradictsClaims)
      if (!claimIds.has(claimId)) errors.push(`${evidence.id}: claim ${claimId}가 없습니다.`);
  }
  for (const room of bundle.rooms) {
    for (const hotspot of room.hotspots) {
      if (hotspot.roomId !== room.id) errors.push(`${hotspot.id}: roomId가 부모 room과 다릅니다.`);
      for (const id of hotspot.grantsClueIds)
        if (!evidenceIds.has(id)) errors.push(`${hotspot.id}: evidence ${id}가 없습니다.`);
    }
  }
  for (const connection of bundle.connections) {
    for (const id of connection.requiresEvidence)
      if (!evidenceIds.has(id)) errors.push(`${connection.id}: evidence ${id}가 없습니다.`);
    if (!factIds.has(connection.unlocksFactId))
      errors.push(`${connection.id}: unlock fact가 없습니다.`);
  }
  for (const character of bundle.characters) {
    if (!dialogueIds.has(character.id)) errors.push(`${character.id}: dialogue가 없습니다.`);
    if (!factIds.has(character.hiddenFactId))
      errors.push(`${character.id}: hidden fact가 없습니다.`);
    for (const id of character.knownFactIds)
      if (!factIds.has(id)) errors.push(`${character.id}: known fact ${id}가 없습니다.`);
  }
  for (const claim of bundle.claims)
    if (!characterIds.has(claim.characterId)) errors.push(`${claim.id}: character가 없습니다.`);
  for (const id of bundle.meta.finalRequiredEvidenceIds)
    if (!evidenceIds.has(id)) errors.push(`final evidence ${id}가 없습니다.`);

  const obtainable = new Set(
    bundle.rooms.flatMap((room) => room.hotspots.flatMap((hotspot) => hotspot.grantsClueIds)),
  );
  for (const id of bundle.meta.finalRequiredEvidenceIds)
    if (!obtainable.has(id)) errors.push(`final evidence ${id}를 획득할 hotspot이 없습니다.`);

  const directCore = bundle.evidence.filter((item) => item.importance === "core").length;
  if (directCore < 4) warnings.push("핵심 증거가 너무 적어 추론 경로가 단조로울 수 있습니다.");
  const irrelevantClaims = bundle.evidence
    .filter((item) => item.importance === "red-herring")
    .flatMap((item) => item.contradictsClaims);
  if (irrelevantClaims.includes("seoyeon_never_touched"))
    errors.push("무관 단서만으로 정답을 확정할 수 있습니다.");

  return { valid: errors.length === 0, errors, warnings };
}
