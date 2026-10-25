export type InspectionCaptureInput = {
  location: string;
  summary: string;
};

export type InspectionCaptureValidation =
  | { valid: true }
  | { valid: false; missingFields: Array<keyof InspectionCaptureInput> };

export function validateInspectionCapture(
  input: InspectionCaptureInput
): InspectionCaptureValidation {
  const missingFields: Array<keyof InspectionCaptureInput> = [];

  if (!input.location.trim()) missingFields.push("location");
  if (!input.summary.trim()) missingFields.push("summary");

  return missingFields.length === 0 ? { valid: true } : { valid: false, missingFields };
}
