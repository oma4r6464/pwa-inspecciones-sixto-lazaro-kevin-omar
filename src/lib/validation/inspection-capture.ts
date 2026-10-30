import {
  validateInspectionInput,
  type InspectionCaptureInput,
  type InspectionInputValidation,
  type ValidatedInspectionCapture
} from "../security/inspection-input";

export type { InspectionCaptureInput, InspectionInputValidation, ValidatedInspectionCapture };

export function validateInspectionCapture(
  input: unknown
): InspectionInputValidation<ValidatedInspectionCapture> {
  return validateInspectionInput(input);
}
