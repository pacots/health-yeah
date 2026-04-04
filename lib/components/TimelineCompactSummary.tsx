"use client";

import { MedicalVisitRecord } from "@/lib/types";
import { Chrono } from "react-chrono";
import "react-chrono/dist/style.css";
import { transformMedicalRecords, getSeverityColor } from "@/lib/timeline-utils";
import { useMemo, useState, useRef } from "react";

interface TimelineCompactSummaryProps {
  records: MedicalVisitRecord[];
}

export function TimelineCompactSummary({
  records,
}: TimelineCompactSummaryProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform records using the unified mapping layer
  const { importantItems } = useMemo(
    () => transformMedicalRecords(records),
    [records]
  );

  if (importantItems.length === 0) {
    return null;
  }

  // Map to react-chrono format - MINIMAL, no card data
  // Just the title (date label). No cardTitle/cardSubtitle (prevents card rendering)
  const items = importantItems.map((item) => ({
    title: item.formattedDateShort,
  }));

  const handleMarkerClick = (itemId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedItemId(itemId === selectedItemId ? null : itemId);
    
    const element = (event.currentTarget as HTMLElement).closest("[data-marker]") || event.currentTarget;
    const rect = element.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 12,
    });
  };

  const selectedItem = selectedItemId
    ? importantItems.find((item) => item.id === selectedItemId)
    : null;

  const handleClickOutside = () => {
    setSelectedItemId(null);
    setTooltipPos(null);
  };

  // Surgical CSS to strip down react-chrono to marker-only compact mode
  const stripDownCSS = `
    .timeline-compact-summary {
      width: 100%;
      position: relative;
      overflow-x: auto !important;
      overflow-y: hidden !important;
    }

    /* Main react-chrono container - keep visible and minimal */
    .timeline-compact-summary .react-chrono {
      padding: 0 !important;
      margin: 0 !important;
      background: transparent !important;
      min-height: auto !important;
      height: auto !important;
    }

    /* Hide all toolbar/control areas */
    .timeline-compact-summary [class*="Toolbar"],
    .timeline-compact-summary [class*="toolbar"],
    .timeline-compact-summary .chrono-bottom,
    .timeline-compact-summary [class*="controls"],
    .timeline-compact-summary [class*="footer"],
    .timeline-compact-summary button,
    .timeline-compact-summary input,
    .timeline-compact-summary [role="search"],
    .timeline-compact-summary [class*="search"] {
      display: none !important;
    }

    /* Hide detail card area completely */
    .timeline-compact-summary .timeline-card,
    .timeline-compact-summary [class*="content-wrapper"],
    .timeline-compact-summary [class*="timeline-content"],
    .timeline-compact-summary .timeline-details,
    .timeline-compact-summary [class*="details"],
    .timeline-compact-summary [class*="Card"] {
      display: none !important;
      height: 0 !important;
      overflow: hidden !important;
    }

    /* Timeline container - compact height */
    .timeline-compact-summary .timeline-container {
      height: auto !important;
      min-height: 50px !important;
      max-height: 60px !important;
      padding: 0 !important;
      margin: 0 !important;
      display: flex !important;
      align-items: center !important;
    }

    /* Timeline main wrapper */
    .timeline-compact-summary .timeline-main,
    .timeline-compact-summary .chrono-container {
      height: auto !important;
      min-height: 50px !important;
      max-height: 60px !important;
      padding: 10px 0 !important;
      margin: 0 !important;
      display: flex !important;
      align-items: center !important;
      position: relative !important;
    }

    /* Timeline horizontal line - thin and visible */
    .timeline-compact-summary .timeline-horizontal-line {
      height: 2px !important;
      background: #d1d5db !important;
      opacity: 1 !important;
      margin: 0 !important;
      padding: 0 !important;
      position: relative !important;
      z-index: 1 !important;
    }

    /* Timeline items wrapper */
    .timeline-compact-summary .timeline-item-basic,
    .timeline-compact-summary .timeline-item {
      padding: 0 !important;
      margin: 0 8px !important;
      height: 50px !important;
      min-height: 50px !important;
      max-height: 50px !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      position: relative !important;
    }

    /* Timeline markers/dots - visible and centered */
    .timeline-compact-summary .timeline-icon {
      width: 18px !important;
      height: 18px !important;
      border-radius: 50% !important;
      border: 2px solid white !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25) !important;
      flex-shrink: 0 !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      position: relative !important;
      z-index: 10 !important;
      background-color: #6b7280 !important;
    }

    /* Marker on hover */
    .timeline-compact-summary .timeline-icon:hover {
      width: 22px !important;
      height: 22px !important;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 30%), 0 2px 8px rgba(0, 0, 0, 0.3) !important;
      transform: scale(1.1) !important;
    }

    /* Date labels - small and readable */
    .timeline-compact-summary .timeline-item-title,
    .timeline-compact-summary .timeline-title {
      font-size: 11px !important;
      line-height: 1.1 !important;
      margin-top: 3px !important;
      margin-bottom: 0 !important;
      padding: 0 2px !important;
      font-weight: 600 !important;
      color: #6b7280 !important;
      max-width: 65px !important;
      text-align: center !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    /* Remove focus outlines and selected states */
    .timeline-compact-summary *:focus-visible {
      outline: none !important;
    }
  `;

  return (
    <div 
      className="w-full" 
      onClick={handleClickOutside}
      ref={containerRef}
    >
      <style>{stripDownCSS}</style>

      <div className="timeline-compact-summary w-full">
        <Chrono
          items={items}
          mode="HORIZONTAL"
          cardHeight={0}
          cardWidth={0}
          theme={{
            primary: "#2563eb",
            secondary: "#e5e7eb",
            titleColor: "#374151",
            cardBgColor: "transparent",
            detailsColor: "#6b7280",
          }}
        >
          {/* Minimal children for click-to-select behavior only */}
          {importantItems.map((item) => (
            <div
              key={item.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMarkerClick(item.id, e);
              }}
              role="button"
              tabIndex={0}
              aria-label={`${item.formattedDate}: ${item.title}, ${item.severity} severity`}
              aria-pressed={selectedItemId === item.id}
              style={{ padding: 0, margin: 0 }}
            />
          ))}
        </Chrono>

        {/* Inject color styles via dynamic CSS */}
        <style>
          {importantItems
            .map((item, idx) => {
              const colorScheme = getSeverityColor(item.severity);
              return `
                .timeline-compact-summary .timeline-item-basic:nth-child(${idx + 1}) .timeline-icon {
                  background-color: ${colorScheme.dot} !important;
                  border-color: white !important;
                }
                .timeline-compact-summary .timeline-item-basic:nth-child(${idx + 1}) .timeline-icon:hover {
                  background-color: ${colorScheme.dot} !important;
                  filter: brightness(0.85);
                }
              `;
            })
            .join("\n")}
        </style>
      </div>

      {/* Lightweight detail popover on marker click */}
      {selectedItem && (
        <div
          className="fixed z-50 pointer-events-auto"
          style={{
            left: tooltipPos?.x ? `${tooltipPos.x}px` : "0",
            top: tooltipPos?.y ? `${tooltipPos.y}px` : "0",
            transform: "translate(-50%, -100%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 mb-2 max-w-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {selectedItem.formattedDate}
                </p>
                <p className="font-semibold text-sm text-gray-900 mt-1">
                  {selectedItem.title}
                </p>
                {selectedItem.specialty && (
                  <p className="text-xs text-gray-600 mt-1">{selectedItem.specialty}</p>
                )}
              </div>
              <span
                className="px-2 py-1 rounded text-xs font-bold flex-shrink-0"
                style={{
                  backgroundColor: getSeverityColor(selectedItem.severity).bg,
                  color: getSeverityColor(selectedItem.severity).text,
                }}
              >
                {selectedItem.severity.charAt(0).toUpperCase() +
                  selectedItem.severity.slice(1)}
              </span>
            </div>
            {selectedItem.diagnosis && (
              <p className="text-xs text-gray-700 mt-2 pt-2 border-t border-gray-200">
                {selectedItem.diagnosis}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Summary info */}
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
        <span className="font-medium text-gray-700">{importantItems.length}</span>
        <span>important event{importantItems.length !== 1 ? "s" : ""}</span>
        {records.length > importantItems.length && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">+{records.length - importantItems.length} other</span>
          </>
        )}
      </div>
    </div>
  );
}
