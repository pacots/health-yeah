import localforage from "localforage";
import { Patient, Record, Document, Share, Wallet } from "./types";
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
};

// Helper: Generate short ID for shares
export function generateShareId(): string {
  return Math.random().toString(36).substring(2, 9);
}
