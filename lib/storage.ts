import localforage from "localforage";
import { Patient, Record, Document, Share } from "./types";
import { generateDemoData } from "./demo-data";

// Initialize localforage
localforage.config({
  name: "health-wallet",
  version: 1.0,
  storeName: "wallet_store",
  description: "Health Wallet patient data storage",
});

export const storage = {
  // Patient operations
  async setPatient(patient: Patient): Promise<void> {
    await localforage.setItem("patient", patient);
  },

  async getPatient(): Promise<Patient | null> {
    return (await localforage.getItem("patient")) as Patient | null;
  },

  // Records operations
  async setRecords(records: Record[]): Promise<void> {
    await localforage.setItem("records", records);
  },

  async getRecords(): Promise<Record[]> {
    const records = (await localforage.getItem("records")) as Record[] | null;
    return records || [];
  },

  // Documents operations
  async setDocuments(documents: Document[]): Promise<void> {
    await localforage.setItem("documents", documents);
  },

  async getDocuments(): Promise<Document[]> {
    const documents = (await localforage.getItem("documents")) as Document[] | null;
    return documents || [];
  },

  // Share operations
  async setShare(share: Share): Promise<void> {
    await localforage.setItem(`share:${share.id}`, share);
  },

  async getShare(shareId: string): Promise<Share | null> {
    return (await localforage.getItem(`share:${shareId}`)) as Share | null;
  },

  async getAllShares(): Promise<Share[]> {
    const shares: Share[] = [];
    await localforage.iterate((value, key) => {
      if (key.startsWith("share:")) {
        shares.push(value as Share);
      }
    });
    return shares;
  },

  async deleteShare(shareId: string): Promise<void> {
    await localforage.removeItem(`share:${shareId}`);
  },

  // Initialize with demo data if empty
  async initializeWithDemoData(): Promise<{ patient: Patient; records: Record[]; documents: Document[] }> {
    const existingPatient = await this.getPatient();
    if (existingPatient) {
      return {
        patient: existingPatient,
        records: await this.getRecords(),
        documents: await this.getDocuments(),
      };
    }

    const { patient, records, documents } = generateDemoData();
    await this.setPatient(patient);
    await this.setRecords(records);
    await this.setDocuments(documents);

    return { patient, records, documents };
  },

  // Utility: clear all data (dev only)
  async clear(): Promise<void> {
    await localforage.clear();
  },
};

// Helper: Generate short ID for shares
export function generateShareId(): string {
  return Math.random().toString(36).substring(2, 9);
}
