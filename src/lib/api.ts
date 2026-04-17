import { supabase } from "./supabase";

const BASE_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8080";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
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
    try {
      const json = await res.json();
      errorMsg = json.error || json.message || JSON.stringify(json);
    } catch {
      errorMsg = await res.text().catch(() => res.statusText);
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
