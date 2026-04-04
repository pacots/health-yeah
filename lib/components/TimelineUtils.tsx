"use client";

import { MedicalVisitRecord } from "@/lib/types";

type SeverityConfig = {
  dotBg: string;
  badge: string;
  textLabel: string;
  isDarkText?: boolean;
};

export const severityConfig: Record<string, SeverityConfig> = {
  critical: {
    dotBg: "bg-red-500",
    badge: "bg-red-100 text-red-800",
    textLabel: "Critical",
  },
  major: {
    dotBg: "bg-orange-500",
    badge: "bg-orange-100 text-orange-800",
    textLabel: "Major",
  },
  moderate: {
    dotBg: "bg-blue-500",
    badge: "bg-blue-100 text-blue-800",
    textLabel: "Moderate",
  },
  routine: {
    dotBg: "bg-green-500",
    badge: "bg-green-100 text-green-800",
    textLabel: "Routine",
  },
};

export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateLong(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatMonthYear(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

export function isImportantEvent(record: MedicalVisitRecord): boolean {
  return (
    record.severity === "critical" ||
    record.severity === "major"
  );
}

interface TimelineEventCardProps {
  record: MedicalVisitRecord;
  onClick?: () => void;
  variant?: "compact" | "full";
}

export function TimelineEventCard({
  record,
  onClick,
  variant = "compact",
}: TimelineEventCardProps) {
  const config = severityConfig[record.severity] || severityConfig.routine;

  if (variant === "full") {
    return (
      <button
        onClick={onClick}
        className="w-full text-left p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all"
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm text-gray-600">{formatDate(record.visitDate)}</p>
            <h4 className="font-semibold text-gray-900">{record.reasonForVisit}</h4>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${config.badge}`}>
            {config.textLabel}
          </span>
        </div>
        {record.specialty && (
          <p className="text-sm text-gray-600 mb-2">{record.specialty}</p>
        )}
        {record.diagnosis && (
          <p className="text-sm text-gray-700">{record.diagnosis}</p>
        )}
      </button>
    );
  }

  // Compact variant for horizontal timeline
  return (
    <div className="flex flex-col items-center">
      {/* Card above the line */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-3 mb-2 w-48 shadow-sm">
        <p className="text-xs text-gray-600 font-semibold">{formatDate(record.visitDate)}</p>
        <p className="text-sm font-bold text-gray-900 mt-1 line-clamp-2">
          {record.reasonForVisit}
        </p>
        {record.specialty && (
          <p className="text-xs text-gray-600 mt-1">{record.specialty}</p>
        )}
      </div>
      {/* Connector line - will be positioned with timeline */}
    </div>
  );
}
