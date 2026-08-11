import caseMeta from "./case.json";
import characters from "./characters.json";
import claims from "./claims.json";
import connections from "./connections.json";
import dialogue from "./dialogue.json";
import evidence from "./evidence.json";
import facts from "./facts.json";
import rooms from "./rooms.json";
import stages from "./stages.json";
import { CaseBundleSchema, type CaseBundle } from "../../../core/case/schemas";

export const case001: CaseBundle = CaseBundleSchema.parse({
  meta: caseMeta,
  characters,
  claims,
  connections,
  dialogue,
  evidence,
  facts,
  rooms,
  stages,
});
