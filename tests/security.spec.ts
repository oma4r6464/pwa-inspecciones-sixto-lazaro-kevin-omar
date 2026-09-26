import assert from "node:assert/strict";
import { createSafeErrorContext } from "../src/lib/security/safe-error";

const context = createSafeErrorContext({
  incidentId: "incidente/04?correo=sintetico",
  correlationId: "correlacion demo",
  status: 503.9,
  attempt: -2,
  durationMs: 184.8
});

assert.deepEqual(context, {
  incidentId: "incidente04correosintetico",
  correlationId: "correlaciondemo",
  status: 503,
  attempt: 1,
  durationMs: 184
});

assert.deepEqual(Object.keys(context).sort(), [
  "attempt",
  "correlationId",
  "durationMs",
  "incidentId",
  "status"
]);
assert.equal("correo" in context, false);
assert.equal("ubicacion" in context, false);
assert.equal("foto" in context, false);
assert.equal("comentario" in context, false);

console.log("security.spec.ts: PASS");