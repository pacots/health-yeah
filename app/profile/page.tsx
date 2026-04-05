"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const { patient, updatePatient } = useApp();
  const [loading, setLoading] = useState(false);

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const [formData, setFormData] = useState({
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updatePatient({
        ...patient,
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

  return (
    <div className="page-container">
      <div className="page-max-width">
        {/* Header */}
        <div className="page-header">
          <Link href="/" className="back-link">
            ← Back to Dashboard
          </Link>
          <h1 className="page-title">Patient Profile</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card">
          {/* Personal Information Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>

            <div className="form-group">
              <label className="label">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Blood Type</label>
              <select
                name="bloodType"
                value={formData.bloodType}
                onChange={handleChange}
                className="input"
              >
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
              <select
                name="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleChange}
                className="input"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 my-8"></div>

          {/* Emergency Contact Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Emergency Contact</h2>

            <div className="form-group">
              <label className="label">Name</label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Relationship</label>
              <input
                type="text"
                name="emergencyContactRelationship"
                value={formData.emergencyContactRelationship}
                onChange={handleChange}
                placeholder="e.g., Spouse, Parent, Adult Child"
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Phone Number</label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 my-8"></div>

          {/* Medical Information Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Medical Information</h2>

            <div className="form-group">
              <label className="label">Height</label>
              <input
                type="text"
                name="height"
                value={formData.height}
                onChange={handleChange}
                placeholder="e.g., 5'10 or 178 cm"
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Weight</label>
              <input
                type="text"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="e.g., 180 lbs or 82 kg"
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Major Family History</label>
              <textarea
                name="majorFamilyHistory"
                value={formData.majorFamilyHistory}
                onChange={handleChange}
                placeholder="e.g., Father - Diabetes, Mother - Heart disease"
                className="input"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-2">Include significant family medical history</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Primary Physician</label>
                <input
                  type="text"
                  name="primaryPhysicianName"
                  value={formData.primaryPhysicianName}
                  onChange={handleChange}
                  placeholder="e.g., Dr. Emily Rodriguez, MD"
                  className="input"
                />
              </div>
              <div className="form-group">
                <label className="label">Physician Phone</label>
                <input
                  type="tel"
                  name="primaryPhysicianPhone"
                  value={formData.primaryPhysicianPhone}
                  onChange={handleChange}
                  placeholder="e.g., +1-555-0100"
                  className="input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Clinic</label>
              <input
                type="text"
                name="primaryClinic"
                value={formData.primaryClinic}
                onChange={handleChange}
                placeholder="e.g., City Medical Center"
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Insurance Company</label>
                <input
                  type="text"
                  name="insuranceCompany"
                  value={formData.insuranceCompany}
                  onChange={handleChange}
                  placeholder="e.g., Blue Cross Blue Shield"
                  className="input"
                />
              </div>
              <div className="form-group">
                <label className="label">Insurance Number</label>
                <input
                  type="text"
                  name="insuranceNumber"
                  value={formData.insuranceNumber}
                  onChange={handleChange}
                  placeholder="e.g., #12345678"
                  className="input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Other Notes</label>
              <textarea
                name="importantNotes"
                value={formData.importantNotes}
                onChange={handleChange}
                placeholder="e.g., Pregnancy status, smoking habits, drug use, eating habits, activity level"
                className="input"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-2">Lifestyle and personal health information</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? "Saving..." : "Save Profile"}
            </button>
            <Link href="/" className="btn-secondary flex-1 text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
