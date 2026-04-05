import { NextRequest, NextResponse } from "next/server";
import { Document } from "@/lib/types";

/**
 * POST /api/documents/upload
 * Deprecated: Use POST /api/documents with multipart/form-data instead
 * Kept for backward compatibility
 *
 * Converts file to base64 and returns document object
 * Client context persists to wallet
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string | null);
    const category = (formData.get("category") as string | null);

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const id = Math.random().toString(36).substring(2, 11);
    const now = new Date().toISOString();

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileContent = buffer.toString("base64");

    // Get file extension
    const extensions: { [key: string]: string } = {
      "application/pdf": ".pdf",
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/heic": ".heic",
    };
    const extension = extensions[file.type] || ".bin";

    const doc: Document = {
      id,
      title,
      kind: "file",
      fileName: file.name,
      mimeType: file.type,
      extension,
      fileSizeBytes: buffer.length,
      fileContent,
      description: description || undefined,
      category: category as any,
      createdAt: now,
      updatedAt: now,
      aiSummaryStatus: "processing",
    };

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("Failed to upload document:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload document" },
      { status: 500 }
    );
  }
}
