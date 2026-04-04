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

  // Document actions
  addDocument: (document: Omit<Document, "id" | "createdAt" | "updatedAt">) => Promise<void>;
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
        const wallet = await storage.initializeWallet();
        setPatient(wallet.patient);
        setRecords(wallet.records);
        setDocuments(wallet.documents);
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
  const addDocument = async (documentData: Omit<Document, "id" | "createdAt" | "updatedAt">) => {
    const newDocument: Document = {
      ...documentData,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updatedDocuments = [...documents, newDocument];
    setDocuments(updatedDocuments);
    await persistWallet({ documents: updatedDocuments });
  };

  const updateDocument = async (updatedDocument: Document) => {
    const documentWithTimestamp = {
      ...updatedDocument,
      updatedAt: Date.now(),
    };
    const updatedDocuments = documents.map((d) =>
      d.id === documentWithTimestamp.id ? documentWithTimestamp : d
    );
    setDocuments(updatedDocuments);
    await persistWallet({ documents: updatedDocuments });
  };

  const deleteDocument = async (id: string) => {
    const updatedDocuments = documents.filter((d) => d.id !== id);
    setDocuments(updatedDocuments);
    await persistWallet({ documents: updatedDocuments });
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
