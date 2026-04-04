"use client";

import { MedicalVisitRecord } from "@/lib/types";
import { transformMedicalRecords, getSeverityColor } from "@/lib/timeline-utils";
import { useMemo } from "react";

interface TimelineExpandedVerticalProps {
  records: MedicalVisitRecord[];
  onEditRecord?: (record: MedicalVisitRecord) => void;
  onDeleteRecord?: (id: string) => void;
}

interface GroupedRecords {
  year: number;
  months: Array<{
    month: string;
    items: ReturnType<typeof transformMedicalRecords>["allItems"];
  }>;
}

export function TimelineExpandedVertical({
  records,
  onEditRecord,
  onDeleteRecord,
}: TimelineExpandedVerticalProps) {
  // Use the unified mapping layer to get all items
  const { allItems } = useMemo(
    () => transformMedicalRecords(records),
    [records]
  );

  if (allItems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        <p>No medical records yet</p>
      </div>
    );
  }

  // Sort by date descending (newest first)
  const sorted = [...allItems].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  // Group by year and month
  const grouped = sorted.reduce<GroupedRecords[]>((acc, item) => {
    const year = item.date.getFullYear();
    const monthKey = item.formattedMonthYear;

    let yearGroup = acc.find((g) => g.year === year);
    if (!yearGroup) {
      yearGroup = { year, months: [] };
      acc.push(yearGroup);
    }

    let monthGroup = yearGroup.months.find((m) => m.month === monthKey);
    if (!monthGroup) {
      monthGroup = { month: monthKey, items: [] };
      yearGroup.months.push(monthGroup);
    }

    monthGroup.items.push(item);
    return acc;
  }, []);

  return (
    <div className="space-y-8">
      {grouped.map((yearGroup) => (
        <div key={yearGroup.year}>
          {/* Year header */}
          <h3 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-200">
            {yearGroup.year}
          </h3>

          {/* Timeline for this year */}
          <div className="space-y-0 relative">
            {/* Vertical line */}
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* Month groups */}
            {yearGroup.months.map((monthGroup) => (
              <div key={monthGroup.month} className="space-y-4 pl-12 pb-8">
                {/* Month header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center relative z-10" />
                  <h4 className="text-sm font-bold text-gray-700">{monthGroup.month}</h4>
                </div>

                {/* Events in this month */}
                <div className="space-y-3 -mt-2 -ml-12 pl-12">
                  {monthGroup.items.map((item) => {
                    const colorScheme = getSeverityColor(item.severity);
                    const sourceRecord = item.sourceRecord;

                    return (
                      <div key={item.id} className="relative flex gap-4 group">
                        {/* Dot on line */}
                        <div
                          className="absolute -left-12 top-2 w-6 h-6 rounded-full border-4 border-white shadow-md flex items-center justify-center relative z-10 flex-shrink-0"
                          style={{
                            backgroundColor: colorScheme.dot,
                          }}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor: colorScheme.dot,
                            }}
                          />
                        </div>

                        {/* Event card */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow flex-1">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                {item.formattedDate}
                              </p>
                              <h4 className="text-base font-semibold text-gray-900 mt-1">
                                {item.title}
                              </h4>
                            </div>
                            <span
                              className="px-2 py-1 rounded text-xs font-semibold flex-shrink-0"
                              style={{
                                backgroundColor: colorScheme.bg,
                                color: colorScheme.text,
                              }}
                            >
                              {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
                            </span>
                          </div>

                          {/* Specialty/Category */}
                          {(item.specialty || item.category) && (
                            <p className="text-sm text-gray-600 mb-3">
                              {item.specialty || item.category}
                            </p>
                          )}

                          {/* Details */}
                          <div className="space-y-2 text-sm">
                            {item.diagnosis && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Diagnosis
                                </p>
                                <p className="text-gray-700">{item.diagnosis}</p>
                              </div>
                            )}

                            {item.treatment && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Treatment
                                </p>
                                <p className="text-gray-700">{item.treatment}</p>
                              </div>
                            )}

                            {item.provider && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Provider
                                </p>
                                <p className="text-gray-700">Dr. {item.provider}</p>
                              </div>
                            )}

                            {item.doctorNotes && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Notes
                                </p>
                                <p className="text-gray-700">{item.doctorNotes}</p>
                              </div>
                            )}
                          </div>

                          {/* Importance badge */}
                          {item.isImportant && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-orange-600 flex items-center gap-1">
                                ⭐ Important event
                              </p>
                            </div>
                          )}

                          {/* Edit/Delete actions - shown on hover */}
                          {(onEditRecord || onDeleteRecord) && (
                            <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {onEditRecord && (
                                <button
                                  onClick={() => onEditRecord(sourceRecord)}
                                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition"
                                >
                                  Edit
                                </button>
                              )}
                              {onDeleteRecord && (
                                <button
                                  onClick={() => onDeleteRecord(item.id)}
                                  className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 rounded text-red-700 transition"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
