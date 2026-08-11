import { validateCase } from "../src/core/case/CaseValidator";
import { case001 } from "../src/data/cases/case-001";

const report = validateCase(case001);
for (const warning of report.warnings) console.warn(`warning: ${warning}`);
if (!report.valid) {
  console.error(report.errors.join("\n"));
  process.exit(1);
}
console.log(
  `Case ${case001.meta.id} valid: ${case001.evidence.length} evidence, ${case001.connections.length} connections, ${case001.stages.length} stages.`,
);
