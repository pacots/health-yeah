"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Patient, Record, Document, Share } from "./types";
import { storage, generateShareId } from "./storage";

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

  // Utility
  initialize: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize app
  const initialize = async () => {
    setLoading(true);
    try {
      // Add a timeout to prevent indefinite loading on first visit
      const initPromise = storage.initializeWithDemoData();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Initialization timeout")), 5000)
      );

      const { patient: p, records: r, documents: d } = await Promise.race([
        initPromise,
        timeoutPromise,
      ]) as any;

      setPatient(p);
      setRecords(r);
      setDocuments(d);
    } catch (error) {
      console.error("Failed to initialize:", error);
      // Initialize with defaults if storage fails
      setLoading(false);
      setTimeout(() => initialize(), 1000); // Retry after 1 second
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Ensure this only runs on client
    if (typeof window !== "undefined") {
      initialize();
    }
  }, []);

  // Patient actions
  const updatePatient = async (updatedPatient: Patient) => {
    const patientWithTimestamp = {
      ...updatedPatient,
      updatedAt: Date.now(),
    };
    setPatient(patientWithTimestamp);
    await storage.setPatient(patientWithTimestamp);
  };

  // Record actions
  const addRecord = async (recordData: Omit<Record, "id" | "createdAt" | "updatedAt">) => {
    const newRecord: Record = {
      ...recordData,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updatedRecords = [...records, newRecord];
    setRecords(updatedRecords);
    await storage.setRecords(updatedRecords);
  };

  const updateRecord = async (updatedRecord: Record) => {
    const recordWithTimestamp = {
      ...updatedRecord,
      updatedAt: Date.now(),
    };
    const updatedRecords = records.map((r) => (r.id === recordWithTimestamp.id ? recordWithTimestamp : r));
    setRecords(updatedRecords);
    await storage.setRecords(updatedRecords);
  };

  const deleteRecord = async (id: string) => {
    const updatedRecords = records.filter((r) => r.id !== id);
    setRecords(updatedRecords);
    await storage.setRecords(updatedRecords);
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
    await storage.setDocuments(updatedDocuments);
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
    await storage.setDocuments(updatedDocuments);
  };

  const deleteDocument = async (id: string) => {
    const updatedDocuments = documents.filter((d) => d.id !== id);
    setDocuments(updatedDocuments);
    await storage.setDocuments(updatedDocuments);
  };

  // Share actions
  const createShare = async (scope: "emergency" | "continuity", selectedRecordIds: string[]) => {
    if (!patient) throw new Error("No patient found");

    const selectedRecords = records.filter((r) => selectedRecordIds.includes(r.id));
    const selectedDocuments =
      scope === "continuity" ? documents.filter((d) => selectedRecordIds.includes(d.id)) : [];

    const share: Share = {
      id: generateShareId(),
      scope,
      patientSnapshot: patient,
      recordSnapshots: selectedRecords,
      documentSnapshots: selectedDocuments,
      createdAt: Date.now(),
    };

    await storage.setShare(share);
    return share;
  };

  const getShare = async (shareId: string) => {
    return storage.getShare(shareId);
  };

  const getAllShares = async () => {
    return storage.getAllShares();
  };

  const deleteShare = async (shareId: string) => {
    await storage.deleteShare(shareId);
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
    initialize,
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
