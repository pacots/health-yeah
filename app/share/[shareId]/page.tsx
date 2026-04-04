"use client";

import { useEffect, useState } from "react";
import React from "react";
import { useApp } from "@/lib/context";
import { SourceBadge } from "@/lib/metadata-badges";
import { Share } from "@/lib/types";
import { getRemoteShareStatus } from "@/lib/supabase";

type ShareStatus = "active" | "revoked" | "expired" | "notfound";

export default function ProviderViewPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = React.use(params);
  const { getShare } = useApp();
  const [share, setShare] = useState<Share | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ShareStatus>("notfound");

  useEffect(() => {
    // Define functions inside effect to avoid stale closures
    const loadShare = async () => {
      try {
        // Check remote status first
        const remoteStatus = await getRemoteShareStatus(shareId);

        if (remoteStatus === "revoked") {
          setStatus("revoked");
          setShare(null);
          return;
        }

        if (remoteStatus === "expired") {
          setStatus("expired");
          setShare(null);
          return;
        }

        if (remoteStatus === "notfound") {
          setStatus("notfound");
          setShare(null);
          return;
        }

        // Status is "active", fetch the share
        const fetchedShare = await getShare(shareId);
        if (fetchedShare) {
          setShare(fetchedShare);
          setStatus("active");
        } else {
          setStatus("notfound");
          setShare(null);
        }
      } catch (error) {
        console.error("Error loading share:", error);
        setStatus("notfound");
        setShare(null);
      } finally {
        setLoading(false);
      }
    };

    loadShare();

    // Poll every 5 seconds to check if share status changed (revoked/expired)
    const pollInterval = setInterval(async () => {
      try {
        const remoteStatus = await getRemoteShareStatus(shareId);
        if (remoteStatus !== status) {
          setStatus(remoteStatus);
          if (remoteStatus !== "active") {
            setShare(null);
          }
        }
      } catch (error) {
        console.error("Error checking share status:", error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [shareId, getShare, status]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading shared record...</p>
      </div>
    );
  }

  if (status === "revoked") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card text-center max-w-md">
          <p className="text-3xl mb-3">🔒</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">Share Revoked</p>
          <p className="text-gray-600 mb-4">
            This shared health record is no longer available. The patient has revoked access.
          </p>
          <p className="text-xs text-gray-500 mb-6">
            Share ID: {shareId}
          </p>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card text-center max-w-md">
          <p className="text-3xl mb-3">⏰</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">Share Expired</p>
          <p className="text-gray-600 mb-4">
            This shared health record is no longer available. The share link has expired.
          </p>
          <p className="text-xs text-gray-500 mb-6">
            Share ID: {shareId}
          </p>
        </div>
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card text-center max-w-md">
          <p className="text-2xl font-bold text-gray-900 mb-2">Share Not Found</p>
          <p className="text-gray-600 mb-6">
            This shared record has been deleted or is no longer available.
          </p>
          <p className="text-xs text-gray-500">
            Share ID: {shareId}
          </p>
        </div>
      </div>
    );
  }

  if (!share) {
    return null;
  }

  const allergies = share.recordSnapshots.filter((r) => r.type === "allergy");
  const medications = share.recordSnapshots.filter((r) => r.type === "medication");
  const conditions = share.recordSnapshots.filter((r) => r.type === "condition");
  const severeAllergies = allergies.filter((a) => (a as any).severity === "severe");

  const scopeLabel =
    share.scope === "emergency" ? "EMERGENCY SHARE" : "CONTINUITY OF CARE";

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10 px-4">
      <div className="max-w-3xl mx-auto w-full">
        {/* Clinical Header */}
        <div className="bg-slate-700 text-white p-4 sm:p-6 mb-6 rounded-t-lg">
          <div className="flex items-baseline justify-between gap-4 mb-2">
            <h1 className="text-sm sm:text-base font-bold tracking-wide">SHARED HEALTH RECORD</h1>
            <span className="text-xs font-bold px-2 py-1 bg-green-600 rounded">ACTIVE</span>
          </div>
          <div className="text-xs sm:text-sm text-slate-300 space-y-0.5">
            <p className="font-mono">{scopeLabel} | Shared: {new Date(share.createdAt).toLocaleDateString()}</p>
            <p className="font-mono text-xs">ID: {share.id}</p>
          </div>
        </div>

        {/* Patient Header Banner */}
        <div className="bg-white border-l-4 border-l-slate-700 p-4 sm:p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Patient Name</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                {share.patientSnapshot.name}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Date of Birth</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(share.patientSnapshot.dateOfBirth).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Age</p>
              <p className="text-lg font-semibold text-gray-900">
                {Math.floor((Date.now() - new Date(share.patientSnapshot.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
              </p>
            </div>
          </div>
        </div>

        {/* CRITICAL ALERTS - Only if severe allergies */}
        {severeAllergies.length > 0 && (
          <div className="bg-red-50 border-l-4 border-l-red-700 p-4 sm:p-6 mb-6 shadow-sm">
            <h2 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-3">
              ⚠ CRITICAL ALERT: SEVERE ALLERGIES
            </h2>
            <div className="space-y-2">
              {severeAllergies.map((a) => (
                <div key={a.id} className="bg-white p-2 sm:p-3 rounded border-l-2 border-l-red-600">
                  <p className="font-bold text-red-900 break-words">{(a as any).allergen}</p>
                  {(a as any).reaction && (
                    <p className="text-xs text-red-700 mt-1">Reaction: {(a as any).reaction}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Allergies Section */}
        {allergies.length > 0 && (
          <div className="bg-white border-l-4 border-l-red-500 p-4 sm:p-6 mb-6 shadow-sm">
            <h2 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3">Allergies</h2>
            <div className="space-y-1.5">
              {allergies.map((a) => (
                <div key={a.id} className="text-sm text-gray-900">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold break-words flex-1">{(a as any).allergen}</span>
                    {(a as any).severity && (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 ${
                          (a as any).severity === "severe"
                            ? "bg-red-100 text-red-800"
                            : (a as any).severity === "moderate"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {(a as any).severity}
                      </span>
                    )}
                  </div>
                  {(a as any).reaction && (
                    <p className="text-xs text-gray-600 mt-0.5">→ {(a as any).reaction}</p>
                  )}
                  <div className="mt-1">
                    <SourceBadge source={(a as any).source} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications Section */}
        {medications.length > 0 && (
          <div className="bg-white border-l-4 border-l-blue-500 p-4 sm:p-6 mb-6 shadow-sm">
            <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">Active Medications</h2>
            <div className="space-y-2">
              {medications.map((m) => (
                <div key={m.id} className="text-sm text-gray-900 pb-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold break-words flex-1">{(m as any).name}</p>
                    <SourceBadge source={(m as any).source} />
                  </div>
                  <p className="text-xs text-gray-600">
                    {(m as any).dosage} • {(m as any).frequency}
                  </p>
                  {(m as any).indication && (
                    <p className="text-xs text-gray-600">Indication: {(m as any).indication}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conditions Section */}
        {conditions.length > 0 && (
          <div className="bg-white border-l-4 border-l-green-500 p-4 sm:p-6 mb-6 shadow-sm">
            <h2 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-3">Medical Conditions</h2>
            <div className="space-y-2">
              {conditions.map((c) => (
                <div key={c.id} className="text-sm text-gray-900 pb-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-semibold break-words flex-1">{(c as any).name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded flex-shrink-0">
                        {(c as any).status}
                      </span>
                      <SourceBadge source={(c as any).source} />
                    </div>
                  </div>
                  {(c as any).notes && (
                    <p className="text-xs text-gray-600 mt-0.5">{(c as any).notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emergency Contact Section */}
        {share.patientSnapshot.emergencyContact && (
          <div className="bg-white border-l-4 border-l-gray-400 p-4 sm:p-6 mb-6 shadow-sm">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Emergency Contact</h2>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">{share.patientSnapshot.emergencyContact.name}</p>
              <p className="text-xs text-gray-600">{share.patientSnapshot.emergencyContact.relationship}</p>
              <p className="text-sm font-mono font-bold text-gray-900 break-all">
                {share.patientSnapshot.emergencyContact.phone}
              </p>
            </div>
          </div>
        )}

        {/* Documents (if continuity scope) */}
        {share.scope === "continuity" && share.documentSnapshots && share.documentSnapshots.length > 0 && (
          <div className="bg-white border-l-4 border-l-gray-400 p-4 sm:p-6 mb-6 shadow-sm">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Supporting Documents</h2>
            <div className="space-y-3">
              {share.documentSnapshots.map((d) => (
                <div key={d.id} className="pb-3 border-b border-gray-100 last:border-b-0">
                  <p className="font-semibold text-gray-900 text-sm mb-1">{d.title}</p>
                  <p className="text-xs text-gray-600 line-clamp-2 whitespace-pre-wrap">
                    {d.content.substring(0, 120)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinical Footer */}
        <div className="bg-slate-100 text-slate-700 p-3 sm:p-4 rounded-b-lg text-xs border-t border-slate-200">
          <p>This is a read-only snapshot. The patient retains control and can revoke this share at any time.</p>
        </div>
      </div>
    </div>
  );
}
