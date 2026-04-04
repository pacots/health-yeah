"use client";

import { MedicalVisitRecord } from "@/lib/types";
import { transformMedicalRecords, getSeverityColor } from "@/lib/timeline-utils";
import { useMemo } from "react";

interface MedicalHistorySummaryStripProps {
  records: MedicalVisitRecord[];
}

export function MedicalHistorySummaryStrip({
  records,
}: MedicalHistorySummaryStripProps) {
  // Get only important events, sorted by date (newest first), pick top 3, then reorder oldest-to-newest
  const displayEvents = useMemo(() => {
    const { allItems } = transformMedicalRecords(records);
    
    // Filter to important events
    const importantEvents = allItems.filter((item) => item.isImportant);
    
    if (importantEvents.length === 0) {
      return [];
    }
    
    // Sort by date descending (newest first)
    const sortedByDateDesc = [...importantEvents].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
    
    // Take top 3
    const top3Newest = sortedByDateDesc.slice(0, 3);
    
    // Reorder to oldest-to-newest for left-to-right display
    const orderedOldestToNewest = [...top3Newest].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    
    return orderedOldestToNewest;
  }, [records]);

  if (displayEvents.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-6">
      {/* Timeline strip container */}
      <div className="relative h-24 flex items-center">
        {/* Background horizontal line */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-300 transform -translate-y-1/2" />

        {/* Events grid - equally spaced */}
        <div className="w-full flex justify-around items-start relative z-10 px-4">
          {displayEvents.map((event) => {
            const colorScheme = getSeverityColor(event.severity);
            return (
              <div
                key={event.id}
                className="flex flex-col items-center gap-2"
              >
                {/* Marker dot */}
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                  style={{
                    backgroundColor: colorScheme.dot,
                  }}
                />

                {/* Event info below */}
                <div className="text-center mt-2">
                  <p className="text-xs font-semibold text-gray-900 truncate max-w-16">
                    {event.title}
                  </p>
                  <p className="text-xs text-gray-600">
                    {event.formattedDate}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
