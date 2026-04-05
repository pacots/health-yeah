import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

let supabase: any = null;

// Initialize Supabase only if credentials are available
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
  }
} else {
  console.warn("Supabase credentials not found. Remote sharing will be unavailable.");
}

export { supabase };

// Share snapshot schema on Supabase:
// - id: text (primary key)
// - scope: text ('emergency' | 'continuity')
// - snapshot: jsonb (full share payload)
// - status: text ('active' | 'revoked')
// - created_at: timestamptz (default now())
// - expires_at: timestamptz (nullable)

export type RemoteShare = {
  id: string;
  scope: "emergency" | "continuity";
  snapshot: any; // Full Share object
  status: "active" | "revoked";
  created_at: string;
  expires_at: string | null;
};

export type ShareMutationResult = {
  ok: boolean;
  error?: string;
  skipped?: boolean;
};

/**
 * Create and store a share snapshot remotely
 */
export async function createRemoteShare(
  shareId: string,
  scope: "emergency" | "continuity",
  snapshot: any,
  expiresAt: number
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  console.log("[Share] createRemoteShare expiration value", {
    shareId,
    expiresAt,
    expiresAtIso: new Date(expiresAt).toISOString(),
  });

  const { data, error } = await supabase
    .from("shared_snapshots")
    .insert({
      id: shareId,
      scope,
      snapshot,
      status: "active",
      expires_at: new Date(expiresAt).toISOString(),
    })
    .select("id, status, expires_at")
    .single();

  console.log("[Share] createRemoteShare insert result", { data, error });

  if (error) {
    console.error("Failed to create remote share:", error);
    throw error;
  }
}

/**
 * Fetch a share snapshot remotely by ID
 * Returns null if not found or if revoked/expired
 */
export async function getRemoteShare(shareId: string): Promise<any | null> {
  if (!supabase) {
    console.warn("Supabase not initialized, cannot fetch remote share");
    return null;
  }

  const { data, error } = await supabase
    .from("shared_snapshots")
    .select("*")
    .eq("id", shareId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null;
    }
    console.error("Failed to fetch remote share:", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  const remoteShare = data as RemoteShare;

  // Check if revoked
  if (remoteShare.status === "revoked") {
    return null;
  }

  // Check if expired
  if (remoteShare.expires_at) {
    const expiresAt = new Date(remoteShare.expires_at).getTime();
    if (expiresAt < Date.now()) {
      return null;
    }
  }

  return remoteShare.snapshot;
}

/**
 * Get remote share status (useful for checking revoked/expired without fetching full payload)
 */
export async function getRemoteShareStatus(
  shareId: string
): Promise<"active" | "revoked" | "expired" | "notfound"> {
  if (!supabase) {
    console.warn("Supabase not initialized, cannot check remote share status");
    return "notfound";
  }

  const { data, error } = await supabase
    .from("shared_snapshots")
    .select("status, expires_at")
    .eq("id", shareId)
    .single();

  if (error || !data) {
    return "notfound";
  }

  const remoteShare = data as Pick<RemoteShare, "status" | "expires_at">;

  if (remoteShare.status === "revoked") {
    return "revoked";
  }

  if (remoteShare.expires_at) {
    const expiresAt = new Date(remoteShare.expires_at).getTime();
    if (expiresAt < Date.now()) {
      return "expired";
    }
  }

  return "active";
}

/**
 * Revoke a share (mark as revoked in remote storage)
 */
export async function revokeRemoteShare(shareId: string): Promise<ShareMutationResult> {
  if (!supabase) {
    const response: ShareMutationResult = {
      ok: true,
      skipped: true,
    };
    console.log("[Share] revoke response", { shareId, response });
    return response;
  }

  const { error } = await supabase
    .from("shared_snapshots")
    .update({ status: "revoked" })
    .eq("id", shareId);

  console.log("[Share] revoke response", { shareId, error });

  if (error) {
    const normalizedError =
      (error as any)?.message ||
      (error as any)?.details ||
      JSON.stringify(error);

    return {
      ok: false,
      error: normalizedError,
    };
  }

  return {
    ok: true,
  };
}
