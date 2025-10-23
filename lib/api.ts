// lib/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

/** BASE URL (ajústala a tu LAN) */
export const BASE = "http://192.168.100.118:8000";

export const endpoints = {
  login:     () => `${BASE}/api/users/login/`,
  register:  () => `${BASE}/api/users/register/`,
  me:        (token: string) => `${BASE}/api/users/me/?token=${encodeURIComponent(token)}`,
  profileMe: (token: string) => `${BASE}/api/profile/me/?token=${encodeURIComponent(token)}`,
  meMedia:   (token: string) => `${BASE}/api/users/me/media/?token=${encodeURIComponent(token)}`,
  health:    () => `${BASE}/api/health/`,
};

const jsonHeaders = () => ({ "Content-Type": "application/json" });
const formHeaders = () => ({ "Content-Type": "application/x-www-form-urlencoded" });

async function safeFetch(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input as any, { signal: ctrl.signal, ...(init || {}) });
  } catch {
    throw new Error("NETWORK_ERROR");
  } finally {
    clearTimeout(id);
  }
}

export async function postForm(url: string, data: Record<string, any>) {
  const body = new URLSearchParams();
  Object.entries(data).forEach(([k, v]) => body.append(k, String(v ?? "")));
  return safeFetch(url, { method: "POST", headers: formHeaders(), body: body.toString() });
}

export async function postJson(url: string, payload: any) {
  return safeFetch(url, { method: "POST", headers: jsonHeaders(), body: JSON.stringify(payload) });
}

export async function authGetMe() {
  const token = await AsyncStorage.getItem("userToken");
  if (!token) throw new Error("No token");
  const res = await safeFetch(endpoints.me(token));
  if (!res.ok) throw new Error("No se pudo obtener el usuario");
  return res.json();
}

export async function authGetProfile() {
  const token = await AsyncStorage.getItem("userToken");
  if (!token) throw new Error("No token");
  const res = await safeFetch(endpoints.profileMe(token));
  if (!res.ok) throw new Error("No se pudo obtener el perfil");
  return res.json();
}

export async function uploadMyAvatar(file: { uri: string; name?: string; type?: string }) {
  const token = await AsyncStorage.getItem("userToken");
  if (!token) throw new Error("No token");

  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    name: file.name ?? "avatar.jpg",
    type: file.type ?? "image/jpeg",
  } as any);

  const res = await safeFetch(endpoints.meMedia(token), { method: "POST", body: form as any });
  if (!res.ok) throw new Error(await res.text().catch(() => "No se pudo subir el avatar"));
  return res.json();
}

/** Registro incluyendo birth_date (YYYY-MM-DD) y sex ("male"|"female"|"other") */
export async function registerWithProfile(data: {
  username: string;
  email: string;
  password: string;
  birth_date?: string;
  sex?: string;
}) {
  const res = await postJson(endpoints.register(), data);
  if (!res.ok) throw new Error(await res.text().catch(() => "No se pudo registrar"));
  const json = await res.json();
  await AsyncStorage.setItem("userToken", json.access_token);
  return json;
}

export async function patchMyProfile(data: { birth_date?: string; sex?: string }) {
  const token = await AsyncStorage.getItem("userToken");
  if (!token) throw new Error("No token");
  const res = await safeFetch(endpoints.profileMe(token), {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => "No se pudo actualizar el perfil"));
  return res.json();
}

export async function health() {
  const res = await safeFetch(endpoints.health(), undefined, 6000);
  if (!res.ok) throw new Error(`HEALTH_${res.status}`);
  return res.json();
}
