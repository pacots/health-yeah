import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/documents/:id/file
 *
 * Note: Files are stored client-side in wallet documents as base64/fileContent
 *
 * To download files, the client should:
 * 1. Get the document from wallet state
 * 2. Decode fileContent from base64
 * 3. Create a blob and trigger download directly
 *
 * This endpoint is kept for compatibility but cannot access client-side data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return NextResponse.json(
      { error: "File downloads should be handled client-side. Use document.fileContent to decode and download." },
      { status: 404 }
    );
  } catch (error) {
    console.error("Failed to download file:", error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}
