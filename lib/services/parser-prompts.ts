/**
 * Prompts for medical document parsing.
 * Designed to extract structured data while avoiding hallucination.
 */

export function createMedicalParsingPrompt(extractedText: string): string {
  return `You are a medical document structuring assistant. Your task is to extract structured data from the following medical document text.

CRITICAL RULES:
1. Extract ONLY facts explicitly stated in the document
2. DO NOT invent or hallucinate any information
3. Use null for any field you cannot find in the document
4. If you are uncertain about a value, mark it in the "warnings" array
5. Return valid JSON matching the provided schema exactly
6. Dates should be in ISO format (YYYY-MM-DD) or ISO datetime

DOCUMENT TEXT:
---
${extractedText}
---

Extract the following fields into a JSON object. ALL fields are optional and should be null if not found:

{
  "recordType": "visit|lab|imaging|prescription|procedure|diagnosis|allergy|note|unknown",
  "title": "Brief summary title (required)",
  "dateOfService": "ISO date or datetime when service was provided",
  "providerName": "Name of healthcare provider",
  "organizationName": "Name of healthcare facility/clinic",
  "specialty": "Medical specialty (e.g., Cardiology, Dermatology)",
  "facility": "Name of hospital/clinic/lab facility",
  "summary": "Concise summary of the visit/procedure",
  "chiefComplaint": "Why the patient visited",
  "diagnoses": ["Array of diagnosis strings"],
  "medications": ["Any medications mentioned - prescribed or changed"],
  "vitals": { "BP": "120/80", "HR": 72, "Temp": "98.6F" },
  "labs": ["Any tests or lab results mentioned"],
  "procedures": ["Any procedures mentioned"],
  "recommendations": ["Treatment recommendations or advice"],
  "followUpInstructions": ["Any follow-up instructions"],
  "severity": "critical|major|moderate|routine|null",
  "tags": ["Relevant clinical tags"],
  "confidence": 0.0-1.0,
  "missingFields": ["Fields that should exist but are missing"],
  "warnings": ["Any uncertainties or ambiguities about extracted data"]
}

Return ONLY valid JSON. No additional text.`;
}

/**
 * Format parser response for easier validation.
 * Attempts to extract JSON if it's wrapped in markdown or other text.
 */
export function extractJsonFromResponse(response: string): string {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  
  // Try to extract JSON object from response
  const objectMatch = response.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }
  
  // If no extraction needed, return as-is
  return response;
}

/**
 * System prompt for parser API call.
 */
export const PARSER_SYSTEM_PROMPT = `You are a medical document parser. Your goal is to extract structured data from medical documents with high precision.

Key principles:
- Extract only information explicitly present in the document
- Do not infer or hallucinate medical facts
- Represent uncertainty in the "warnings" or "confidence" fields
- Return null for any field that cannot be reliably extracted
- Always return valid JSON

You must respond with ONLY a valid JSON object. No markdown, no explanations, just JSON.`;

/**
 * Temperature setting for parser (lower = more focused/deterministic).
 */
export const PARSER_TEMPERATURE = 0.3; // Conservative, focused responses

/**
 * Max tokens for parser response.
 */
export const PARSER_MAX_TOKENS = 2048;
