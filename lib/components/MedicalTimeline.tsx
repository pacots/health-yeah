"use client";

import { MedicalVisitRecord } from "@/lib/types";

type SeverityConfig = {
  bg: string;
  border: string;
  dotBg: string;
  badge: string;
  textLabel: string;
};

const severityConfig: Record<string, SeverityConfig> = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    dotBg: "bg-red-500",
    badge: "bg-red-100 text-red-800",
    textLabel: "Critical",
  },
  major: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    dotBg: "bg-orange-500",
    badge: "bg-orange-100 text-orange-800",
    textLabel: "Major",
  },
  moderate: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    dotBg: "bg-blue-500",
    badge: "bg-blue-100 text-blue-800",
    textLabel: "Moderate",
  },
  routine: {
    bg: "bg-green-50",
    border: "border-green-200",
    dotBg: "bg-green-500",
    badge: "bg-green-100 text-green-800",
    textLabel: "Routine",
  },
};

export function getSeverityColor(severity: string): string {
  return severityConfig[severity]?.dotBg || "bg-gray-500";
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface MedicalTimelineProps {
  records: MedicalVisitRecord[];
  onEdit?: (record: MedicalVisitRecord) => void;
  onDelete?: (id: string) => void;
  isExpandable?: boolean;
  maxHeight?: boolean;
}

export function MedicalTimeline({
  records,
  onEdit,
  onDelete,
  isExpandable = false,
  maxHeight = false,
}: MedicalTimelineProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>No medical visits recorded yet</p>
      </div>
    );
  }

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
  );

  return (
    <div
      className={`space-y-6 ${
        maxHeight ? "max-h-96 overflow-y-auto pr-2" : ""
      }`}
    >
      {sortedRecords.map((record, index) => {
        const config = severityConfig[record.severity] || severityConfig.routine;

        return (
          <div
            key={record.id}
            className="flex gap-4"
          >
            {/* Timeline dot and line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full ${config.dotBg} ring-2 ring-white shadow-md relative z-10`}
              />
              {index < sortedRecords.length - 1 && (
                <div className="w-0.5 h-24 bg-gray-200 mt-2" />
              )}
            </div>

            {/* Content */}
            <div
              className={`flex-1 p-4 rounded-lg border-l-4 ${config.bg} ${config.border} relative`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {formatDate(record.visitDate)}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${config.badge}`}>
                    {config.textLabel}
                  </span>
                  {record.specialty && (
                    <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                      {record.specialty}
                    </span>
                  )}
                </div>
                {(onEdit || onDelete) && (
                  <div className="flex gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(record)}
                        className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(record.id)}
                        className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>

              <p className="text-gray-700 font-semibold mb-2">{record.reasonForVisit}</p>

              <div className="space-y-2 text-sm">
                {record.diagnosis && (
                  <p className="text-gray-700">
                    <strong>Diagnosis:</strong> {record.diagnosis}
                  </p>
                )}
                {record.treatment && (
                  <p className="text-gray-700">
                    <strong>Treatment:</strong> {record.treatment}
                  </p>
                )}
                {record.doctorNotes && (
                  <p className="text-gray-700">
                    <strong>Doctor Notes:</strong> {record.doctorNotes}
                  </p>
                )}
                <div className="flex gap-4 text-gray-500 text-xs pt-2 border-t border-gray-200">
                  {record.doctorName && <span>👨‍⚕️ {record.doctorName}</span>}
                  <span>Source: {record.source}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
