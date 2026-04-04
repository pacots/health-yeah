"use client";

import { MedicalVisitRecord } from "@/lib/types";
import { useState } from "react";

type SeverityConfig = {
  dotBg: string;
  cardBg: string;
  badge: string;
  textLabel: string;
};

const severityConfig: Record<string, SeverityConfig> = {
  critical: {
    dotBg: "bg-red-500",
    cardBg: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-800",
    textLabel: "Critical",
  },
  major: {
    dotBg: "bg-orange-500",
    cardBg: "bg-orange-50 border-orange-200",
    badge: "bg-orange-100 text-orange-800",
    textLabel: "Major",
  },
  moderate: {
    dotBg: "bg-blue-500",
    cardBg: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    textLabel: "Moderate",
  },
  routine: {
    dotBg: "bg-green-500",
    cardBg: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-800",
    textLabel: "Routine",
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatYear(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.getFullYear().toString();
}

interface HorizontalMedicalTimelineProps {
  records: MedicalVisitRecord[];
  onSelectRecord?: (record: MedicalVisitRecord) => void;
}

export function HorizontalMedicalTimeline({
  records,
  onSelectRecord,
}: HorizontalMedicalTimelineProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (records.length === 0) {
    return null;
  }

  // Sort by date
  const sorted = [...records].sort(
    (a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()
  );

  // Calculate positions
  const minDate = new Date(sorted[0].visitDate).getTime();
  const maxDate = new Date(sorted[sorted.length - 1].visitDate).getTime();
  const dateRange = maxDate - minDate;

  const getPosition = (date: string): number => {
    const recordDate = new Date(date).getTime();
    if (dateRange === 0) return 50;
    return ((recordDate - minDate) / dateRange) * 100;
  };

  // Get year markers
  const yearMarkers: { year: string; position: number }[] = [];
  if (sorted.length > 0) {
    const startYear = new Date(sorted[0].visitDate).getFullYear();
    const endYear = new Date(sorted[sorted.length - 1].visitDate).getFullYear();
    
    for (let year = startYear; year <= endYear; year++) {
      const dateStr = `${year}-01-01`;
      const yearDate = new Date(dateStr).getTime();
      if (yearDate >= minDate && yearDate <= maxDate) {
        yearMarkers.push({
          year: year.toString(),
          position: ((yearDate - minDate) / dateRange) * 100,
        });
      }
    }
  }

  return (
    <div className="w-full">
      {/* Milestone Cards */}
      <div className="mb-12 flex flex-wrap gap-4 justify-between">
        {sorted.map((record) => {
          const config = severityConfig[record.severity] || severityConfig.routine;

          return (
            <button
              key={record.id}
              onClick={() => onSelectRecord?.(record)}
              onMouseEnter={() => setHoveredId(record.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`flex-1 min-w-[200px] p-4 rounded-lg border-2 ${config.cardBg} transition-all hover:shadow-lg cursor-pointer ${
                hoveredId === record.id ? "ring-2 ring-offset-2" : ""
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-full ${config.dotBg} flex items-center justify-center flex-shrink-0 text-white font-bold text-sm`}
                >
                  📋
                </div>
                <div className={`px-2 py-1 rounded text-xs font-semibold ${config.badge}`}>
                  {config.textLabel}
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1 text-left">
                {formatDate(record.visitDate)}
              </h3>
              <p className="text-gray-700 text-sm font-semibold mb-2 text-left line-clamp-2">
                {record.reasonForVisit}
              </p>
              {record.specialty && (
                <p className="text-gray-600 text-xs text-left">
                  {record.specialty}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Gradient line background */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-blue-500 to-green-500 rounded-full" />

        {/* Timeline container */}
        <div className="relative h-12 flex items-center">
          {/* Base line for dots positioning */}
          <div className="absolute inset-0 flex items-center w-full px-0">
            <div className="h-1 w-full" />
          </div>

          {/* Dots */}
          <div className="absolute w-full h-full flex items-center">
            {sorted.map((record) => {
              const config = severityConfig[record.severity] || severityConfig.routine;
              const position = getPosition(record.visitDate);
              const isHovered = hoveredId === record.id;

              return (
                <div
                  key={record.id}
                  className="absolute transform -translate-x-1/2 group"
                  style={{ left: `${position}%` }}
                >
                  <button
                    onMouseEnter={() => setHoveredId(record.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => onSelectRecord?.(record)}
                    className={`w-5 h-5 rounded-full ${config.dotBg} ring-4 ring-white shadow-md transition-all cursor-pointer ${
                      isHovered ? "scale-150" : "hover:scale-125"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Year labels */}
        <div className="relative h-8 mt-4">
          {yearMarkers.map((marker) => (
            <div
              key={marker.year}
              className="absolute transform -translate-x-1/2 text-center -top-0"
              style={{ left: `${marker.position}%` }}
            >
              <p className="text-sm font-semibold text-gray-700">{marker.year}</p>
            </div>
          ))}
        </div>

        {/* Date range labels */}
        <div className="flex justify-between px-0 text-xs text-gray-500 mt-8">
          <span>{formatDate(sorted[0].visitDate)}</span>
          {sorted.length > 1 && (
            <span>{formatDate(sorted[sorted.length - 1].visitDate)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
