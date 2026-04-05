import OpenAI from "openai";
import { ConditionRecord, DocumentConditionSuggestion } from "./types";

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
