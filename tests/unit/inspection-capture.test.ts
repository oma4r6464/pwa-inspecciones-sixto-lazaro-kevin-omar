import assert from "node:assert/strict";
import test from "node:test";
import { validateInspectionCapture } from "../../src/lib/validation/inspection-capture";

test("accepts inspection captures with required fields", () => {
  assert.deepEqual(
    validateInspectionCapture({
      location: "Laboratorio Demo 08",
      summary: "Revisión sintética de referencia",
      inspector: "Técnica Demo",
      status: "ok"
    }),
    {
      valid: true,
      value: {
        location: "Laboratorio Demo 08",
        summary: "Revisión sintética de referencia",
        inspector: "Técnica Demo",
        status: "ok"
      }
    }
  );
});

test("normalizes whitespace and defaults an empty optional inspector", () => {
  assert.deepEqual(
    validateInspectionCapture({
      location: "  Laboratorio Demo 08 ",
      summary: "  Revisión sintética  ",
      inspector: "   ",
      status: "attention"
    }),
    {
      valid: true,
      value: {
        location: "Laboratorio Demo 08",
        summary: "Revisión sintética",
        inspector: "Sin asignar",
        status: "attention"
      }
    }
  );
});

test("rejects empty required fields", () => {
  assert.deepEqual(
    validateInspectionCapture({
      location: "",
      summary: "",
      inspector: "",
      status: "ok"
    }),
    {
      valid: false,
      issues: [
        { field: "location", code: "empty" },
        { field: "summary", code: "empty" }
      ]
    }
  );
});

test("rejects required fields containing only whitespace", () => {
  assert.deepEqual(
    validateInspectionCapture({
      location: "   ",
      summary: "  ",
      status: "ok"
    }),
    {
      valid: false,
      issues: [
        { field: "location", code: "empty" },
        { field: "summary", code: "empty" }
      ]
    }
  );
});

test("accepts values at their Unicode character limits", () => {
  assert.equal(
    validateInspectionCapture({
      location: "á".repeat(80),
      summary: "é".repeat(500),
      status: "ok"
    }).valid,
    true
  );
});

test("rejects values over the limits and invalid status or control characters", () => {
  assert.deepEqual(
    validateInspectionCapture({
      location: "a".repeat(81),
      summary: "texto\u0000no permitido",
      inspector: "i".repeat(81),
      status: "invalid"
    }),
    {
      valid: false,
      issues: [
        { field: "location", code: "too_long" },
        { field: "summary", code: "control_character" },
        { field: "inspector", code: "too_long" },
        { field: "status", code: "invalid_value" }
      ]
    }
  );
});

test("rejects non-text fields and unexpected input properties", () => {
  assert.deepEqual(
    validateInspectionCapture({
      location: 42,
      summary: "Resumen sintético",
      inspector: "",
      status: "ok",
      token: "synthetic-only"
    }),
    {
      valid: false,
      issues: [
        { field: "capture", code: "unexpected_field" },
        { field: "location", code: "invalid_type" }
      ]
    }
  );
});
