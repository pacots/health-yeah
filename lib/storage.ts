import localforage from "localforage";
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
import { generateDemoData } from "./demo-data";

// Initialize localforage
localforage.config({
  name: "health-wallet",
  version: 1.0,
  storeName: "wallet_store",
  description: "Health Wallet patient data storage",
});

const WALLET_KEY = "wallet";

export const storage = {
  // Single wallet persistence (atomic)
  async setWallet(wallet: Wallet): Promise<void> {
    await localforage.setItem(WALLET_KEY, wallet);
  },

  async getWallet(): Promise<Wallet | null> {
    return (await localforage.getItem(WALLET_KEY)) as Wallet | null;
  },

  // Initialize wallet on first load
  async initializeWallet(): Promise<Wallet> {
    // Check if wallet already exists
    const existing = await this.getWallet();
    if (existing) {
      return existing;
    }

    // No existing wallet, create with demo data
    const { patient, records, documents } = generateDemoData();
    const wallet: Wallet = {
      patient,
      records,
      documents,
      shares: {},
    };

    await this.setWallet(wallet);
    return wallet;
  },

  // Legacy API for backward compatibility (maps to wallet)
  async setPatient(patient: Patient): Promise<void> {
    const wallet = await this.getWallet();
    if (wallet) {
      wallet.patient = patient;
      await this.setWallet(wallet);
    }
  },

  async getPatient(): Promise<Patient | null> {
    const wallet = await this.getWallet();
    return wallet?.patient || null;
  },

  async setRecords(records: Record[]): Promise<void> {
    const wallet = await this.getWallet();
    if (wallet) {
      wallet.records = records;
      await this.setWallet(wallet);
    }
  },

  async getRecords(): Promise<Record[]> {
    const wallet = await this.getWallet();
    return wallet?.records || [];
  },

  async setDocuments(documents: Document[]): Promise<void> {
    const wallet = await this.getWallet();
    if (wallet) {
      wallet.documents = documents;
      await this.setWallet(wallet);
    }
  },

  async getDocuments(): Promise<Document[]> {
    const wallet = await this.getWallet();
    return wallet?.documents || [];
  },

  async setShare(share: Share): Promise<void> {
    const wallet = await this.getWallet();
    if (wallet) {
      wallet.shares[share.id] = share;
      await this.setWallet(wallet);
    }
  },

  async getShare(shareId: string): Promise<Share | null> {
    const wallet = await this.getWallet();
    return wallet?.shares[shareId] || null;
  },

  async getAllShares(): Promise<Share[]> {
    const wallet = await this.getWallet();
    return wallet ? Object.values(wallet.shares) : [];
  },

  async deleteShare(shareId: string): Promise<void> {
    const wallet = await this.getWallet();
    if (wallet) {
      delete wallet.shares[shareId];
      await this.setWallet(wallet);
    }
  },

  // Utility: clear all data (for development)
  async clear(): Promise<void> {
    await localforage.clear();
  },

  // Reset wallet to demo data
  async resetToDemoData(): Promise<Wallet> {
    await this.clear();
    const { patient, records, documents } = generateDemoData();
    const wallet: Wallet = {
      patient,
      records,
      documents,
      shares: {},
    };
    await this.setWallet(wallet);
    return wallet;
  },

  // ============ MEDICAL DOCUMENT INGESTION API ============

  // Medical Documents (uploaded source files)
  async getMedicalDocuments(): Promise<MedicalDocument[]> {
    const wallet = await this.getWallet();
    return wallet?.medicalDocuments || [];
  },

  async setMedicalDocuments(docs: MedicalDocument[]): Promise<void> {
    const wallet = await this.getWallet();
    if (wallet) {
      wallet.medicalDocuments = docs;
      await this.setWallet(wallet);
    }
  },

  async addMedicalDocument(doc: MedicalDocument): Promise<void> {
    const docs = await this.getMedicalDocuments();
    docs.push(doc);
    await this.setMedicalDocuments(docs);
  },

  async updateMedicalDocument(doc: MedicalDocument): Promise<void> {
    const docs = await this.getMedicalDocuments();
    const index = docs.findIndex((d) => d.id === doc.id);
    if (index >= 0) {
      docs[index] = doc;
      await this.setMedicalDocuments(docs);
    }
  },

  async getMedicalDocument(id: string): Promise<MedicalDocument | null> {
    const docs = await this.getMedicalDocuments();
    return docs.find((d) => d.id === id) || null;
  },

  async deleteMedicalDocument(id: string): Promise<void> {
    const docs = await this.getMedicalDocuments();
    const filtered = docs.filter((d) => d.id !== id);
    await this.setMedicalDocuments(filtered);
  },

  // Document Extractions (extracted text)
  async getDocumentExtractions(): Promise<DocumentExtraction[]> {
    const wallet = await this.getWallet();
    return wallet?.documentExtractions || [];
  },

  async setDocumentExtractions(extractions: DocumentExtraction[]): Promise<void> {
    const wallet = await this.getWallet();
    if (wallet) {
      wallet.documentExtractions = extractions;
      await this.setWallet(wallet);
    }
  },

  async addDocumentExtraction(extraction: DocumentExtraction): Promise<void> {
    const extractions = await this.getDocumentExtractions();
    extractions.push(extraction);
    await this.setDocumentExtractions(extractions);
  },

  async getExtractionForDocument(
    medicalDocumentId: string
  ): Promise<DocumentExtraction | null> {
    const extractions = await this.getDocumentExtractions();
    return extractions.find((e) => e.medicalDocumentId === medicalDocumentId) || null;
  },

  // Structured Medical Records (parsed/validated records)
  async getStructuredMedicalRecords(): Promise<StructuredMedicalRecord[]> {
    const wallet = await this.getWallet();
    return wallet?.structuredMedicalRecords || [];
  },

  async setStructuredMedicalRecords(
    records: StructuredMedicalRecord[]
  ): Promise<void> {
    const wallet = await this.getWallet();
    if (wallet) {
      wallet.structuredMedicalRecords = records;
      await this.setWallet(wallet);
    }
  },

  async addStructuredMedicalRecord(record: StructuredMedicalRecord): Promise<void> {
    const records = await this.getStructuredMedicalRecords();
    records.push(record);
    await this.setStructuredMedicalRecords(records);
  },

  async updateStructuredMedicalRecord(
    record: StructuredMedicalRecord
  ): Promise<void> {
    const records = await this.getStructuredMedicalRecords();
    const index = records.findIndex((r) => r.id === record.id);
    if (index >= 0) {
      records[index] = record;
      await this.setStructuredMedicalRecords(records);
    }
  },

  async getStructuredMedicalRecord(id: string): Promise<StructuredMedicalRecord | null> {
    const records = await this.getStructuredMedicalRecords();
    return records.find((r) => r.id === id) || null;
  },

  async deleteStructuredMedicalRecord(id: string): Promise<void> {
    const records = await this.getStructuredMedicalRecords();
    const filtered = records.filter((r) => r.id !== id);
    await this.setStructuredMedicalRecords(filtered);
  },

  // Medical History Entries (UI entries derived from structured records)
  async getMedicalHistoryEntries(): Promise<MedicalHistoryEntry[]> {
    const wallet = await this.getWallet();
    return wallet?.medicalHistoryEntries || [];
  },

  async setMedicalHistoryEntries(entries: MedicalHistoryEntry[]): Promise<void> {
    const wallet = await this.getWallet();
    if (wallet) {
      wallet.medicalHistoryEntries = entries;
      await this.setWallet(wallet);
    }
  },

  async addMedicalHistoryEntry(entry: MedicalHistoryEntry): Promise<void> {
    const entries = await this.getMedicalHistoryEntries();
    entries.push(entry);
    await this.setMedicalHistoryEntries(entries);
  },

  async updateMedicalHistoryEntry(entry: MedicalHistoryEntry): Promise<void> {
    const entries = await this.getMedicalHistoryEntries();
    const index = entries.findIndex((e) => e.id === entry.id);
    if (index >= 0) {
      entries[index] = entry;
      await this.setMedicalHistoryEntries(entries);
    }
  },

  async getMedicalHistoryEntry(id: string): Promise<MedicalHistoryEntry | null> {
    const entries = await this.getMedicalHistoryEntries();
    return entries.find((e) => e.id === id) || null;
  },

};

// Helper: Generate short ID for shares
export function generateShareId(): string {
  return Math.random().toString(36).substring(2, 9);
}
