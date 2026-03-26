"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "fifaworldcup.oauth.v1";

type Stored = {
  access_token: string;
  expires_at_ms: number;
};

function readSessionToken(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (
      typeof parsed.access_token === "string" &&
      typeof parsed.expires_at_ms === "number" &&
      parsed.expires_at_ms > Date.now() + 30_000
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeSessionToken(data: Stored) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}

export type UseFifaWorldCupTokenResult = {
  accessToken: string | null;
  expiresAtMs: number | null;
  loading: boolean;
  error: string | null;
  /** Fetches a new token; returns the bearer or null. */
  refreshToken: () => Promise<string | null>;
  /**
   * Returns a usable bearer: session, in-memory (still valid), or freshly fetched.
   * Pass as `Authorization: Bearer ${token}` to FIFA API routes so they use this token.
   */
  ensureValidToken: () => Promise<string | null>;
};

/**
 * Fetches and caches OAuth token for /fifaworldcup only (via /api/fifaworldcup/token).
 * Uses sessionStorage to avoid redundant calls on refresh while still valid.
 */
export function useFifaWorldCupToken(options?: {
  enabled?: boolean;
}): UseFifaWorldCupTokenResult {
  const enabled = options?.enabled ?? true;
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fifaworldcup/token", {
        method: "GET",
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as {
        access_token?: string;
        expires_in?: number;
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.message || `Token request failed (${res.status})`);
      }
      if (typeof data.access_token !== "string" || !data.access_token) {
        throw new Error("Invalid token response");
      }
      const expiresInSec =
        typeof data.expires_in === "number" && data.expires_in > 0
          ? data.expires_in
          : 3600;
      const exp = Date.now() + expiresInSec * 1000;
      setAccessToken(data.access_token);
      setExpiresAtMs(exp);
      writeSessionToken({ access_token: data.access_token, expires_at_ms: exp });
      return data.access_token;
    } catch (e: unknown) {
      setAccessToken(null);
      setExpiresAtMs(null);
      setError(e instanceof Error ? e.message : "Token request failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const ensureValidToken = useCallback(async (): Promise<string | null> => {
    const cached = readSessionToken();
    if (cached) {
      setAccessToken(cached.access_token);
      setExpiresAtMs(cached.expires_at_ms);
      return cached.access_token;
    }
    if (
      accessToken &&
      expiresAtMs != null &&
      expiresAtMs > Date.now() + 30_000
    ) {
      return accessToken;
    }
    return refreshToken();
  }, [accessToken, expiresAtMs, refreshToken]);

  useEffect(() => {
    if (!enabled) return;

    const cached = readSessionToken();
    if (cached) {
      setAccessToken(cached.access_token);
      setExpiresAtMs(cached.expires_at_ms);
      return;
    }

    void refreshToken();
  }, [enabled, refreshToken]);

  return {
    accessToken,
    expiresAtMs,
    loading,
    error,
    refreshToken,
    ensureValidToken,
  };
}
