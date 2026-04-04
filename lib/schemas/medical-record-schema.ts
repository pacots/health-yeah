import { z } from "zod";

/**
 * Zod schema for validating LLM-parsed medical records.
 * All fields are nullable to represent uncertainty and avoid hallucination.
 */

export const StructuredMedicalRecordSchema = z.object({
  recordType: z.enum(["visit", "lab", "imaging", "prescription", "procedure", "diagnosis", "allergy", "note", "unknown"]),
  title: z.string().min(1).max(255),
  
  // Date and location
  dateOfService: z.string().datetime().nullable().optional(),
  providerName: z.string().max(255).nullable().optional(),
  organizationName: z.string().max(255).nullable().optional(),
  specialty: z.string().max(100).nullable().optional(),
  facility: z.string().max(255).nullable().optional(),
  
  // Medical content
  summary: z.string().max(2000).nullable().optional(),
  chiefComplaint: z.string().max(500).nullable().optional(),
  diagnoses: z.array(z.string()).nullable().optional(),
  medications: z.array(z.string()).nullable().optional(),
  vitals: z.record(z.string(), z.any()).nullable().optional(),
  labs: z.array(z.string()).nullable().optional(),
  procedures: z.array(z.string()).nullable().optional(),
  recommendations: z.array(z.string()).nullable().optional(),
  followUpInstructions: z.array(z.string()).nullable().optional(),
  severity: z.enum(["critical", "major", "moderate", "routine"]).nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  
  // QA fields
  confidence: z.number().min(0).max(1).nullable().optional(),
  missingFields: z.array(z.string()).nullable().optional(),
  warnings: z.array(z.string()).nullable().optional(),
});

export type ParsedMedicalRecord = z.infer<typeof StructuredMedicalRecordSchema>;

/**
 * Validate parsed record against schema.
 * Returns validation result with or without errors.
 */
export function validateMedicalRecord(data: unknown): {
  success: boolean;
  data?: ParsedMedicalRecord;
  errors?: z.ZodError<unknown>;
} {
  const result = StructuredMedicalRecordSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Format validation errors for display.
 */
export function formatValidationErrors(errors: z.ZodError<unknown>): string[] {
  return errors.issues.map((err) => {
    const path = err.path.join(".");
    return `${path}: ${err.message}`;
  });
}
