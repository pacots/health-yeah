import OpenAI from "openai";
import { ConditionRecord, DocumentConditionSuggestion, ExtractedEntity, ExistingEntity, EntityMatchResult, AllergyRecord, MedicationRecord } from "./types";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("OPENAI_API_KEY not found. AI document summaries will be unavailable.");
}

export const openai = apiKey ? new OpenAI({ apiKey }) : null;

/**
 * Generate a structured AI summary for document content using OpenAI GPT-4 Mini
 * Returns null if OpenAI is not configured
 * Uses gpt-4o-mini for cost efficiency
 */
export async function generateDocumentSummary(
  content: string,
  title: string,
  mimeType?: string
): Promise<string | null> {
  if (!openai) {
    return null;
  }

  try {
    // Truncate very long content to manage token usage
    const maxChars = 6000;
    const truncatedContent = content.length > maxChars
      ? content.substring(0, maxChars) + "\n... [content truncated]"
      : content;

    const prompt = `You are a medical document analyzer. Extract and summarize the following ${
      mimeType === "application/pdf" ? "PDF" : "medical"
    } document titled "${title}" in a structured, provider-facing format. 
Limit yourself to summarizing using the information present in the original document, and do not add any of your own interpretations. 
If there is no relevant information simply state "None".

DOCUMENT CONTENT:
${truncatedContent}

Provide a concise structured summary with these sections (if applicable):

**Document Type:** [Clinical note, Lab result, Prescription, Imaging report, etc.]
**Clinical Summary:** [1-2 sentences of key clinical findings]
**Key Findings:** [Bullet points of important results/findings]
**Medications Mentioned:** [If any]
**Conditions/Diagnoses:** [If any]
**Allergies Mentioned:** [If any]
**Important Dates:** [If any]
**Provider Notes:** [Anything relevant for clinical care]
**Limitations:** [Data quality, incomplete info, or uncertainty]

Keep it professional, concise, and clinically relevant. Avoid markdown formatting. Use plain text with clear section headers.`;

    const message = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const summaryText = message.choices[0]?.message?.content || null;
    return summaryText;
  } catch (error) {
    console.error("Failed to generate document summary:", error);
    return null;
  }
}

/**
 * Generate summary from image using vision API
 * Uses gpt-4o-mini with vision capability
 */
export async function generateImageSummary(
  base64Image: string,
  title: string
): Promise<string | null> {
  if (!openai) {
    return null;
  }

  try {
    const message = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
            {
              type: "text",
              text: `You are a medical document analyzer. This image is titled "${title}". Extract and summarize it in a structured, provider-facing format.
Limit yourself to summarizing using the information present in the original document, and do not add any of your own interpretations. 
If there is no relevant information simply state "None".

Provide a concise structured summary with these sections (if applicable):

**Document Type:** [Clinical note, Lab result, Prescription, Imaging report, etc.]
**Clinical Summary:** [1-2 sentences of key clinical findings]
**Key Findings:** [Bullet points of important results/findings]
**Medications Mentioned:** [If any]
**Conditions/Diagnoses:** [If any]
**Allergies Mentioned:** [If any]
**Important Dates:** [If any]
**Provider Notes:** [Anything relevant for clinical care]
**Limitations:** [Data quality, incomplete info, or uncertainty]

Keep it professional, concise, and clinically relevant. Avoid markdown formatting. Use plain text with clear section headers.`,
            },
          ],
        },
      ],
    });

    const summaryText = message.choices[0]?.message?.content || null;
    return summaryText;
  } catch (error) {
    console.error("Failed to generate image summary:", error);
    return null;
  }
}

/**
 * Analyze a document summary to suggest links to existing conditions or new diagnoses
 * Returns structured AI suggestions for the user to review and confirm
 */
export async function analyzeConditionSuggestions(
  documentSummary: string,
  activeConditions: ConditionRecord[]
): Promise<DocumentConditionSuggestion[]> {
  if (!openai) {
    return [];
  }

  try {
    // Format active conditions for the prompt
    const conditionList = activeConditions
      .filter((c) => c.status === "active")
      .map((c) => `- ${c.name} (${c.source})`)
      .join("\n");

    const prompt = `You are a medical document analyzer. Given the following document summary and the patient's current active conditions, determine if the document:

1. Relates strongly to an existing active condition - suggest LINKING to that condition
2. Describes a newly diagnosed condition NOT in the active list - suggest CREATING a new condition
3. Is not clearly related to any condition - return no suggestions

Current active conditions:
${conditionList || "None"}

Document Summary:
${documentSummary}

Respond with ONLY a valid JSON array, no other text. Each suggestion object must have this exact structure:
{
  "type": "link-existing" | "create-new",
  "conditionName": "string (the condition name)",
  "matchedConditionId": "string (only if type is link-existing, match against active condition names)",
  "confidence": number (0.0 to 1.0, how confident the suggestion is),
  "reason": "string (brief explanation for why this suggestion was made)"
}

Rules:
- Only suggest if confidence >= 0.6
- For "link-existing", matchedConditionId should be the name of an existing active condition
- For "create-new", do NOT include matchedConditionId
- Return empty array [] if no suggestions meet confidence threshold
- Do NOT include any text outside the JSON array`;

    const message = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.choices[0]?.message?.content || "[]";

    // Parse the JSON response safely
    try {
      // Try to extract JSON from the response (in case model adds extra text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      const suggestions = JSON.parse(jsonStr) as DocumentConditionSuggestion[];

      // Validate suggestions structure
      return suggestions.filter((s) => {
        return (
          s.type &&
          s.conditionName &&
          typeof s.confidence === "number" &&
          s.confidence >= 0.6
        );
      });
    } catch (parseError) {
      console.warn(
        "Failed to parse condition suggestions JSON:",
        responseText,
        parseError
      );
      return [];
    }
  } catch (error) {
    console.error("Failed to analyze condition suggestions:", error);
    return [];
  }
}

/**
 * Parse document summary text into structured extracted entities
 * Extracts medications, conditions, and allergies from the summary sections
 */
export function parseDocumentSummaryIntoEntities(summary: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  // Parse medications section
  const medicationsMatch = summary.match(/\*\*Medications Mentioned:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/);
  if (medicationsMatch) {
    const medicationsText = medicationsMatch[1].trim();
    if (medicationsText && medicationsText !== "None") {
      const lines = medicationsText.split(/[\n\*\-•]/);
      for (const line of lines) {
        const clean = line.trim();
        if (clean && clean.length > 0) {
          entities.push({ type: 'medication', name: clean });
        }
      }
    }
  }

  // Parse conditions/diagnoses section
  const conditionsMatch = summary.match(/\*\*Conditions\/Diagnoses:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/);
  if (conditionsMatch) {
    const conditionsText = conditionsMatch[1].trim();
    if (conditionsText && conditionsText !== "None") {
      const lines = conditionsText.split(/[\n\*\-•]/);
      for (const line of lines) {
        const clean = line.trim();
        if (clean && clean.length > 0) {
          entities.push({ type: 'condition', name: clean });
        }
      }
    }
  }

  // Parse allergies section
  const allergiesMatch = summary.match(/\*\*Allergies Mentioned:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/);
  if (allergiesMatch) {
    const allergiesText = allergiesMatch[1].trim();
    if (allergiesText && allergiesText !== "None") {
      const lines = allergiesText.split(/[\n\*\-•]/);
      for (const line of lines) {
        const clean = line.trim();
        if (clean && clean.length > 0) {
          entities.push({ type: 'allergy', name: clean });
        }
      }
    }
  }

  return entities;
}

/**
 * Generate unified AI entity matching results
 * Compares extracted entities from document against existing patient entities
 * Returns structured match decisions for all entity types
 */
export async function generateUnifiedEntityMatches(
  extractedEntities: ExtractedEntity[],
  existingEntities: ExistingEntity[]
): Promise<EntityMatchResult[]> {
  if (!openai) {
    return [];
  }

  if (extractedEntities.length === 0) {
    return [];
  }

  try {
    const extractedFormatted = extractedEntities
      .map((e) => `- ${e.type}: ${e.name}`)
      .join("\n");

    const existingFormatted = existingEntities.length > 0
      ? existingEntities
        .map((e) => `- ${e.type}: ${e.name} (id: ${e.id})`)
        .join("\n")
      : "None";

    const prompt = `You are a medical entity matching system. Compare extracted medical entities from a document against existing patient entities.

RULES:
1. Compare only entities of the SAME type (condition vs condition, allergy vs allergy, medication vs medication)
2. Never cross-match different types
3. Normalize obvious synonyms ("high blood pressure" = "Hypertension", "penicillin allergy" = "Penicillin", etc.)
4. For medications, normalize dosages and frequencies when matching
5. Only suggest link-existing if confidence >= 0.6
6. Always provide a normalizedName for display/storage
7. Respond with ONLY a JSON array, no other text

**Extracted Entities:**
${extractedFormatted}

**Existing Patient Entities:**
${existingFormatted}

For each extracted entity, return ONE result JSON object with this structure:
{
  "type": "condition" | "allergy" | "medication",
  "extractedName": "string (exact name from above)",
  "finalName": "string (normalized/standardized name)",
  "action": "link-existing" | "create-new",
  "matchedId": "string (only if action is link-existing, match an ID from above)",
  "confidence": number (0.0-1.0),
  "reason": "string (brief explanation)"
}

Return ONLY a JSON array like: [{ ... }, { ... }]
Return empty array [] if no extracted entities.`;

    const message = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.choices[0]?.message?.content || "[]";

    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      const matches = JSON.parse(jsonStr) as EntityMatchResult[];

      return matches.filter((m) => {
        return (
          m.type &&
          m.extractedName &&
          m.finalName &&
          m.action &&
          typeof m.confidence === "number"
        );
      });
    } catch (parseError) {
      console.warn("Failed to parse entity matches JSON:", responseText, parseError);
      return [];
    }
  } catch (error) {
    console.error("Failed to generate entity matches:", error);
    return [];
  }
}
