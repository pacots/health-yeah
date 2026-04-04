import { NextRequest, NextResponse } from "next/server";
import { createDocument } from "@/lib/document-storage";

/**
 * POST /api/documents/upload
 * Deprecated: Use POST /api/documents with multipart/form-data instead
 * Kept for backward compatibility
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = (formData.get("title") as string) || "";
    const description = (formData.get("description") as string | null);
    const category = (formData.get("category") as string | null);

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const id = Math.random().toString(36).substring(2, 11);
    const buffer = Buffer.from(await file.arrayBuffer());

    const doc = createDocument({
      id,
      title,
      fileName: file.name,
      mimeType: file.type,
      fileBuffer: buffer,
      description: description || undefined,
      category: category || undefined,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("Failed to upload document:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload document" },
      { status: 500 }
    );
  }
}
