"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/context";
import Link from "next/link";
import { ConfirmDialog } from "@/lib/ConfirmDialog";
import { storage } from "@/lib/storage";
import { buildWalletExport, downloadWalletExport, parseWalletExportFile, walletFromExport } from "@/lib/wallet-transfer";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const app = useApp();
  const { patient, updatePatient, createEmptyWallet } = app;
  const isCreatingProfile = !patient;
  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [requiresReplaceConfirm, setRequiresReplaceConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    preferredLanguage: "en",
    bloodType: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    majorFamilyHistory: "",
    primaryPhysicianName: "",
    primaryPhysicianPhone: "",
    primaryClinic: "",
    insuranceCompany: "",
    insuranceNumber: "",
    height: "",
    weight: "",
    importantNotes: "",
  });

  useEffect(() => {
    if (!patient) return;

    setFormData({
      name: patient.name,
      dateOfBirth: patient.dateOfBirth,
      preferredLanguage: patient.preferredLanguage,
      bloodType: patient.bloodType || "",
      emergencyContactName: patient.emergencyContact?.name || "",
      emergencyContactRelationship: patient.emergencyContact?.relationship || "",
      emergencyContactPhone: patient.emergencyContact?.phone || "",
      majorFamilyHistory: patient.majorFamilyHistory || "",
      primaryPhysicianName: patient.primaryPhysicianName || "",
      primaryPhysicianPhone: patient.primaryPhysicianPhone || "",
      primaryClinic: patient.primaryClinic || "",
      insuranceCompany: patient.insuranceCompany || "",
      insuranceNumber: patient.insuranceNumber || "",
      height: patient.height || "",
      weight: patient.weight || "",
      importantNotes: patient.importantNotes || "",
    });
  }, [patient]);

  useEffect(() => {
    const initializeCreateMode = async () => {
      if (!searchParams.get("new") || patient) {
        return;
      }

      const existingWallet = await storage.getWallet();
      if (!existingWallet) {
        await createEmptyWallet();
      }
    };

    initializeCreateMode().catch((error) => {
      console.error("Failed to initialize empty wallet for profile creation:", error);
    });
  }, [searchParams, patient, createEmptyWallet]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const now = Date.now();
      await updatePatient({
        ...(patient || {
          id: Math.random().toString(36).substring(2, 11),
          createdAt: now,
          updatedAt: now,
        }),
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        preferredLanguage: formData.preferredLanguage,
        bloodType: formData.bloodType,
        emergencyContact: {
          name: formData.emergencyContactName,
          relationship: formData.emergencyContactRelationship,
          phone: formData.emergencyContactPhone,
        },
        majorFamilyHistory: formData.majorFamilyHistory,
        primaryPhysicianName: formData.primaryPhysicianName,
        primaryPhysicianPhone: formData.primaryPhysicianPhone,
        primaryClinic: formData.primaryClinic,
        insuranceCompany: formData.insuranceCompany,
        insuranceNumber: formData.insuranceNumber,
        height: formData.height,
        weight: formData.weight,
        importantNotes: formData.importantNotes,
      });
      router.push("/?saved=true");
    } finally {
      setLoading(false);
    }
  };

  const handleExportWallet = async () => {
    setImportError(null);
    setImportSuccess(null);
    setBackupLoading(true);
    try {
      const wallet = await storage.getWallet();
      if (!wallet || !wallet.patient) {
        throw new Error("No wallet data available to export.");
      }

      const payload = buildWalletExport(wallet);
      downloadWalletExport(payload);
      setImportSuccess("Wallet exported successfully.");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Failed to export wallet.");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleOpenImportPicker = () => {
    setImportError(null);
    setImportSuccess(null);
    fileInputRef.current?.click();
  };

  const handleImportFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    e.target.value = "";

    if (!file) return;

    const checkAndConfirm = async () => {
      const existingWallet = await storage.getWallet();
      if (!existingWallet) {
        setPendingImportFile(file);
        setRequiresReplaceConfirm(false);
        await handleConfirmImport(file);
        return;
      }

      setRequiresReplaceConfirm(true);
      setPendingImportFile(file);
      setShowImportConfirm(true);
    };

    checkAndConfirm().catch((error) => {
      setImportError(error instanceof Error ? error.message : "Failed to prepare import.");
    });
  };

  const handleConfirmImport = async (fileOverride?: File) => {
    const importFile = fileOverride || pendingImportFile;
    if (!importFile) return;

    setPendingImportFile(importFile);
    setShowImportConfirm(false);
    setImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const parsedExport = await parseWalletExportFile(importFile);
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

      setImportSuccess("Wallet imported successfully. Redirecting to dashboard...");
      setPendingImportFile(null);
      setRequiresReplaceConfirm(false);
      setTimeout(() => {
        window.location.href = "/";
      }, 700);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Failed to import wallet.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-max-width">
        <div className="page-header">
          <Link href="/" className="back-link">
            {"<- Back to Dashboard"}
          </Link>
          <h1 className="page-title">{isCreatingProfile ? "Create Profile" : "Patient Profile"}</h1>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Wallet Backup & Restore</h2>
          <p className="text-sm text-gray-600 mb-4">
            Export your full wallet to transfer it to another browser or device.
          </p>
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mb-4">
            This file contains sensitive health data. Keep it secure.
          </p>

          {importError && <div className="alert-error mb-3 text-sm">{importError}</div>}
          {importSuccess && <div className="alert-success mb-3 text-sm">{importSuccess}</div>}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleExportWallet}
              disabled={backupLoading || importing}
              className="btn-secondary"
            >
              {backupLoading ? "Exporting..." : "Export Wallet"}
            </button>

            <button
              type="button"
              onClick={handleOpenImportPicker}
              disabled={backupLoading || importing}
              className="btn-danger"
            >
              {importing ? "Importing..." : "Import Wallet"}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFileSelected}
          />
        </div>

        <form onSubmit={handleSubmit} className="card">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>

            <div className="form-group">
              <label className="label">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input" required />
            </div>

            <div className="form-group">
              <label className="label">Date of Birth</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="input" required />
            </div>

            <div className="form-group">
              <label className="label">Blood Type</label>
              <select name="bloodType" value={formData.bloodType} onChange={handleChange} className="input">
                <option value="">-- Not specified --</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Preferred Language</label>
              <select name="preferredLanguage" value={formData.preferredLanguage} onChange={handleChange} className="input">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 my-8"></div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Emergency Contact</h2>

            <div className="form-group">
              <label className="label">Name</label>
              <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className="input" />
            </div>

            <div className="form-group">
              <label className="label">Relationship</label>
              <input type="text" name="emergencyContactRelationship" value={formData.emergencyContactRelationship} onChange={handleChange} placeholder="e.g., Spouse, Parent, Adult Child" className="input" />
            </div>

            <div className="form-group">
              <label className="label">Phone Number</label>
              <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className="input" />
            </div>
          </div>

          <div className="border-t border-gray-200 my-8"></div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Medical Information</h2>

            <div className="form-group">
              <label className="label">Height</label>
              <input type="text" name="height" value={formData.height} onChange={handleChange} placeholder="e.g., 5'10 or 178 cm" className="input" />
            </div>

            <div className="form-group">
              <label className="label">Weight</label>
              <input type="text" name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g., 180 lbs or 82 kg" className="input" />
            </div>

            <div className="form-group">
              <label className="label">Major Family History</label>
              <textarea name="majorFamilyHistory" value={formData.majorFamilyHistory} onChange={handleChange} placeholder="e.g., Father - Diabetes, Mother - Heart disease" className="input" rows={3} />
              <p className="text-xs text-gray-500 mt-2">Include significant family medical history</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Primary Physician</label>
                <input type="text" name="primaryPhysicianName" value={formData.primaryPhysicianName} onChange={handleChange} placeholder="e.g., Dr. Emily Rodriguez, MD" className="input" />
              </div>
              <div className="form-group">
                <label className="label">Physician Phone</label>
                <input type="tel" name="primaryPhysicianPhone" value={formData.primaryPhysicianPhone} onChange={handleChange} placeholder="e.g., +1-555-0100" className="input" />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Clinic</label>
              <input type="text" name="primaryClinic" value={formData.primaryClinic} onChange={handleChange} placeholder="e.g., City Medical Center" className="input" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Insurance Company</label>
                <input type="text" name="insuranceCompany" value={formData.insuranceCompany} onChange={handleChange} placeholder="e.g., Blue Cross Blue Shield" className="input" />
              </div>
              <div className="form-group">
                <label className="label">Insurance Number</label>
                <input type="text" name="insuranceNumber" value={formData.insuranceNumber} onChange={handleChange} placeholder="e.g., #12345678" className="input" />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Other Notes</label>
              <textarea name="importantNotes" value={formData.importantNotes} onChange={handleChange} placeholder="e.g., Pregnancy status, smoking habits, drug use, eating habits, activity level" className="input" rows={3} />
              <p className="text-xs text-gray-500 mt-2">Lifestyle and personal health information</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "Saving..." : "Save Profile"}
            </button>
            <Link href="/" className="btn-secondary flex-1 text-center">
              Cancel
            </Link>
          </div>
        </form>

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
  );
}

