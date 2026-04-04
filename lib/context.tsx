"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Patient, Record, Document, Share, Wallet } from "./types";
import { storage, generateShareId } from "./storage";
import { createRemoteShare, getRemoteShare, revokeRemoteShare } from "./supabase";
import { buildShareSnapshot } from "./sharing/buildShareSnapshot";

type AppContextType = {
  // State
  patient: Patient | null;
  records: Record[];
  documents: Document[];
  loading: boolean;

  // Patient actions
  updatePatient: (patient: Patient) => Promise<void>;

  // Record actions
  addRecord: (record: Omit<Record, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateRecord: (record: Record) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;

  // Document actions - unified interface
  addDocument: (params: {
    title: string;
    textContent?: string;
    file?: File;
    description?: string;
    category?: string;
  }) => Promise<Document>;
  updateDocument: (document: Document) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;

  // Share actions
  createShare: (scope: "emergency" | "continuity", selectedRecordIds: string[]) => Promise<Share>;
  getShare: (shareId: string) => Promise<Share | null>;
  getAllShares: () => Promise<Share[]>;
  deleteShare: (shareId: string) => Promise<void>;
  revokeShare: (shareId: string) => Promise<void>;

  // Utility
  resetToDemo: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize app - load wallet once
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load existing wallet data
        const wallet = await storage.initializeWallet();
        setPatient(wallet.patient);
        setRecords(wallet.records);

        // Load documents from API
        try {
          const response = await fetch("/api/documents");
          if (response.ok) {
            const docs = await response.json();
            setDocuments(docs);
          } else {
            // Fallback to wallet documents if API fails
            setDocuments(wallet.documents);
          }
        } catch (error) {
          console.warn("Failed to load documents from API, using wallet data:", error);
          setDocuments(wallet.documents);
        }
      } catch (error) {
        console.error("Failed to initialize wallet:", error);
      } finally {
        setLoading(false);
      }
    };

    // Only run on client
    if (typeof window !== "undefined") {
      initialize();
    }
  }, []);

  // Persist entire wallet after any change
  const persistWallet = async (updates: {
    patient?: Patient;
    records?: Record[];
    documents?: Document[];
  }) => {
    const wallet: Wallet = {
      patient: updates.patient ?? patient!,
      records: updates.records ?? records,
      documents: updates.documents ?? documents,
      shares: (await storage.getWallet())?.shares || {},
    };
    await storage.setWallet(wallet);
  };

  // Patient actions
  const updatePatient = async (updatedPatient: Patient) => {
    const patientWithTimestamp = {
      ...updatedPatient,
      updatedAt: Date.now(),
    };
    setPatient(patientWithTimestamp);
    await persistWallet({ patient: patientWithTimestamp });
  };

  // Record actions
  const addRecord = async (recordData: Omit<Record, "id" | "createdAt" | "updatedAt">) => {
    const newRecord: Record = {
      ...recordData,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as Record;
    const updatedRecords = [...records, newRecord];
    setRecords(updatedRecords);
    await persistWallet({ records: updatedRecords });
  };

  const updateRecord = async (updatedRecord: Record) => {
    const recordWithTimestamp = {
      ...updatedRecord,
      updatedAt: Date.now(),
    };
    const updatedRecords = records.map((r) => (r.id === recordWithTimestamp.id ? recordWithTimestamp : r));
    setRecords(updatedRecords);
    await persistWallet({ records: updatedRecords });
  };

  const deleteRecord = async (id: string) => {
    const updatedRecords = records.filter((r) => r.id !== id);
    setRecords(updatedRecords);
    await persistWallet({ records: updatedRecords });
  };

  // Document actions
  const addDocument = async (params: {
    title: string;
    textContent?: string;
    file?: File;
    description?: string;
    category?: string;
  }): Promise<Document> => {
    try {
      if (params.file) {
        // File document
        const formData = new FormData();
        formData.append("file", params.file);
        formData.append("title", params.title);
        if (params.description) formData.append("description", params.description);
        if (params.category) formData.append("category", params.category);

        const response = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create document");
        }

        const newDocument = await response.json();
        const updatedDocuments = [...documents, newDocument];
        setDocuments(updatedDocuments);
        await persistWallet({ documents: updatedDocuments });
        return newDocument;
      } else {
        // Text document
        const response = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: params.title,
            textContent: params.textContent,
            description: params.description,
            category: params.category,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create document");
        }

        const newDocument = await response.json();
        const updatedDocuments = [...documents, newDocument];
        setDocuments(updatedDocuments);
        await persistWallet({ documents: updatedDocuments });
        return newDocument;
      }
    } catch (error) {
      console.error("Failed to create document:", error);
      throw error;
    }
  };

  const updateDocument = async (updatedDocument: Document) => {
    const updatedDocuments = documents.map((d) =>
      d.id === updatedDocument.id ? updatedDocument : d
    );
    setDocuments(updatedDocuments);
    await persistWallet({ documents: updatedDocuments });
  };

  const deleteDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      const updatedDocuments = documents.filter((d) => d.id !== id);
      setDocuments(updatedDocuments);
      await persistWallet({ documents: updatedDocuments });
    } catch (error) {
      console.error("Failed to delete document:", error);
      throw error;
    }
  };

  // Share actions
  const createShare = async (scope: "emergency" | "continuity", selectedRecordIds: string[]) => {
    if (!patient) throw new Error("No patient found");

    const selectedRecords = records.filter((r) => selectedRecordIds.includes(r.id));
    const shareId = generateShareId();

    // Build share snapshot with correct payload per scope
    const shareSnapshot = buildShareSnapshot(scope, patient, selectedRecords, documents);
    shareSnapshot.id = shareId;

    try {
      // Upload to Supabase first (primary storage for cross-device access)
      await createRemoteShare(shareId, scope, shareSnapshot);
    } catch (error) {
      console.warn("Failed to create remote share, save will be local-only:", error);
      // Continue: save locally as fallback
    }

    // Also save locally for same-device access and backward compatibility
    await storage.setShare(shareSnapshot);

    return shareSnapshot;
  };

  const getShare = async (shareId: string) => {
    // Try remote storage first (Supabase) for cross-device access
    try {
      const remoteShare = await getRemoteShare(shareId);
      if (remoteShare) {
        return remoteShare;
      }
    } catch (error) {
      console.warn("Failed to fetch remote share, trying local storage:", error);
    }

    // Fall back to local storage (backward compatibility)
    return storage.getShare(shareId);
  };

  const getAllShares = async () => {
    return storage.getAllShares();
  };

  const deleteShare = async (shareId: string) => {
    // Revoke remotely (marks as revoked instead of deleting)
    try {
      await revokeRemoteShare(shareId);
    } catch (error) {
      console.warn("Failed to revoke remote share:", error);
    }

    // Also delete locally
    await storage.deleteShare(shareId);
  };

  const revokeShare = async (shareId: string) => {
    // Revoke remotely (same as deleteShare - marks as revoked)
    try {
      await revokeRemoteShare(shareId);
    } catch (error) {
      console.warn("Failed to revoke remote share:", error);
    }

    // Also delete locally
    await storage.deleteShare(shareId);
  };

  // Reset to demo data
  const resetToDemo = async () => {
    const wallet = await storage.resetToDemoData();
    setPatient(wallet.patient);
    setRecords(wallet.records);
    setDocuments(wallet.documents);
  };

  const value: AppContextType = {
    patient,
    records,
    documents,
    loading,
    updatePatient,
    addRecord,
    updateRecord,
    deleteRecord,
    addDocument,
    updateDocument,
    deleteDocument,
    createShare,
    getShare,
    getAllShares,
    deleteShare,
    revokeShare,
    resetToDemo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
