"use client";

import React, { useState, useRef } from "react";
import { useApp } from "@/lib/context";
import { MedicalDocument } from "@/lib/types";

interface DocumentUploadProps {
  userId: string;
  onUploadComplete?: (doc: MedicalDocument) => void;
}

export function DocumentUpload({ userId, onUploadComplete }: DocumentUploadProps) {
  const { addMedicalDocument } = useApp();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedTypes = ["application/pdf", "text/plain", "image/jpeg", "image/png"];

  const handleFile = async (file: File) => {
    setError(null);

    // Validate file type
    if (!supportedTypes.includes(file.type) && !file.type.startsWith("image/")) {
      setError(`Unsupported file type: ${file.type}. Supported: PDF, plain text, images`);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError(`File too large. Maximum: 10MB. Yours: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    setIsUploading(true);

    try {
      // Read file as base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ""));
      
      // Create MedicalDocument record
      const medicalDoc: MedicalDocument = {
        id: Math.random().toString(36).substring(2, 11),
        userId,
        fileName: file.name,
        mimeType: file.type,
        storageKey: `documents/${userId}/${Date.now()}_${file.name}`,
        uploadedAt: Date.now(),
        documentType: inferDocumentType(file.name),
        sourceType: "upload",
        processingStatus: "uploaded",
        metadata: {
          fileSize: file.size,
          base64Content: base64, // Store as base64 in IndexedDB
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await addMedicalDocument(medicalDoc);
      onUploadComplete?.(medicalDoc);

      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(`Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Drag-and-drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickUpload}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className="space-y-2">
          <p className="text-2xl">📄</p>
          <p className="font-semibold text-gray-900">
            {isUploading ? "Uploading..." : "Upload a medical document"}
          </p>
          <p className=" text-gray-600">
            Drag and drop or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Supported: PDF, plain text, images (JPEG, PNG)
          </p>
          <p className="text-xs text-gray-500">Max: 10MB</p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInput}
        accept={supportedTypes.join(", ")}
        className="hidden"
        disabled={isUploading}
      />

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Infer document type from filename.
 */
function inferDocumentType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("lab") || lower.includes("result")) return "lab";
  if (lower.includes("imaging") || lower.includes("xray") || lower.includes("mri")) return "imaging";
  if (lower.includes("prescription") || lower.includes("rx")) return "prescription";
  if (lower.includes("discharge")) return "visit";
  if (lower.includes("referral")) return "note";
  return "unknown";
}
