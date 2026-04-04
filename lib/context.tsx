"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Patient,
  Record,
  Document,
  Share,
  Wallet,
  MedicalDocument,
  DocumentExtraction,
  StructuredMedicalRecord,
  MedicalHistoryEntry,
} from "./types";
import { storage, generateShareId } from "./storage";

type AppContextType = {
  // State - Core records
  patient: Patient | null;
  records: Record[];
  documents: Document[];
  loading: boolean;

  // State - Medical document ingestion
  medicalDocuments: MedicalDocument[];
  documentExtractions: DocumentExtraction[];
  structuredMedicalRecords: StructuredMedicalRecord[];
  medicalHistoryEntries: MedicalHistoryEntry[];

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

  // Medical document actions
  addMedicalDocument: (doc: MedicalDocument) => Promise<void>;
  updateMedicalDocument: (doc: MedicalDocument) => Promise<void>;
  deleteMedicalDocument: (id: string) => Promise<void>;
  addDocumentExtraction: (extraction: DocumentExtraction) => Promise<void>;
  addStructuredMedicalRecord: (record: StructuredMedicalRecord) => Promise<void>;
  updateStructuredMedicalRecord: (record: StructuredMedicalRecord) => Promise<void>;
  addMedicalHistoryEntry: (entry: MedicalHistoryEntry) => Promise<void>;
  updateMedicalHistoryEntry: (entry: MedicalHistoryEntry) => Promise<void>;

  // Share actions
  createShare: (scope: "emergency" | "continuity", selectedRecordIds: string[]) => Promise<Share>;
  getShare: (shareId: string) => Promise<Share | null>;
  getAllShares: () => Promise<Share[]>;
  deleteShare: (shareId: string) => Promise<void>;

  // Utility
  resetToDemo: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [medicalDocuments, setMedicalDocuments] = useState<MedicalDocument[]>([]);
  const [documentExtractions, setDocumentExtractions] = useState<DocumentExtraction[]>([]);
  const [structuredMedicalRecords, setStructuredMedicalRecords] = useState<StructuredMedicalRecord[]>([]);
  const [medicalHistoryEntries, setMedicalHistoryEntries] = useState<MedicalHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize app - load wallet once
  useEffect(() => {
    const initialize = async () => {
      try {
        const wallet = await storage.initializeWallet();
        setPatient(wallet.patient);
        setRecords(wallet.records);
        setDocuments(wallet.documents);
        setMedicalDocuments(wallet.medicalDocuments || []);
        setDocumentExtractions(wallet.documentExtractions || []);
        setStructuredMedicalRecords(wallet.structuredMedicalRecords || []);
        setMedicalHistoryEntries(wallet.medicalHistoryEntries || []);
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
    medicalDocuments?: MedicalDocument[];
    documentExtractions?: DocumentExtraction[];
    structuredMedicalRecords?: StructuredMedicalRecord[];
    medicalHistoryEntries?: MedicalHistoryEntry[];
  }) => {
    const wallet: Wallet = {
      patient: updates.patient ?? patient!,
      records: updates.records ?? records,
      documents: updates.documents ?? documents,
      medicalDocuments: updates.medicalDocuments ?? medicalDocuments,
      documentExtractions: updates.documentExtractions ?? documentExtractions,
      structuredMedicalRecords: updates.structuredMedicalRecords ?? structuredMedicalRecords,
      medicalHistoryEntries: updates.medicalHistoryEntries ?? medicalHistoryEntries,
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

  // Medical document actions
  const addMedicalDocument = async (doc: MedicalDocument) => {
    const updatedDocs = [...medicalDocuments, doc];
    setMedicalDocuments(updatedDocs);
    await persistWallet({ medicalDocuments: updatedDocs });
  };

  const updateMedicalDocument = async (doc: MedicalDocument) => {
    const updatedDocs = medicalDocuments.map((d) => (d.id === doc.id ? doc : d));
    setMedicalDocuments(updatedDocs);
    await persistWallet({ medicalDocuments: updatedDocs });
  };

  const deleteMedicalDocument = async (id: string) => {
    const updatedDocs = medicalDocuments.filter((d) => d.id !== id);
    setMedicalDocuments(updatedDocs);
    await persistWallet({ medicalDocuments: updatedDocs });
  };

  const addDocumentExtraction = async (extraction: DocumentExtraction) => {
    const updatedExtractions = [...documentExtractions, extraction];
    setDocumentExtractions(updatedExtractions);
    await persistWallet({ documentExtractions: updatedExtractions });
  };

  const addStructuredMedicalRecord = async (record: StructuredMedicalRecord) => {
    const updatedRecords = [...structuredMedicalRecords, record];
    setStructuredMedicalRecords(updatedRecords);
    await persistWallet({ structuredMedicalRecords: updatedRecords });
  };

  const updateStructuredMedicalRecord = async (record: StructuredMedicalRecord) => {
    const updatedRecords = structuredMedicalRecords.map((r) => (r.id === record.id ? record : r));
    setStructuredMedicalRecords(updatedRecords);
    await persistWallet({ structuredMedicalRecords: updatedRecords });
  };

  const addMedicalHistoryEntry = async (entry: MedicalHistoryEntry) => {
    const updatedEntries = [...medicalHistoryEntries, entry];
    setMedicalHistoryEntries(updatedEntries);
    await persistWallet({ medicalHistoryEntries: updatedEntries });
  };

  const updateMedicalHistoryEntry = async (entry: MedicalHistoryEntry) => {
    const updatedEntries = medicalHistoryEntries.map((e) => (e.id === entry.id ? entry : e));
    setMedicalHistoryEntries(updatedEntries);
    await persistWallet({ medicalHistoryEntries: updatedEntries });
  };

  // Share actions
  const createShare = async (scope: "emergency" | "continuity", selectedRecordIds: string[]) => {
    if (!patient) throw new Error("No patient found");

    const selectedRecords = records.filter((r) => selectedRecordIds.includes(r.id));
    const selectedDocuments = scope === "continuity" ? documents : [];

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
    medicalDocuments,
    documentExtractions,
    structuredMedicalRecords,
    medicalHistoryEntries,
    loading,
    updatePatient,
    addRecord,
    updateRecord,
    deleteRecord,
    addDocument,
    updateDocument,
    deleteDocument,
    addMedicalDocument,
    updateMedicalDocument,
    deleteMedicalDocument,
    addDocumentExtraction,
    addStructuredMedicalRecord,
    updateStructuredMedicalRecord,
    addMedicalHistoryEntry,
    updateMedicalHistoryEntry,
    createShare,
    getShare,
    getAllShares,
    deleteShare,
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
