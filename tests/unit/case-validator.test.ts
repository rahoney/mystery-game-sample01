import { describe, expect, it } from "vitest";
import { validateCase } from "../../src/core/case/CaseValidator";
import { case001 } from "../../src/data/cases/case-001";

describe("CaseValidator", () => {
  it("accepts the authored case", () =>
    expect(validateCase(case001)).toMatchObject({ valid: true, errors: [] }));
  it("rejects an invalid culprit", () => {
    const broken = structuredClone(case001);
    broken.meta.culpritId = "nobody";
    expect(validateCase(broken).valid).toBe(false);
  });
});
