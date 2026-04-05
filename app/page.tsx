"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Download,
  FileText,
  Heart,
  Phone,
  Pill,
  Share2,
  UserPlus,
} from "lucide-react";
import { ConfirmDialog } from "@/lib/ConfirmDialog";
import { useApp } from "@/lib/context";
import { storage } from "@/lib/storage";
import { parseWalletExportFile, walletFromExport } from "@/lib/wallet-transfer";

export default function Home() {
  const router = useRouter();
  const {
    patient,
    records,
    documents,
    loading,
    hasPersistedWallet,
    createEmptyWallet,
  } = useApp();

  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);

  const [importing, setImporting] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [requiresReplaceConfirm, setRequiresReplaceConfirm] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("saved")) {
      setShowSavedMessage(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      const timer = setTimeout(() => setShowSavedMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const openImportPicker = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleCreateProfile = async () => {
    setImportError(null);
    setCreatingProfile(true);
    try {
      await createEmptyWallet();
      router.push("/profile?new=1");
    } catch (error) {
      console.error("Failed to initialize empty wallet:", error);
      setImportError("Could not initialize local wallet storage. You can still continue by importing a backup.");
    } finally {
      setCreatingProfile(false);
    }
  };

  const performImport = async (file: File) => {
    setImporting(true);
    setImportError(null);

    try {
      const parsedExport = await parseWalletExportFile(file);
      const importedWallet = walletFromExport(parsedExport);
      const previousWallet = await storage.getWallet();

      await storage.clear();
      try {
        await storage.setWallet(importedWallet);
      } catch (error) {
        if (previousWallet) {
          await storage.setWallet(previousWallet);
        }
        throw error;
      }

      window.location.href = "/";
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Failed to import wallet.");
    } finally {
      setImporting(false);
      setPendingImportFile(null);
      setRequiresReplaceConfirm(false);
    }
  };

  const handleImportFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    e.target.value = "";

    if (!file) return;

    const existingWallet = await storage.getWallet();
    if (!existingWallet) {
      await performImport(file);
      return;
    }

    setRequiresReplaceConfirm(true);
    setPendingImportFile(file);
    setShowImportConfirm(true);
  };

  const handleConfirmImport = async () => {
    if (!pendingImportFile) return;

    setShowImportConfirm(false);
    await performImport(pendingImportFile);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Yeah</h1>
          <p className="text-gray-600">Loading your health information...</p>
        </div>
      </div>
    );
  }

  if (!hasPersistedWallet) {
    return (
      <div className="page-container">
        <div className="page-max-width">
          <div className="card-premium max-w-xl mx-auto">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-2">Welcome</p>
            <h1 className="page-title mb-3">Your Portable Health Yeah</h1>
            <p className="text-slate-600 text-sm sm:text-base mb-3">
              Keep your core health profile on this device by default, then share only what is needed.
            </p>
            <p className="text-slate-600 text-sm sm:text-base mb-6">
              Start fresh or restore your profile from an exported wallet file.
            </p>

            {importError && <div className="alert-error mb-4 text-sm">{importError}</div>}

            <div className="action-group">
              <button
                type="button"
                onClick={handleCreateProfile}
                disabled={creatingProfile || importing}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
              >
                <UserPlus size={18} />
                <span>{creatingProfile ? "Initializing..." : "Create New Profile"}</span>
              </button>

              <button
                type="button"
                onClick={openImportPicker}
                disabled={importing}
                className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3"
              >
                <Download size={18} />
                <span>{importing ? "Importing..." : "Import Profile"}</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              Data stays local by default. Import restores a local backup on this device.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportFileSelected}
            />

            <ConfirmDialog
              isOpen={showImportConfirm}
              title="Replace Wallet On This Device"
              message={
                requiresReplaceConfirm
                  ? "This will replace your current wallet on this device. This action cannot be undone."
                  : "Import this wallet backup on this device?"
              }
              confirmLabel={requiresReplaceConfirm ? "Replace Wallet" : "Import Wallet"}
              cancelLabel="Cancel"
              isDangerous={requiresReplaceConfirm}
              isLoading={importing}
              onConfirm={handleConfirmImport}
              onCancel={() => {
                if (importing) return;
                setShowImportConfirm(false);
                setPendingImportFile(null);
                setRequiresReplaceConfirm(false);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Needed</h1>
          <p className="text-gray-600 mb-4">Create or restore your profile to continue.</p>
          <div className="action-group">
            <button
              type="button"
              onClick={handleCreateProfile}
              disabled={creatingProfile || importing}
              className="btn-primary flex-1 text-center"
            >
              {creatingProfile ? "Initializing..." : "Create Profile"}
            </button>
            <button type="button" onClick={openImportPicker} className="btn-secondary flex-1">Import</button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFileSelected}
          />
        </div>
      </div>
    );
  }

  const allergies = records.filter((r) => r.type === "allergy");
  const medications = records.filter((r) => r.type === "medication");
  const conditions = records.filter((r) => r.type === "condition");

  return (
    <div className="page-container">
      <div className="page-max-width">
        <div className="page-header flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-2">Welcome Back</p>
            <h1 className="page-title">Health Yeah</h1>
            <p className="page-subtitle">Your complete health information, always accessible</p>
          </div>
        </div>

        {showSavedMessage && <div className="alert-success mb-6 text-sm">Profile saved successfully</div>}

        <div className="card-premium section-spacing-narrow">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
            <div className="flex-1 min-w-0">
              <p className="section-header mb-2">Patient Profile</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 break-words">{patient.name}</h2>
              <p className="text-sm text-slate-600 mt-2">DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</p>

              {patient.emergencyContact && (
                <div className="pt-3 mt-4 border-t border-blue-200/50">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Phone size={14} className="text-blue-600" /> Emergency Contact
                  </p>
                  <p className="font-semibold text-slate-900">{patient.emergencyContact.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{patient.emergencyContact.relationship}</p>
                  <p className="text-sm font-mono font-semibold text-blue-700 mt-2">{patient.emergencyContact.phone}</p>
                </div>
              )}
            </div>
            <Link href="/profile" className="btn-secondary btn-sm whitespace-nowrap flex-shrink-0 self-start sm:self-auto">
              Edit Profile
            </Link>
          </div>
        </div>

        <div className="section-spacing">
          <p className="section-header">Health Overview</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card">
              <p className="stat-label">Allergies Recorded</p>
              <p className="stat-value text-red-600">{allergies.length}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Active Medications</p>
              <p className="stat-value text-blue-600">{medications.length}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Health Conditions</p>
              <p className="stat-value text-emerald-600">{conditions.length}</p>
            </div>
          </div>
        </div>

        <div className="section-spacing">
          <p className="section-header">Medical Records</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/records/allergies" className="record-item record-item-allergy hover:border-red-500 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle size={20} className="text-red-600" />
                    <p className="text-lg font-semibold text-slate-900">Allergies</p>
                  </div>
                  <p className="text-sm text-slate-600">{allergies.length} recorded</p>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-red-600 transition-colors" />
              </div>
            </Link>

            <Link href="/records/medications" className="record-item record-item-medication hover:border-blue-500 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Pill size={20} className="text-blue-600" />
                    <p className="text-lg font-semibold text-slate-900">Medications</p>
                  </div>
                  <p className="text-sm text-slate-600">{medications.length} active</p>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </Link>

            <Link href="/records/conditions" className="record-item record-item-condition hover:border-emerald-500 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Heart size={20} className="text-emerald-600" />
                    <p className="text-lg font-semibold text-slate-900">Conditions</p>
                  </div>
                  <p className="text-sm text-slate-600">{conditions.length} documented</p>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
            </Link>

            <Link href="/documents" className="record-item hover:border-amber-500 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText size={20} className="text-amber-600" />
                    <p className="text-lg font-semibold text-slate-900">Documents</p>
                  </div>
                  <p className="text-sm text-slate-600">{documents.length} stored</p>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-amber-600 transition-colors" />
              </div>
            </Link>
          </div>
        </div>

        <div className="action-group mt-8">
          <Link href="/summary/emergency" className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
            <AlertTriangle size={18} />
            <span>Emergency Health Card</span>
          </Link>
          <Link href="/share" className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3">
            <Share2 size={18} />
            <span>Share Record</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
