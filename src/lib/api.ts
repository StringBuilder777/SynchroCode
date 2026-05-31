import { supabase } from "./supabase";

const BASE_URL = "/api";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function extractErrorMessage(payload: unknown): string | null {
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (!trimmed) return null;

    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        return extractErrorMessage(JSON.parse(trimmed)) ?? trimmed;
      } catch {
        return trimmed;
      }
    }

    return trimmed;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const message = extractErrorMessage(item);
      if (message) return message;
    }
    return null;
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const priorityKeys = ["message", "error_description", "error", "detail", "description", "title", "cause"];

  for (const key of priorityKeys) {
    if (!(key in record)) continue;
    const message = extractErrorMessage(record[key]);
    if (message) return message;
  }

  for (const value of Object.values(record)) {
    const message = extractErrorMessage(value);
    if (message) return message;
  }

  return null;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorMsg = "";
    const cloned = res.clone();

    try {
      const json = await res.json();
      errorMsg = extractErrorMessage(json) ?? "";
    } catch {}

    if (!errorMsg) {
      const rawText = await cloned.text().catch(() => "");
      errorMsg = extractErrorMessage(rawText) ?? rawText.trim();
    }

    throw new Error(errorMsg || `${method} ${path} → ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string)                  => request<T>("GET",    path),
  post:   <T>(path: string, body: unknown)   => request<T>("POST",   path, body),
  put:    <T>(path: string, body?: unknown)  => request<T>("PUT",    path, body),
  patch:  <T>(path: string, body?: unknown)  => request<T>("PATCH",  path, body),
  delete: <T>(path: string)                  => request<T>("DELETE", path),
};
