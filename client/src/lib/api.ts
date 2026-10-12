import { getAccessToken } from "./supabaseClient";

// fetch wrapper that attaches the signed-in user's Supabase token (for phone
// requests to our Express API: /api/me, /api/pair, /api/devices/:id/config...).
export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  return fetch(path, { ...init, headers });
}
