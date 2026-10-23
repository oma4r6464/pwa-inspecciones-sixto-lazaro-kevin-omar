import assert from "node:assert/strict";
import test from "node:test";
import { validateInspectionCapture } from "../../src/lib/validation/inspection-capture";

test("accepts inspection captures with required fields", () => {
  assert.deepEqual(
    validateInspectionCapture({
      location: "Laboratorio Demo 08",
      summary: "Revisión sintética de referencia"
    }),
    { valid: true }
  );
});

test("rejects empty required fields and reports their names", () => {
  assert.deepEqual(
    validateInspectionCapture({ location: "", summary: "" }),
    { valid: false, missingFields: ["location", "summary"] }
  );
});

test("rejects required fields containing only whitespace", () => {
  assert.deepEqual(
    validateInspectionCapture({ location: "   ", summary: "\t\n" }),
    { valid: false, missingFields: ["location", "summary"] }
  );
});

test("reports only the required field that is missing", () => {
  assert.deepEqual(
    validateInspectionCapture({ location: "Laboratorio Demo 08", summary: "  " }),
    { valid: false, missingFields: ["summary"] }
  );
});
