import OpenAI from "openai";

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
