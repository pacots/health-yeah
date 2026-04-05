import { NextRequest, NextResponse } from "next/server";
import { Document, ConditionRecord, DocumentConditionSuggestion } from "@/lib/types";
import { generateDocumentSummary, generateImageSummary, analyzeConditionSuggestions } from "@/lib/openai";
// @ts-ignore - pdf-parse doesn't have TypeScript definitions
import pdfParse from "pdf-parse";

/**
 * POST /api/documents/[id]/summarize
 *
 * Generate AI summary for a document that's already been created.
 * Takes the document object from request body (which includes base64 file content)
 * and returns the document with AI summary added.
 *
 * Used by client after document creation to asynchronously generate summaries.
 * Fire-and-forget pattern: client doesn't wait, but can poll for updates.
 */

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (error) {
    console.error("Failed to extract text from PDF:", error);
    return "[PDF extraction failed]";
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestBody = await request.json();
    
    // Handle two formats: 
    // 1. Old format with just document
    // 2. New format with { document, activeConditions }
    const document: Document = requestBody.document || requestBody;
    const activeConditions: ConditionRecord[] = requestBody.activeConditions || [];

    // Validate document
    if (!document || document.id !== id) {
      return NextResponse.json(
        { error: "Invalid document" },
        { status: 400 }
      );
    }

    let contentToProcess = "";

    // Extract content based on document type
    if (document.kind === "text") {
      contentToProcess = document.textContent || "";
    } else if (document.kind === "file" && document.fileContent) {
      // fileContent is base64-encoded or data URL
      let buffer: Buffer;

      if (document.fileContent.startsWith("data:")) {
        // data URL format - extract base64 part
        const base64Data = document.fileContent.split(",")[1];
        buffer = Buffer.from(base64Data, "base64");
      } else {
        // plain base64
        buffer = Buffer.from(document.fileContent, "base64");
      }

      if (document.mimeType === "application/pdf") {
        // Extract text from PDF
        contentToProcess = await extractTextFromPDF(buffer);
      } else if (document.mimeType?.startsWith("image/")) {
        // Handle images with vision API
        // For images, send base64 directly
        const base64Image = document.fileContent.includes(",")
          ? document.fileContent.split(",")[1]
          : document.fileContent;

        const summary = await generateImageSummary(base64Image, document.title);

        const updatedDoc: Document = {
          ...document,
          aiStructuredSummary: summary || undefined,
          aiSummaryStatus: summary ? "ready" : "error",
          aiSummaryGeneratedAt: new Date().toISOString(),
          aiSummaryError: summary ? undefined : "Failed to generate image summary",
          updatedAt: new Date().toISOString(),
        };

        return NextResponse.json(updatedDoc, { status: 200 });
      }
    }

    // Generate summary from text content
    let summary: string | null = null;
    let error: string | undefined;

    if (contentToProcess) {
      summary = await generateDocumentSummary(
        contentToProcess,
        document.title,
        document.mimeType
      );
    } else {
      error = "No content to summarize";
    }

    // Analyze conditions based on the summary
    let suggestions: DocumentConditionSuggestion[] = [];
    if (summary && activeConditions.length > 0) {
      suggestions = await analyzeConditionSuggestions(summary, activeConditions);
    }

    // Return updated document with AI summary and suggestions
    const updatedDoc: Document = {
      ...document,
      aiStructuredSummary: summary || undefined,
      aiSummaryStatus: summary ? "ready" : "error",
      aiSummaryGeneratedAt: new Date().toISOString(),
      aiSummaryError: error,
      aiConditionSuggestions: suggestions,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedDoc, { status: 200 });
  } catch (error) {
    console.error("Failed to generate AI summary:", error);

    // Extract document from body to return error response
    try {
      const requestBody = await request.json();
      const document: Document = requestBody.document || requestBody;
      return NextResponse.json(
        {
          ...document,
          aiSummaryStatus: "error",
          aiSummaryError: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 200 }
      );
    } catch {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to generate summary" },
        { status: 500 }
      );
    }
  }
}
