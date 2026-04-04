/**
 * Medical document ingestion orchestration.
 * Coordinates the full pipeline: upload → parse → validate → create history entry
 */

import { parseMedicalDocument } from "@/lib/services/medical-document-parser";
import {
  MedicalDocument,
  DocumentExtraction,
  StructuredMedicalRecord,
  MedicalHistoryEntry,
} from "@/lib/types";

export interface IngestionWorkflowResult {
  success: boolean;
  medicalDocument?: MedicalDocument;
  structuredRecord?: StructuredMedicalRecord;
  historyEntry?: MedicalHistoryEntry;
  error?: string;
  warnings?: string[];
}

/**
 * Full ingestion workflow: file → extraction → parsing → history entry
 */
export async function ingestMedicalDocument(
  file: File,
  medicalDocument: MedicalDocument,
  openaiApiKey: string,
  userId: string
): Promise<IngestionWorkflowResult> {
  const warnings: string[] = [];

  try {
    // Step 1: Update document status to "extracting"
    const extractingDoc: MedicalDocument = {
      ...medicalDocument,
      processingStatus: "extracting",
      updatedAt: Date.now(),
    };

    // Step 2: Parse document (includes extraction and LLM parsing)
    const parsingResult = await parseMedicalDocument(
      file,
      openaiApiKey,
      userId,
      medicalDocument.id
    );

    if (!parsingResult.success) {
      return {
        success: false,
        medicalDocument: {
          ...extractingDoc,
          processingStatus: "failed",
          errorMessage: parsingResult.error,
          updatedAt: Date.now(),
        },
        warnings: parsingResult.warnings,
        error: parsingResult.error,
      };
    }

    // Step 3: Update document with successful parsing status
    const parsedDoc: MedicalDocument = {
      ...extractingDoc,
      processingStatus: "parsed",
      linkedRecordId: parsingResult.record?.id,
      updatedAt: Date.now(),
    };

    // Step 4: Create medical history entry from structured record
    const historyEntry: MedicalHistoryEntry = {
      id: Math.random().toString(36).substring(2, 11),
      userId,
      structuredRecordId: parsingResult.record!.id,
      title: parsingResult.record!.title,
      date: parsingResult.record!.dateOfService || new Date().toISOString().split("T")[0],
      severity: parsingResult.record!.severity || "routine",
      category: parsingResult.record!.recordType,
      provider: parsingResult.record!.providerName,
      summary: parsingResult.record!.summary || "Parsed from uploaded document",
      important: (parsingResult.record!.severity === "critical" || parsingResult.record!.severity === "major"),
      displayMetadata: {
        sourceDocument: medicalDocument.fileName,
        parseConfidence: parsingResult.record!.confidence,
        reviewStatus: parsingResult.record!.reviewStatus,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return {
      success: true,
      medicalDocument: parsedDoc,
      structuredRecord: parsingResult.record,
      historyEntry,
      warnings: parsingResult.warnings,
    };
  } catch (err) {
    return {
      success: false,
      medicalDocument: {
        ...medicalDocument,
        processingStatus: "failed",
        errorMessage: `Ingestion failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        updatedAt: Date.now(),
      },
      error: `Ingestion failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      warnings,
    };
  }
}

/**
 * Create a medical history entry from an existing structured record.
 * Useful for manual entry creation or updates.
 */
export function createHistoryEntryFromRecord(
  record: StructuredMedicalRecord
): MedicalHistoryEntry {
  return {
    id: Math.random().toString(36).substring(2, 11),
    userId: record.userId,
    structuredRecordId: record.id,
    title: record.title,
    date: record.dateOfService || new Date().toISOString().split("T")[0],
    severity: record.severity || "routine",
    category: record.recordType,
    provider: record.providerName,
    summary: record.summary || "Medical record",
    important: record.severity === "critical" || record.severity === "major",
    displayMetadata: {
      parseConfidence: record.confidence,
      reviewStatus: record.reviewStatus,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
