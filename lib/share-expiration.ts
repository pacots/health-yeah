export const SHARE_EXPIRATION_OPTIONS = [
  { label: "15 minutes", valueMs: 15 * 60 * 1000 },
  { label: "1 hour", valueMs: 60 * 60 * 1000 },
  { label: "24 hours", valueMs: 24 * 60 * 60 * 1000 },
  { label: "7 days", valueMs: 7 * 24 * 60 * 60 * 1000 },
] as const;

export const DEFAULT_SHARE_EXPIRATION_MS = 24 * 60 * 60 * 1000;
export const MAX_SHARE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

export function sanitizeShareExpirationMs(valueMs?: number): number {
  if (!Number.isFinite(valueMs as number) || (valueMs as number) <= 0) {
    return DEFAULT_SHARE_EXPIRATION_MS;
  }

  return Math.min(valueMs as number, MAX_SHARE_EXPIRATION_MS);
}
