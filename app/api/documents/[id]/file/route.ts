import { NextRequest, NextResponse } from "next/server";
import { getDocumentById, readFile } from "@/lib/document-storage";

/**
 * GET /api/documents/:id/file
 * Download or stream a file document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = getDocumentById(id);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.kind !== "file") {
      return NextResponse.json(
        { error: "Document is not a file" },
        { status: 400 }
      );
    }

    const fileBuffer = readFile(id);
    if (!fileBuffer) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Return file with appropriate headers
    return new NextResponse(fileBuffer as any, {
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${doc.fileName}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to download file:", error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}
