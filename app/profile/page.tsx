"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import Link from "next/link";

export default function ProfilePage() {
  const { patient, updatePatient } = useApp();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

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
    emergencyContactName: patient.emergencyContact?.name || "",
    emergencyContactRelationship: patient.emergencyContact?.relationship || "",
    emergencyContactPhone: patient.emergencyContact?.phone || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      await updatePatient({
        ...patient,
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        preferredLanguage: formData.preferredLanguage,
        emergencyContact: {
          name: formData.emergencyContactName,
          relationship: formData.emergencyContactRelationship,
          phone: formData.emergencyContactPhone,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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

        {/* Success Message */}
        {saved && (
          <div className="alert-success mb-6 text-sm">
            ✓ Profile saved successfully
          </div>
        )}

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
