import { z } from "zod";

export const QuestionIntentSchema = z.enum([
  "LOCATION",
  "USB",
  "OBJECT",
  "PERSON",
  "TIMELINE",
  "ALIBI",
  "MOTIVE",
  "OTHER",
]);
export type QuestionIntent = z.infer<typeof QuestionIntentSchema>;

export const DialogueStateSchema = z.enum(["neutral", "evasive", "pressured", "cracked"]);
export type DialogueState = z.infer<typeof DialogueStateSchema>;

export const CaseMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  premise: z.string(),
  culpritId: z.string(),
  finalRequiredEvidenceIds: z.array(z.string()).min(2),
  finalRequiredContradictionIds: z.array(z.string()).min(1),
});

export const FactSchema = z.object({
  id: z.string(),
  text: z.string(),
  hidden: z.boolean().default(false),
  stage: z.number().int().min(1).max(5),
});

export const ClaimSchema = z.object({
  id: z.string(),
  characterId: z.string(),
  text: z.string(),
  contradictionId: z.string(),
  contradictionTitle: z.string(),
  explanation: z.string(),
});

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  color: z.string(),
  personality: z.string(),
  hiddenFactId: z.string(),
  knownFactIds: z.array(z.string()),
  deniedClaimIds: z.array(z.string()),
});

export const HotspotSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  label: z.string(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().positive().max(100),
  height: z.number().positive().max(100),
  examineText: z.string(),
  grantsClueIds: z.array(z.string()).default([]),
  requiresEvidenceIds: z.array(z.string()).default([]),
  requiresFactIds: z.array(z.string()).default([]),
  minStage: z.number().int().min(1).max(5).default(1),
  maxStage: z.number().int().min(1).max(5).default(5),
  accent: z.string().optional(),
});

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  backgroundAsset: z.string(),
  palette: z.tuple([z.string(), z.string(), z.string()]),
  hotspots: z.array(HotspotSchema),
});

export const EvidenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortDescription: z.string(),
  longDescription: z.string(),
  category: z.enum(["object", "document", "trace", "testimony"]),
  discoveredAt: z.string(),
  tags: z.array(z.string()),
  supportsFacts: z.array(z.string()),
  contradictsClaims: z.array(z.string()),
  asset: z.string().optional(),
  importance: z.enum(["core", "supporting", "red-herring"]),
});

export const ConnectionSchema = z.object({
  id: z.string(),
  requiresEvidence: z.array(z.string()).min(2),
  unlocksFactId: z.string(),
  title: z.string(),
  description: z.string(),
});

export const EvidenceReactionSchema = z.object({
  evidenceId: z.string(),
  minState: DialogueStateSchema.default("neutral"),
  text: z.string(),
  nextState: DialogueStateSchema.optional(),
  contradictionId: z.string().optional(),
  unlockFactId: z.string().optional(),
});

export const CharacterDialogueSchema = z.object({
  characterId: z.string(),
  greetings: z.record(DialogueStateSchema, z.string()),
  responses: z.record(DialogueStateSchema, z.record(QuestionIntentSchema, z.string())),
  evidenceReactions: z.array(EvidenceReactionSchema),
});

export const DialogueSchema = z.object({ characters: z.array(CharacterDialogueSchema) });

export const StageConditionSchema = z.object({
  type: z.enum([
    "evidence",
    "evidenceCount",
    "roomsVisited",
    "connectionCount",
    "charactersInterviewed",
    "presentationCount",
    "contradictionCount",
    "dialogueState",
  ]),
  id: z.string().optional(),
  count: z.number().int().positive().optional(),
  characterId: z.string().optional(),
  state: DialogueStateSchema.optional(),
});

export const StageSchema = z.object({
  id: z.number().int().min(1).max(5),
  title: z.string(),
  subtitle: z.string(),
  objective: z.string(),
  intro: z.string(),
  unlockedRooms: z.array(z.string()),
  mode: z.enum(["investigation", "interview", "deduction"]),
  clearConditions: z.array(StageConditionSchema),
});

export const CaseBundleSchema = z.object({
  meta: CaseMetaSchema,
  facts: z.array(FactSchema),
  claims: z.array(ClaimSchema),
  characters: z.array(CharacterSchema),
  rooms: z.array(RoomSchema),
  evidence: z.array(EvidenceSchema),
  connections: z.array(ConnectionSchema),
  dialogue: DialogueSchema,
  stages: z.array(StageSchema).length(5),
});

export type CaseBundle = z.infer<typeof CaseBundleSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type Room = z.infer<typeof RoomSchema>;
export type Hotspot = z.infer<typeof HotspotSchema>;
export type Stage = z.infer<typeof StageSchema>;
export type StageCondition = z.infer<typeof StageConditionSchema>;
export type EvidenceConnection = z.infer<typeof ConnectionSchema>;
