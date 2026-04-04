// Helper utilities for displaying source and recency metadata

/**
 * Renders a compact source badge with appropriate styling
 */
export function SourceBadge({ source }: { source: string }) {
  const config = {
    "self-reported": {
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "Self-reported",
    },
    "document-backed": {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Document-backed",
    },
    derived: {
      bg: "bg-amber-100",
      text: "text-amber-800",
      label: "AI-generated",
    },
  };

  const config_entry = config[source as keyof typeof config] || config["self-reported"];

  return (
    <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${config_entry.bg} ${config_entry.text}`}>
      {config_entry.label}
    </span>
  );
}

/**
 * Renders "Last updated" text in compact format
 */
export function LastUpdated({ timestamp }: { timestamp: number }) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let relative = "";
  if (diffMins < 1) {
    relative = "just now";
  } else if (diffMins < 60) {
    relative = `${diffMins}m ago`;
  } else if (diffHours < 24) {
    relative = `${diffHours}h ago`;
  } else if (diffDays < 30) {
    relative = `${diffDays}d ago`;
  } else {
    relative = date.toLocaleDateString();
  }

  return (
    <span className="text-xs text-gray-500">
      Updated {relative}
    </span>
  );
}

/**
 * Combines source and last updated into a compact metadata line
 */
export function RecordMetadata({ source, updatedAt }: { source: string; updatedAt: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-gray-100">
      <SourceBadge source={source} />
      <LastUpdated timestamp={updatedAt} />
    </div>
  );
}
