/**
 * Chatbot context retrieval service.
 * Retrieves relevant medical records to provide as context to the chatbot.
 */

import { StructuredMedicalRecord, MedicalHistoryEntry, ConditionRecord, MedicationRecord, AllergyRecord } from "@/lib/types";

export interface ChatbotContextOptions {
  maxRecords?: number;
  includeRawOutput?: boolean;
  dateRangeMonths?: number; // Include records from last N months
}

export interface ChatbotMedicalContext {
  summary: string;
  records: ChatbotRecord[];
  allergies: AllergyRecord[];
  medications: MedicationRecord[];
  conditions: ConditionRecord[];
  sourceAttribution: SourceAttribution[];
}

export interface ChatbotRecord {
  id: string;
  type: "visit" | "lab" | "imaging" | "prescription" | "procedure" | "diagnosis" | "allergy" | "note" | "unknown";
  date: string;
  title: string;
  summary: string;
  provider?: string;
  specialty?: string;
  severity?: string;
  recordId: string; // Reference to StructuredMedicalRecord.id
}

export interface SourceAttribution {
  recordId: string;
  sourceFile?: string;
  documentId?: string;
  confidence?: number;
  reviewStatus?: string;
}

/**
 * Retrieve relevant medical records for chatbot context.
 */
export function getChatbotContext(
  structuredRecords: StructuredMedicalRecord[],
  allergies: AllergyRecord[],
  medications: MedicationRecord[],
  conditions: ConditionRecord[],
  options: ChatbotContextOptions = {}
): ChatbotMedicalContext {
  const {
    maxRecords = 20,
    includeRawOutput = false,
    dateRangeMonths = 12,
  } = options;

  // Filter records by date range
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - dateRangeMonths);

  const recentRecords = structuredRecords.filter((r) => {
    if (!r.dateOfService) return true; // Include if date unknown
    const recordDate = new Date(r.dateOfService);
    return recordDate >= cutoffDate;
  });

  // Sort by date, newest first, limit to maxRecords
  const sortedRecords = recentRecords
    .sort((a, b) => {
      const dateA = a.dateOfService ? new Date(a.dateOfService).getTime() : 0;
      const dateB = b.dateOfService ? new Date(b.dateOfService).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, maxRecords);

  // Convert to chatbot format
  const chatbotRecords = sortedRecords.map((r) => ({
    id: r.id,
    type: r.recordType,
    date: r.dateOfService || "",
    title: r.title,
    summary: buildRecordSummary(r),
    provider: r.providerName,
    specialty: r.specialty,
    severity: r.severity,
    recordId: r.id,
  } as ChatbotRecord));

  // Build source attribution
  const sourceAttribution = sortedRecords.map((r) => ({
    recordId: r.id,
    sourceFile: undefined, // Would need additional lookup
    documentId: r.medicalDocumentId,
    confidence: r.confidence,
    reviewStatus: r.reviewStatus,
  }));

  // Build summary for chatbot
  const summary = buildContextSummary(
    chatbotRecords,
    allergies,
    medications,
    conditions
  );

  return {
    summary,
    records: chatbotRecords,
    allergies,
    medications,
    conditions,
    sourceAttribution,
  };
}

/**
 * Build a concise summary of a medical record for chatbot context.
 */
function buildRecordSummary(record: StructuredMedicalRecord): string {
  const parts: string[] = [];

  if (record.summary) {
    parts.push(record.summary);
  }

  if (record.diagnoses && record.diagnoses.length > 0) {
    parts.push(`Diagnoses: ${record.diagnoses.join(", ")}`);
  }

  if (record.medications && record.medications.length > 0) {
    parts.push(`Medications: ${record.medications.join(", ")}`);
  }

  if (record.recommendations && record.recommendations.length > 0) {
    parts.push(`Recommendations: ${record.recommendations.join(", ")}`);
  }

  if (record.followUpInstructions && record.followUpInstructions.length > 0) {
    parts.push(`Follow-up: ${record.followUpInstructions.join(", ")}`);
  }

  return parts.join(" | ");
}

/**
 * Build a high-level summary for chatbot context.
 */
function buildContextSummary(
  records: ChatbotRecord[],
  allergies: AllergyRecord[],
  medications: MedicationRecord[],
  conditions: ConditionRecord[]
): string {
  const parts: string[] = [];

  // Allergies
  if (allergies.length > 0) {
    const severeAllergies = allergies.filter((a) => a.severity === "severe");
    if (severeAllergies.length > 0) {
      parts.push(
        `⚠️ SEVERE ALLERGIES: ${severeAllergies.map((a) => a.allergen).join(", ")}`
      );
    } else {
      parts.push(
        `Allergies: ${allergies.map((a) => a.allergen).join(", ")}`
      );
    }
  }

  // Active conditions
  const activeConditions = conditions.filter((c) => c.status === "active");
  if (activeConditions.length > 0) {
    parts.push(`Active conditions: ${activeConditions.map((c) => c.name).join(", ")}`);
  }

  // Current medications
  if (medications.length > 0) {
    parts.push(`Current medications: ${medications.map((m) => m.name).join(", ")}`);
  }

  // Recent medical events
  if (records.length > 0) {
    const recentCritical = records.find((r) => r.severity === "critical");
    const recentMajor = records.find((r) => r.severity === "major");

    if (recentCritical) {
      parts.push(`Recent critical event: ${recentCritical.title}`);
    } else if (recentMajor) {
      parts.push(`Recent major event: ${recentMajor.title}`);
    }
  }

  return parts.join(" • ");
}

/**
 * Format structured records for LLM context.
 * Creates a natural language summary of medical records.
 */
export function formatMedicalRecordsForLLM(
  context: ChatbotMedicalContext
): string {
  const lines: string[] = [];

  lines.push("=== PATIENT MEDICAL CONTEXT ===\n");

  // Summary
  lines.push(`Overview: ${context.summary}\n`);

  // Allergies section
  if (context.allergies.length > 0) {
    lines.push("ALLERGIES:");
    context.allergies.forEach((a) => {
      const severity = a.severity ? ` (${a.severity})` : "";
      const reaction = a.reaction ? ` - ${a.reaction}` : "";
      lines.push(`  • ${a.allergen}${severity}${reaction}`);
    });
    lines.push("");
  }

  // Active conditions
  const activeConditions = context.conditions.filter((c) => c.status === "active");
  if (activeConditions.length > 0) {
    lines.push("ACTIVE CONDITIONS:");
    activeConditions.forEach((c) => {
      lines.push(`  • ${c.name}`);
    });
    lines.push("");
  }

  // Current medications
  if (context.medications.length > 0) {
    lines.push("CURRENT MEDICATIONS:");
    context.medications.forEach((m) => {
      lines.push(`  • ${m.name} ${m.dosage} - ${m.frequency}`);
    });
    lines.push("");
  }

  // Recent medical records
  if (context.records.length > 0) {
    lines.push("RECENT MEDICAL RECORDS:");
    context.records.slice(0, 10).forEach((r) => {
      const date = r.date ? new Date(r.date).toLocaleDateString() : "Unknown date";
      const provider = r.provider ? ` (${r.provider})` : "";
      lines.push(`  • ${date}: ${r.title}${provider}`);
      if (r.summary && r.summary.length < 200) {
        lines.push(`    ${r.summary}`);
      }
    });
    lines.push("");
  }

  lines.push("=== END CONTEXT ===\n");

  return lines.join("\n");
}

/**
 * Extract answer attribution from structured records.
 * Shows the user which sources their answer came from.
 */
export function extractAnswerAttribution(
  recordIds: string[],
  context: ChatbotMedicalContext
): string {
  const records = context.records.filter((r) => recordIds.includes(r.recordId));
  if (records.length === 0) return "";

  const sources = records
    .map((r) => {
      const date = r.date ? new Date(r.date).toLocaleDateString() : "";
      return `${r.title} (${date})`;
    })
    .join(", ");

  return `Based on: ${sources}`;
}
