import localforage from "localforage";
import { Patient, Record, Document, Share, Wallet } from "./types";

const STORAGE_TIMEOUT_MS = 5000;

// Initialize localforage with error handling
let isLocalforageReady = false;
let inMemoryWallet: Wallet | null = null;

function createEmptyWalletState(): Wallet {
  return {
    patient: null,
    records: [],
    documents: [],
    shares: {},
    preferences: {},
  };
}

function normalizeWallet(wallet: Wallet): Wallet {
  return {
    patient: wallet.patient ?? null,
    records: Array.isArray(wallet.records) ? wallet.records : [],
    documents: Array.isArray(wallet.documents) ? wallet.documents : [],
    shares: wallet.shares && typeof wallet.shares === "object" ? wallet.shares : {},
    preferences: wallet.preferences && typeof wallet.preferences === "object" ? wallet.preferences : {},
  };
}

function withTimeout<T>(promise: Promise<T>, errorMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMessage)), STORAGE_TIMEOUT_MS);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

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
  }
};

if (typeof window !== "undefined") {
  initLocalforage().catch(console.error);
}

const WALLET_KEY = "wallet";

export const storage = {
  async setWallet(wallet: Wallet): Promise<void> {
    const normalized = normalizeWallet(wallet);
    inMemoryWallet = normalized;

    try {
      await initLocalforage();
      await withTimeout(localforage.setItem(WALLET_KEY, normalized), "Saving wallet timed out");
    } catch (error) {
      console.warn("[Storage] Persist failed, using in-memory wallet:", error);
    }
  },

  async getWallet(): Promise<Wallet | null> {
    try {
      await initLocalforage();
      const raw = (await withTimeout(localforage.getItem(WALLET_KEY), "Loading wallet timed out")) as Wallet | null;
      if (!raw) {
        return inMemoryWallet;
      }

      const normalized = normalizeWallet(raw);
      inMemoryWallet = normalized;
      return normalized;
    } catch (error) {
      console.warn("[Storage] Read failed, using in-memory wallet:", error);
      return inMemoryWallet;
    }
  },

  async initializeWallet(): Promise<Wallet | null> {
    try {
      const existing = await this.getWallet();
      return existing ? normalizeWallet(existing) : null;
    } catch (error) {
      console.warn("[Storage] initializeWallet fallback to empty state:", error);
      return null;
    }
  },

  async createEmptyWallet(): Promise<Wallet> {
    const wallet = createEmptyWalletState();
    await this.setWallet(wallet);
    return wallet;
  },

  async setPatient(patient: Patient): Promise<void> {
    const wallet = (await this.getWallet()) ?? createEmptyWalletState();
    wallet.patient = patient;
    await this.setWallet(wallet);
  },

  async getPatient(): Promise<Patient | null> {
    const wallet = await this.getWallet();
    return wallet?.patient || null;
  },

  async setRecords(records: Record[]): Promise<void> {
    const wallet = (await this.getWallet()) ?? createEmptyWalletState();
    wallet.records = records;
    await this.setWallet(wallet);
  },

  async getRecords(): Promise<Record[]> {
    const wallet = await this.getWallet();
    return wallet?.records || [];
  },

  async setDocuments(documents: Document[]): Promise<void> {
    const wallet = (await this.getWallet()) ?? createEmptyWalletState();
    wallet.documents = documents;
    await this.setWallet(wallet);
  },

  async getDocuments(): Promise<Document[]> {
    const wallet = await this.getWallet();
    return wallet?.documents || [];
  },

  async setShare(share: Share): Promise<void> {
    const wallet = (await this.getWallet()) ?? createEmptyWalletState();
    wallet.shares[share.id] = share;
    await this.setWallet(wallet);
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

  async clear(): Promise<void> {
    inMemoryWallet = null;
    try {
      await initLocalforage();
      await withTimeout(localforage.clear(), "Clearing wallet timed out");
      console.log("[Storage] Cleared all data");
    } catch (error) {
      console.warn("[Storage] Clear failed:", error);
    }
  },

  async resetWalletData(): Promise<void> {
    await this.clear();
    console.log("[Storage] Wallet reset to empty state");
  },
};

export function generateShareId(): string {
  return Math.random().toString(36).substring(2, 9);
}
