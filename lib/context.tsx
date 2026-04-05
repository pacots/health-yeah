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

  // Document-Condition suggestion actions
  linkDocumentToExistingCondition: (documentId: string, conditionId: string) => Promise<void>;
  createNewConditionFromSuggestion: (
    suggestion: import("./types").DocumentConditionSuggestion,
    documentId: string
  ) => Promise<void>;
  dismissConditionSuggestion: (documentId: string, suggestionIndex: number) => Promise<void>;
  acceptConditionSuggestionWithManualSelect: (
    documentId: string,
    suggestionIndex: number,
    selectedConditionId: string
  ) => Promise<void>;
  unlinkDocumentFromCondition: (documentId: string, conditionId: string) => Promise<void>;

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
        // Load documents from wallet (client-side storage)
        // API is only used for document creation/updates, not for loading
        const walletDocs = wallet.documents || [];
        setDocuments(walletDocs);
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
      documents: updates.documents ?? (Array.isArray(documents) ? documents : []),
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
      // Ensure documents is an array before proceeding
      const currentDocs = Array.isArray(documents) ? documents : [];
      
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
        const updatedDocuments = [...currentDocs, newDocument];
        setDocuments(updatedDocuments);
        await persistWallet({ documents: updatedDocuments });

        // Trigger AI processing asynchronously (fire-and-forget)
        triggerAIProcessingAsync(newDocument, updatedDocuments);

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
        const updatedDocuments = [...currentDocs, newDocument];
        setDocuments(updatedDocuments);
        await persistWallet({ documents: updatedDocuments });

        // Trigger AI processing asynchronously (fire-and-forget)
        triggerAIProcessingAsync(newDocument, updatedDocuments);

        return newDocument;
      }
    } catch (error) {
      console.error("Failed to create document:", error);
      throw error;
    }
  };

  // Helper: Trigger AI processing asynchronously
  const triggerAIProcessingAsync = (newDocument: Document, docList: Document[]) => {
    // Fire-and-forget: don't wait for response, but fetch updates
    const processAI = async () => {
      try {
        // Get active conditions for condition linking suggestions
        const activeConditions = records.filter(
          (r) => r.type === "condition" && r.status === "active"
        );

        const response = await fetch(`/api/documents/${newDocument.id}/summarize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document: newDocument,
            activeConditions,
          }),
        });

        if (!response.ok) {
          console.warn("AI processing failed:", await response.text());
          return;
        }

        const updatedDocument = await response.json();

        // Update wallet with AI summary results
        const updatedDocs = docList.map((d) =>
          d.id === updatedDocument.id ? updatedDocument : d
        );
        setDocuments(updatedDocs);
        await persistWallet({ documents: updatedDocs });
      } catch (error) {
        console.error("Failed to process AI for document:", error);
      }
    };

    processAI();
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

  // Document-Condition suggestion actions
  const linkDocumentToExistingCondition = async (documentId: string, conditionId: string) => {
    // Update document: add conditionId to linkedConditionIds
    const updatedDocuments = documents.map((d) => {
      if (d.id === documentId) {
        const linkedIds = d.linkedConditionIds || [];
        if (!linkedIds.includes(conditionId)) {
          linkedIds.push(conditionId);
        }
        return {
          ...d,
          linkedConditionIds: linkedIds,
        };
      }
      return d;
    });

    // Update condition: add documentId to linkedDocumentIds
    const updatedRecords = records.map((r) => {
      if (r.id === conditionId && r.type === "condition") {
        const docIds = ((r as any).linkedDocumentIds as string[] | undefined) || [];
        if (!docIds.includes(documentId)) {
          docIds.push(documentId);
        }
        return {
          ...r,
          linkedDocumentIds: docIds,
        };
      }
      return r;
    });

    setDocuments(updatedDocuments);
    setRecords(updatedRecords);
    await persistWallet({ documents: updatedDocuments, records: updatedRecords });
  };

  const createNewConditionFromSuggestion = async (
    suggestion: import("./types").DocumentConditionSuggestion,
    documentId: string
  ) => {
    // Create new condition with ai-suggested source
    const newCondition: Record = {
      id: Math.random().toString(36).substring(2, 11),
      type: "condition",
      name: suggestion.conditionName,
      status: "active",
      source: "ai-suggested",
      linkedDocumentIds: [documentId],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as Record;

    // Add to records
    const updatedRecords = [...records, newCondition];

    // Update document: add conditionId to linkedConditionIds and mark suggestion as accepted
    const currentDoc = documents.find((d) => d.id === documentId);
    const currentSuggestions = currentDoc?.aiConditionSuggestions || [];
    const suggestionIndex = currentSuggestions.indexOf(suggestion);

    const updatedDocuments = documents.map((d) => {
      if (d.id === documentId) {
        const linkedIds = d.linkedConditionIds || [];
        if (!linkedIds.includes(newCondition.id)) {
          linkedIds.push(newCondition.id);
        }

        // Mark suggestion as accepted
        let updatedSuggestions = [...(d.aiConditionSuggestions || [])];
        if (suggestionIndex >= 0 && updatedSuggestions[suggestionIndex]) {
          updatedSuggestions[suggestionIndex] = {
            ...updatedSuggestions[suggestionIndex],
            reviewed: true,
            accepted: true,
            matchedConditionId: newCondition.id,
          };
        }

        return {
          ...d,
          linkedConditionIds: linkedIds,
          aiConditionSuggestions: updatedSuggestions,
        };
      }
      return d;
    });

    setRecords(updatedRecords);
    setDocuments(updatedDocuments);
    await persistWallet({ records: updatedRecords, documents: updatedDocuments });
  };

  const dismissConditionSuggestion = async (documentId: string, suggestionIndex: number) => {
    // Mark suggestion as reviewed and dismissed (rejected)
    const updatedDocuments = documents.map((d) => {
      if (d.id === documentId && d.aiConditionSuggestions) {
        const suggestions = [...d.aiConditionSuggestions];
        if (suggestions[suggestionIndex]) {
          suggestions[suggestionIndex] = {
            ...suggestions[suggestionIndex],
            reviewed: true,
            accepted: false,
          };
        }
        return {
          ...d,
          aiConditionSuggestions: suggestions,
        };
      }
      return d;
    });

    setDocuments(updatedDocuments);
    await persistWallet({ documents: updatedDocuments });
  };

  // Accept a suggestion and manually select/link to a chosen condition
  const acceptConditionSuggestionWithManualSelect = async (
    documentId: string,
    suggestionIndex: number,
    selectedConditionId: string
  ) => {
    // Link document to the selected condition
    const updatedDocuments = documents.map((d) => {
      if (d.id === documentId) {
        const linkedIds = d.linkedConditionIds || [];
        if (!linkedIds.includes(selectedConditionId)) {
          linkedIds.push(selectedConditionId);
        }
        
        // Mark suggestion as accepted
        let suggestions = d.aiConditionSuggestions ? [...d.aiConditionSuggestions] : [];
        if (suggestions[suggestionIndex]) {
          suggestions[suggestionIndex] = {
            ...suggestions[suggestionIndex],
            reviewed: true,
            accepted: true,
            matchedConditionId: selectedConditionId,
          };
        }
        
        return {
          ...d,
          linkedConditionIds: linkedIds,
          aiConditionSuggestions: suggestions,
        };
      }
      return d;
    });

    // Update condition: add documentId to linkedDocumentIds
    const updatedRecords = records.map((r) => {
      if (r.id === selectedConditionId && r.type === "condition") {
        const docIds = ((r as any).linkedDocumentIds as string[] | undefined) || [];
        if (!docIds.includes(documentId)) {
          docIds.push(documentId);
        }
        return {
          ...r,
          linkedDocumentIds: docIds,
        };
      }
      return r;
    });

    setDocuments(updatedDocuments);
    setRecords(updatedRecords);
    await persistWallet({ documents: updatedDocuments, records: updatedRecords });
  };

  // Unlink a document from a condition (bidirectional)
  const unlinkDocumentFromCondition = async (documentId: string, conditionId: string) => {
    // Remove condition from document's linked IDs
    const updatedDocuments = documents.map((d) => {
      if (d.id === documentId) {
        return {
          ...d,
          linkedConditionIds: (d.linkedConditionIds || []).filter((id) => id !== conditionId),
        };
      }
      return d;
    });

    // Remove document from condition's linked IDs
    const updatedRecords = records.map((r) => {
      if (r.id === conditionId && r.type === "condition") {
        return {
          ...r,
          linkedDocumentIds: (((r as any).linkedDocumentIds as string[] | undefined) || []).filter(
            (id) => id !== documentId
          ),
        };
      }
      return r;
    });

    setDocuments(updatedDocuments);
    setRecords(updatedRecords);
    await persistWallet({ documents: updatedDocuments, records: updatedRecords });
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
    linkDocumentToExistingCondition,
    createNewConditionFromSuggestion,
    dismissConditionSuggestion,
    acceptConditionSuggestionWithManualSelect,
    unlinkDocumentFromCondition,
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
