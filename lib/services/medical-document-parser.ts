/**
 * Medical Document Parser Service
 * Orchestrates extraction, LLM parsing, validation, and structured record creation.
 */

import { StructuredMedicalRecord } from "@/lib/types";
import { validateMedicalRecord, ParsedMedicalRecord } from "@/lib/schemas/medical-record-schema";
import {
  extractMedicalDocumentText,
  isExtractionValid,
  ExtractionResult,
} from "@/lib/services/text-extractor";
import {
  createMedicalParsingPrompt,
  extractJsonFromResponse,
  PARSER_SYSTEM_PROMPT,
  PARSER_TEMPERATURE,
  PARSER_MAX_TOKENS,
} from "@/lib/services/parser-prompts";

export interface ParsingResult {
  success: boolean;
  record?: StructuredMedicalRecord;
  extractedText?: string;
  rawParserOutput?: Record<string, unknown>;
  error?: string;
  warnings?: string[];
}

/**
 * Parse medical document using LLM.
 * 
 * @param apiKey - OpenAI API key
 * @param extractedText - Text extracted from document
 * @param fileName - Original file name for context
 * @returns Parsed record with validation results
 */
async function callLlmParser(
  apiKey: string,
  extractedText: string,
  fileName: string
): Promise<{
  success: boolean;
  data?: ParsedMedicalRecord;
  rawResponse?: string;
  error?: string;
}> {
  if (!apiKey) {
    return {
      success: false,
      error: "OpenAI API key not provided",
    };
  }

  try {
    const prompt = createMedicalParsingPrompt(extractedText);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        system: PARSER_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: PARSER_TEMPERATURE,
        max_tokens: PARSER_MAX_TOKENS,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: `OpenAI API error: ${errorData.error?.message || response.statusText}`,
        rawResponse: JSON.stringify(errorData),
      };
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        error: "Empty response from OpenAI API",
      };
    }

    // Extract JSON from response
    const jsonStr = extractJsonFromResponse(content);

    try {
      const parsed = JSON.parse(jsonStr);
      return {
        success: true,
        data: parsed,
        rawResponse: content,
      };
    } catch (jsonErr) {
      return {
        success: false,
        error: `Failed to parse JSON response: ${jsonErr instanceof Error ? jsonErr.message : "Unknown error"}`,
        rawResponse: content,
      };
    }
  } catch (err) {
    return {
      success: false,
      error: `LLM parsing failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

/**
 * Main ingestion function - orchestrates entire parsing pipeline.
 * 
 * @param file - Uploaded file
 * @param openaiApiKey - OpenAI API key for LLM parsing
 * @param userId - User ID for record ownership
 * @param medicalDocumentId - ID of the MedicalDocument record
 * @returns Complete parsing result with structured record
 */
export async function parseMedicalDocument(
  file: File,
  openaiApiKey: string,
  userId: string,
  medicalDocumentId: string
): Promise<ParsingResult> {
  const warnings: string[] = [];

  // Step 1: Extract text from document
  const extractionResult = await extractMedicalDocumentText(file);

  if (extractionResult.error) {
    return {
      success: false,
      error: `Text extraction failed: ${extractionResult.error}`,
      warnings,
    };
  }

  if (!isExtractionValid(extractionResult)) {
    return {
      success: false,
      error: "Extracted text too short or empty - cannot parse",
      extractedText: extractionResult.text,
      warnings: [
        ...warnings,
        "Document extraction resulted in insufficient text for parsing",
      ],
    };
  }

  // Step 2: Call LLM parser
  const parserResult = await callLlmParser(
    openaiApiKey,
    extractionResult.text,
    file.name
  );

  if (!parserResult.success) {
    return {
      success: false,
      error: parserResult.error,
      extractedText: extractionResult.text,
      warnings,
    };
  }

  // Step 3: Validate parsed output against schema
  const validationResult = validateMedicalRecord(parserResult.data);

  if (!validationResult.success) {
    const errorMessages = validationResult.errors?.issues.map(
      (e) => `${e.path.join(".")}: ${e.message}`
    ) || [];
    return {
      success: false,
      error: `Validation failed: ${errorMessages.join("; ")}`,
      extractedText: extractionResult.text,
      rawParserOutput: parserResult.data,
      warnings: [...warnings, "Parsed data failed schema validation"],
    };
  }

  // Step 4: Create structured medical record
  // Step 4: Create structured medical record
  const structuredRecord: StructuredMedicalRecord = {
    id: Math.random().toString(36).substring(2, 11),
    userId,
    medicalDocumentId,
    recordType: validationResult.data?.recordType || "unknown",
    title: validationResult.data?.title || file.name,
    dateOfService: validationResult.data?.dateOfService || undefined,
    providerName: validationResult.data?.providerName || undefined,
    organizationName: validationResult.data?.organizationName || undefined,
    specialty: validationResult.data?.specialty || undefined,
    facility: validationResult.data?.facility || undefined,
    summary: validationResult.data?.summary || undefined,
    chiefComplaint: validationResult.data?.chiefComplaint || undefined,
    diagnoses: validationResult.data?.diagnoses || undefined,
    medications: validationResult.data?.medications || undefined,
    vitals: validationResult.data?.vitals || undefined,
    labs: validationResult.data?.labs || undefined,
    procedures: validationResult.data?.procedures || undefined,
    recommendations: validationResult.data?.recommendations || undefined,
    followUpInstructions: validationResult.data?.followUpInstructions || undefined,
    severity: validationResult.data?.severity || undefined,
    tags: validationResult.data?.tags || undefined,
    rawParserOutput: parserResult.data || {},
    parserVersion: "gpt-4-turbo@20240101",
    parserModel: "gpt-4-turbo",
    reviewStatus:
      validationResult.data?.confidence !== undefined &&
      validationResult.data?.confidence !== null &&
      validationResult.data.confidence < 0.7
        ? "needs_review"
        : "auto_parsed",
    confidence: validationResult.data?.confidence || undefined,
    missingFields: validationResult.data?.missingFields || undefined,
    warnings: [...warnings, ...(validationResult.data?.warnings || [])],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return {
    success: true,
    record: structuredRecord,
    extractedText: extractionResult.text,
    rawParserOutput: parserResult.data,
    warnings,
  };
}
