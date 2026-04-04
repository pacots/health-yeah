/**
 * Shared timeline event transformation and mapping layer
 * 
 * Converts medical records into timeline-friendly items with unified
 * importance/severity inference, with support for both summary and expanded views.
 */

import { MedicalVisitRecord } from "./types";

export interface TimelineItem {
  id: string;
  date: Date;
  visitDate: string; // ISO date string (YYYY-MM-DD)
  formattedDate: string; // "Mar 4, 2026"
  formattedDateShort: string; // "Mar 4"
  formattedMonthYear: string; // "March 2026"
  title: string; // reason for visit
  subtitle?: string; // specialty or diagnosis
  severity: "critical" | "major" | "moderate" | "routine";
  category: "critical" | "major" | "surgery" | "hospitalization" | "ER" | "diagnosis" | "procedure" | "checkup" | "other";
  isImportant: boolean;
  provider?: string;
  specialty?: string;
  diagnosis?: string;
  treatment?: string;
  doctorNotes?: string;
  sourceRecord: MedicalVisitRecord;
}

/**
 * Infer if an event is "important" based on severity and category
 */
function inferIsImportant(record: MedicalVisitRecord): boolean {
  // Explicit severity-based importance
  if (record.severity === "critical" || record.severity === "major") {
    return true;
  }

  // Infer from reason/diagnosis patterns
  const reasonLower = record.reasonForVisit?.toLowerCase() || "";
  const diagnosisLower = record.diagnosis?.toLowerCase() || "";
  const fullText = `${reasonLower} ${diagnosisLower}`.toLowerCase();

  const importantPatterns = [
    "surgery",
    "surgical",
    "hospitalization",
    "hospital",
    "admitted",
    "admission",
    "er visit",
    "emergency",
    "diagnosis",
    "diagnosed",
    "major",
    "critical",
    "severe",
    "procedure",
    "intervention",
  ];

  return importantPatterns.some((pattern) => fullText.includes(pattern));
}

/**
 * Infer category from record properties
 */
function inferCategory(
  record: MedicalVisitRecord
): TimelineItem["category"] {
  const text = `${record.reasonForVisit} ${record.diagnosis || ""}`.toLowerCase();

  if (record.severity === "critical") return "critical";
  if (record.severity === "major") return "major";
  if (text.includes("surgery") || text.includes("surgical")) return "surgery";
  if (text.includes("hospital") || text.includes("admitted")) return "hospitalization";
  if (text.includes("emergency") || text.includes("er")) return "ER";
  if (text.includes("diagnos")) return "diagnosis";
  if (text.includes("procedure")) return "procedure";
  if (text.includes("checkup") || text.includes("annual") || text.includes("physical")) return "checkup";

  return "other";
}

/**
 * Format date as "Mar 4, 2026"
 */
export function formatDateFull(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format date as "Mar 4"
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format date as "March 2026"
 */
export function formatMonthYear(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

/**
 * Transform a medical visit record into a timeline item
 */
export function transformToTimelineItem(
  record: MedicalVisitRecord
): TimelineItem {
  const date = new Date(record.visitDate + "T00:00:00");
  const isImportant = inferIsImportant(record);
  const category = inferCategory(record);

  return {
    id: record.id,
    date,
    visitDate: record.visitDate,
    formattedDate: formatDateFull(record.visitDate),
    formattedDateShort: formatDateShort(record.visitDate),
    formattedMonthYear: formatMonthYear(record.visitDate),
    title: record.reasonForVisit,
    subtitle: record.diagnosis || record.specialty,
    severity: record.severity,
    category,
    isImportant,
    provider: record.doctorName,
    specialty: record.specialty,
    diagnosis: record.diagnosis,
    treatment: record.treatment,
    doctorNotes: record.doctorNotes,
    sourceRecord: record,
  };
}

/**
 * Transform multiple records and get both summary (important) and expanded (all) items
 */
export function transformMedicalRecords(records: MedicalVisitRecord[]): {
  allItems: TimelineItem[];
  importantItems: TimelineItem[];
} {
  const allItems = records.map(transformToTimelineItem);

  // Sort chronologically (ascending - oldest first for timeline flow)
  allItems.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Filter important items
  const importantItems = allItems.filter((item) => item.isImportant);

  return {
    allItems,
    importantItems,
  };
}

/**
 * Get color for severity level
 */
export function getSeverityColor(
  severity: "critical" | "major" | "moderate" | "routine"
): {
  dot: string; // hex color for timeline dot
  bg: string; // background hex
  border: string; // border hex
  text: string; // text hex
} {
  switch (severity) {
    case "critical":
      return {
        dot: "#dc2626", // rose-600
        bg: "#fee2e2", // rose-100
        border: "#dc2626",
        text: "#991b1b", // rose-900
      };
    case "major":
      return {
        dot: "#d97706", // amber-600
        bg: "#fef3c7", // amber-100
        border: "#d97706",
        text: "#78350f", // amber-900
      };
    case "moderate":
      return {
        dot: "#2563eb", // blue-600
        bg: "#dbeafe", // blue-100
        border: "#2563eb",
        text: "#1e3a8a", // blue-900
      };
    default:
      return {
        dot: "#6b7280", // gray-500
        bg: "#f3f4f6", // gray-100
        border: "#9ca3af", // gray-400
        text: "#374151", // gray-700
      };
  }
}
