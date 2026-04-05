import localforage from "localforage";
import { Patient, Record, Document, Share, Wallet } from "./types";
import { generateDemoData } from "./demo-data";

// Initialize localforage with error handling
let isLocalforageReady = false;

const initLocalforage = async () => {
  if (isLocalforageReady) return;

  try {
    localforage.config({
      name: "health-wallet",
      version: 1.0,
      storeName: "wallet_store",
      description: "Health Wallet patient data storage",
    });
    isLocalforageReady = true;
    console.log("[Storage] Localforage initialized");
  } catch (error) {
    console.error("[Storage] Failed to initialize localforage:", error);
    // Continue anyway - may work on retry
  }
};

// Initialize immediately
if (typeof window !== "undefined") {
  initLocalforage().catch(console.error);
}

const WALLET_KEY = "wallet";

export const storage = {
  // Single wallet persistence (atomic)
  async setWallet(wallet: Wallet): Promise<void> {
    try {
      await initLocalforage();
      await localforage.setItem(WALLET_KEY, wallet);
    } catch (error) {
      console.error("[Storage] Failed to save wallet:", error);
      throw error;
    }
  },

  async getWallet(): Promise<Wallet | null> {
    try {
      await initLocalforage();
      return (await localforage.getItem(WALLET_KEY)) as Wallet | null;
    } catch (error) {
      console.error("[Storage] Failed to load wallet:", error);
      // Return null instead of throwing - may be a temporary IndexedDB issue
      return null;
    }
  },

  // Initialize wallet on first load
  async initializeWallet(): Promise<Wallet> {
    try {
      await initLocalforage();

      // Check if wallet already exists
      const existing = await this.getWallet();
      if (existing) {
        console.log("[Storage] Loaded existing wallet");
        return existing;
      }

      // No existing wallet, create with demo data
      console.log("[Storage] Creating new wallet with demo data");
      const { patient, records, documents } = generateDemoData();
      const wallet: Wallet = {
        patient,
        records,
        documents,
        shares: {},
      };

      await this.setWallet(wallet);
      console.log("[Storage] Wallet created and saved");
      return wallet;
    } catch (error) {
      console.error("[Storage] Failed to initialize wallet:", error);

      // Fallback: Create wallet in memory if IndexedDB fails
      console.warn("[Storage] Using in-memory wallet as fallback (no persistence)");
      const { patient, records, documents } = generateDemoData();
      return {
        patient,
        records,
        documents,
        shares: {},
      };
    }
  },

  // Legacy API for backward compatibility (maps to wallet)
  async setPatient(patient: Patient): Promise<void> {
    try {
      const wallet = await this.getWallet();
      if (wallet) {
        wallet.patient = patient;
        await this.setWallet(wallet);
      }
    } catch (error) {
      console.error("[Storage] Failed to set patient:", error);
    }
  },

  async getPatient(): Promise<Patient | null> {
    try {
      const wallet = await this.getWallet();
      return wallet?.patient || null;
    } catch (error) {
      console.error("[Storage] Failed to get patient:", error);
      return null;
    }
  },

  async setRecords(records: Record[]): Promise<void> {
    try {
      const wallet = await this.getWallet();
      if (wallet) {
        wallet.records = records;
        await this.setWallet(wallet);
      }
    } catch (error) {
      console.error("[Storage] Failed to set records:", error);
    }
  },

  async getRecords(): Promise<Record[]> {
    try {
      const wallet = await this.getWallet();
      return wallet?.records || [];
    } catch (error) {
      console.error("[Storage] Failed to get records:", error);
      return [];
    }
  },

  async setDocuments(documents: Document[]): Promise<void> {
    try {
      const wallet = await this.getWallet();
      if (wallet) {
        wallet.documents = documents;
        await this.setWallet(wallet);
      }
    } catch (error) {
      console.error("[Storage] Failed to set documents:", error);
    }
  },

  async getDocuments(): Promise<Document[]> {
    try {
      const wallet = await this.getWallet();
      return wallet?.documents || [];
    } catch (error) {
      console.error("[Storage] Failed to get documents:", error);
      return [];
    }
  },

  async setShare(share: Share): Promise<void> {
    try {
      const wallet = await this.getWallet();
      if (wallet) {
        wallet.shares[share.id] = share;
        await this.setWallet(wallet);
      }
    } catch (error) {
      console.error("[Storage] Failed to set share:", error);
    }
  },

  async getShare(shareId: string): Promise<Share | null> {
    try {
      const wallet = await this.getWallet();
      return wallet?.shares[shareId] || null;
    } catch (error) {
      console.error("[Storage] Failed to get share:", error);
      return null;
    }
  },

  async getAllShares(): Promise<Share[]> {
    try {
      const wallet = await this.getWallet();
      return wallet ? Object.values(wallet.shares) : [];
    } catch (error) {
      console.error("[Storage] Failed to get all shares:", error);
      return [];
    }
  },

  async deleteShare(shareId: string): Promise<void> {
    try {
      const wallet = await this.getWallet();
      if (wallet) {
        delete wallet.shares[shareId];
        await this.setWallet(wallet);
      }
    } catch (error) {
      console.error("[Storage] Failed to delete share:", error);
    }
  },

  // Utility: clear all data (for development)
  async clear(): Promise<void> {
    try {
      await initLocalforage();
      await localforage.clear();
      console.log("[Storage] Cleared all data");
    } catch (error) {
      console.error("[Storage] Failed to clear storage:", error);
    }
  },

  // Reset wallet to demo data
  async resetToDemoData(): Promise<Wallet> {
    try {
      await this.clear();
      const { patient, records, documents } = generateDemoData();
      const wallet: Wallet = {
        patient,
        records,
        documents,
        shares: {},
      };
      await this.setWallet(wallet);
      console.log("[Storage] Reset to demo data");
      return wallet;
    } catch (error) {
      console.error("[Storage] Failed to reset to demo data:", error);
      // Return in-memory wallet as fallback
      const { patient, records, documents } = generateDemoData();
      return {
        patient,
        records,
        documents,
        shares: {},
      };
    }
  },
};

// Helper: Generate short ID for shares
export function generateShareId(): string {
  return Math.random().toString(36).substring(2, 9);
}

