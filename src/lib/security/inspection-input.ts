export type InspectionStatus = "ok" | "attention";

export type InspectionCaptureInput = {
  location: string;
  summary: string;
  inspector?: string;
  status: InspectionStatus;
};

export type InspectionInputField =
  | "capture"
  | "location"
  | "summary"
  | "inspector"
  | "status"
  | "date"
  | "findings";

export type InspectionInputIssueCode =
  | "invalid_type"
  | "required"
  | "empty"
  | "too_long"
  | "control_character"
  | "invalid_value"
  | "unexpected_field";

export type InspectionInputIssue = {
  field: InspectionInputField;
  code: InspectionInputIssueCode;
};

export type ValidatedInspectionCapture = {
  location: string;
  summary: string;
  inspector: string;
  status: InspectionStatus;
};

export type InspectionInputValidation<T> =
  | { valid: true; value: T }
  | { valid: false; issues: InspectionInputIssue[] };

export type ValidatedInspectionPayload = {
  result: InspectionStatus;
  notes: string;
  location: string;
  inspector: string;
  date: string;
  findings: number;
};

export const INSPECTION_INPUT_LIMITS = {
  location: 80,
  summary: 500,
  inspector: 80
} as const;

const CAPTURE_FIELDS = new Set(["location", "summary", "inspector", "status"]);
const PAYLOAD_FIELDS = new Set([
  "result",
  "notes",
  "location",
  "inspector",
  "date",
  "findings"
]);
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/u;

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function addUnexpectedFields(
  input: Record<string, unknown>,
  allowedFields: Set<string>,
  issues: InspectionInputIssue[]
): void {
  for (const field of Object.keys(input)) {
    if (!allowedFields.has(field)) {
      issues.push({ field: "capture", code: "unexpected_field" });
    }
  }
}

function readText(
  value: unknown,
  field: "location" | "summary" | "inspector",
  maximum: number,
  required: boolean,
  issues: InspectionInputIssue[]
): string | undefined {
  if (value === undefined && !required) return "";
  if (typeof value !== "string") {
    issues.push({ field, code: value === undefined ? "required" : "invalid_type" });
    return undefined;
  }

  const normalized = value.trim();
  if (required && normalized.length === 0) {
    issues.push({ field, code: "empty" });
  }
  if (Array.from(normalized).length > maximum) {
    issues.push({ field, code: "too_long" });
  }
  if (CONTROL_CHARACTERS.test(value)) {
    issues.push({ field, code: "control_character" });
  }

  return normalized;
}

export function validateInspectionInput(
  input: unknown
): InspectionInputValidation<ValidatedInspectionCapture> {
  if (!isRecord(input)) {
    return { valid: false, issues: [{ field: "capture", code: "invalid_type" }] };
  }

  const issues: InspectionInputIssue[] = [];
  addUnexpectedFields(input, CAPTURE_FIELDS, issues);

  const location = readText(
    input.location,
    "location",
    INSPECTION_INPUT_LIMITS.location,
    true,
    issues
  );
  const summary = readText(
    input.summary,
    "summary",
    INSPECTION_INPUT_LIMITS.summary,
    true,
    issues
  );
  const rawInspector = readText(
    input.inspector,
    "inspector",
    INSPECTION_INPUT_LIMITS.inspector,
    false,
    issues
  );

  let status: InspectionStatus | undefined;
  if (input.status === "ok" || input.status === "attention") {
    status = input.status;
  } else {
    issues.push({
      field: "status",
      code: input.status === undefined ? "required" : "invalid_value"
    });
  }

  if (
    issues.length > 0 ||
    location === undefined ||
    summary === undefined ||
    rawInspector === undefined ||
    status === undefined
  ) {
    return { valid: false, issues };
  }

  return {
    valid: true,
    value: {
      location,
      summary,
      inspector: rawInspector || "Sin asignar",
      status
    }
  };
}

export function validateInspectionPayload(
  input: unknown
): InspectionInputValidation<ValidatedInspectionPayload> {
  if (!isRecord(input)) {
    return { valid: false, issues: [{ field: "capture", code: "invalid_type" }] };
  }

  const issues: InspectionInputIssue[] = [];
  addUnexpectedFields(input, PAYLOAD_FIELDS, issues);

  const capture = validateInspectionInput({
    location: input.location,
    summary: input.notes,
    inspector: input.inspector,
    status: input.result
  });
  if (!capture.valid) issues.push(...capture.issues);

  if (typeof input.date !== "string") {
    issues.push({ field: "date", code: input.date === undefined ? "required" : "invalid_type" });
  }
  if (
    typeof input.findings !== "number" ||
    !Number.isInteger(input.findings) ||
    input.findings < 0
  ) {
    issues.push({
      field: "findings",
      code: input.findings === undefined ? "required" : "invalid_value"
    });
  }

  if (
    issues.length > 0 ||
    !capture.valid ||
    typeof input.date !== "string" ||
    typeof input.findings !== "number"
  ) {
    return { valid: false, issues };
  }

  return {
    valid: true,
    value: {
      result: capture.value.status,
      notes: capture.value.summary,
      location: capture.value.location,
      inspector: capture.value.inspector,
      date: input.date,
      findings: input.findings
    }
  };
}

export class InspectionInputValidationError extends Error {
  readonly issues: readonly InspectionInputIssue[];

  constructor(issues: readonly InspectionInputIssue[]) {
    super("La captura de inspección no cumple las reglas de validación.");
    this.name = "InspectionInputValidationError";
    this.issues = issues.map(({ field, code }) => ({ field, code }));
  }
}
