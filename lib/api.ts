// lib/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/**
 * BASE URL
 * - Lee de env de Expo: EXPO_PUBLIC_API_BASE
 * - Si no está definida, usa un fallback por plataforma/LAN
 */
const FALLBACK = Platform.select({
  ios: "http://192.168.100.118:8000",
  android: "http://192.168.100.118:8000",
  default: "http://192.168.100.118:8000",
});

export const BASE = (process.env.EXPO_PUBLIC_API_BASE?.trim() || FALLBACK) as string;

if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log("🔌 API BASE =", BASE);
}

/* ------------------------------- Endpoints ------------------------------- */
export const endpoints = {
  // Auth & Perfil
  login: () => `${BASE}/api/users/login/`,
  register: () => `${BASE}/api/users/register/`,
  me: (token: string) => `${BASE}/api/users/me/?token=${encodeURIComponent(token)}`,
  profileMe: (token: string) =>
    `${BASE}/api/profile/me/?token=${encodeURIComponent(token)}`,
  meMedia: (token: string) =>
    `${BASE}/api/users/me/media/?token=${encodeURIComponent(token)}`,
  health: () => `${BASE}/api/health/`,

  // Feed (global)
  feedList: (token: string, limit = 10, offset = 0) =>
    `${BASE}/api/feed/?token=${encodeURIComponent(token)}&limit=${limit}&offset=${offset}`,
  feedCreate: (token: string) => `${BASE}/api/feed/?token=${encodeURIComponent(token)}`,
  feedView: (id: number) => `${BASE}/api/feed/${id}/view/`,

  // ⭐ feed: toggle y listado
  feedStar: (token: string, postId: number) =>
    `${BASE}/api/feed/${postId}/star/?token=${encodeURIComponent(token)}`,
  feedStars: (token: string, postId: number, limit = 100, offset = 0) =>
    `${BASE}/api/feed/${postId}/stars/?token=${encodeURIComponent(
      token
    )}&limit=${limit}&offset=${offset}`,

  // 👇 Feed por usuario (para el Perfil / grid tipo Instagram)
  feedMine: (token: string, limit = 30, offset = 0) =>
    `${BASE}/api/feed/me/?token=${encodeURIComponent(token)}&limit=${limit}&offset=${offset}`,
  feedByUser: (token: string, userId: number, limit = 30, offset = 0) =>
    `${BASE}/api/feed/user/${userId}/?token=${encodeURIComponent(
      token
    )}&limit=${limit}&offset=${offset}`,

  // Comentarios
  commentsList: (token: string, postId: number) =>
    `${BASE}/api/comments/post/${postId}/?token=${encodeURIComponent(token)}`,
  commentsStats: (token: string, postId: number) =>
    `${BASE}/api/comments/post/${postId}/stats/?token=${encodeURIComponent(token)}`,
  commentCreate: (token: string) =>
    `${BASE}/api/comments/?token=${encodeURIComponent(token)}`,
  commentReply: (token: string, commentId: number) =>
    `${BASE}/api/comments/${commentId}/reply/?token=${encodeURIComponent(token)}`,
  commentMedia: (token: string, commentId: number) =>
    `${BASE}/api/comments/${commentId}/media/?token=${encodeURIComponent(token)}`,
  commentStar: (token: string, commentId: number) =>
    `${BASE}/api/comments/${commentId}/star/?token=${encodeURIComponent(token)}`,

  // GIFs (tu backend actúa como proxy / servicio local)
  gifsTrending: (token: string, limit = 16) =>
    `${BASE}/api/gif/trending/?token=${encodeURIComponent(token)}&limit=${limit}`,
  gifsSearch: (token: string, q: string, limit = 16) =>
    `${BASE}/api/gif/search/?token=${encodeURIComponent(
      token
    )}&q=${encodeURIComponent(q)}&limit=${limit}`,
};

/* --------------------------------- Utils -------------------------------- */

const jsonHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
});

const formHeaders = () => ({
  "Content-Type": "application/x-www-form-urlencoded",
  Accept: "application/json",
});

export function toAbsolute(path?: string | null): string | null | undefined {
  if (!path) return path;
  // si ya es absoluta, la dejamos
  if (/^https?:\/\//i.test(path)) return path;
  // si viene como "/media/..."
  if (path.startsWith("/")) return `${BASE}${path}`;
  // caso normal relativo
  return `${BASE}/${path}`;
}

/**
 * safeFetch
 * - Timeouts: 15s normal / 10min para uploads (FormData)
 */
const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;

async function safeFetch(
  input: RequestInfo | URL | string,
  init?: RequestInit,
  timeoutMs = 15000
) {
  const isUpload =
    init?.method?.toUpperCase() === "POST" &&
    typeof FormData !== "undefined" &&
    init?.body instanceof FormData;

  const effectiveTimeout = isUpload ? UPLOAD_TIMEOUT_MS : timeoutMs;

  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), effectiveTimeout);

  try {
    return await fetch(input as any, {
      signal: ctrl.signal,
      ...(init || {}),
    });
  } catch {
    throw new Error("NETWORK_ERROR");
  } finally {
    clearTimeout(id);
  }
}

async function getTokenOrThrow() {
  const token = await AsyncStorage.getItem("userToken");
  if (!token) throw new Error("No token");
  return token;
}

/* ------------------------------ Auth & Perfil --------------------------- */

export async function postForm(url: string, data: Record<string, any>) {
  const body = new URLSearchParams();
  Object.entries(data).forEach(([k, v]) => body.append(k, String(v ?? "")));
  return safeFetch(url, {
    method: "POST",
    headers: formHeaders(),
    body: body.toString(),
  });
}

export async function postJson(url: string, payload: any) {
  return safeFetch(url, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function authGetMe() {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.me(token));
  if (!res.ok) throw new Error("No se pudo obtener el usuario");
  return res.json();
}

export async function authGetProfile() {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.profileMe(token));
  if (!res.ok) throw new Error("No se pudo obtener el perfil");
  return res.json();
}

export async function uploadMyAvatar(file: {
  uri: string;
  name?: string;
  type?: string;
}) {
  const token = await getTokenOrThrow();
  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    name: file.name ?? "avatar.jpg",
    type: file.type ?? "image/jpeg",
  } as any);
  const res = await safeFetch(endpoints.meMedia(token), {
    method: "POST",
    body: form as any,
  });
  if (!res.ok)
    throw new Error(
      (await res.text().catch(() => "")) || "No se pudo subir el avatar"
    );
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
  if (!res.ok)
    throw new Error(await res.text().catch(() => "No se pudo registrar"));

  const json = await res.json();
  await AsyncStorage.setItem("userToken", json.access_token);
  return json;
}

export async function patchMyProfile(data: {
  birth_date?: string;
  sex?: string;
}) {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.profileMe(token), {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error(
      await res.text().catch(() => "No se pudo actualizar el perfil")
    );
  return res.json();
}

export async function health() {
  const res = await safeFetch(endpoints.health(), undefined, 6000);
  if (!res.ok) throw new Error(`HEALTH_${res.status}`);
  return res.json();
}

/* ---------------------------------- Feed -------------------------------- */

export type FeedAuthor = {
  id: number;
  username: string;
  avatar?: string | null;
};

export type FeedPost = {
  id: number;
  media: string;
  caption?: string | null;
  created_at: string;
  views_count: number;
  author: FeedAuthor;

  // ⭐ NUEVO (viene del backend)
  stars_count: number;
  starred: boolean;
};

export async function publishPost(
  file: { uri: string; name?: string; type?: string },
  caption?: string
): Promise<FeedPost> {
  const token = await getTokenOrThrow();
  const url = endpoints.feedCreate(token);

  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    name:
      file.name ??
      (file.type?.startsWith("image/") ? "image.jpg" : "video.mp4"),
    type: file.type ?? "video/mp4",
  } as any);
  if (caption) form.append("caption", caption);

  const res = await safeFetch(url, {
    method: "POST",
    body: form as any,
  });

  if (!res.ok)
    throw new Error(await res.text().catch(() => "No se pudo publicar"));
  return res.json();
}

export async function fetchFeed(
  limit = 10,
  offset = 0
): Promise<FeedPost[]> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.feedList(token, limit, offset));
  if (!res.ok)
    throw new Error(
      await res.text().catch(() => "No se pudo cargar el feed")
    );
  return res.json();
}

export async function trackView(
  postId: number
): Promise<{ views_count: number } | null> {
  const res = await safeFetch(endpoints.feedView(postId), {
    method: "POST",
  });
  if (!res.ok) return null;
  return res.json();
}

/* ---------- Feed para Perfil (mis publicaciones / por usuario) ---------- */

export async function fetchMyPosts(
  limit = 30,
  offset = 0
): Promise<FeedPost[]> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.feedMine(token, limit, offset));
  if (!res.ok)
    throw new Error(
      await res
        .text()
        .catch(() => "No se pudo cargar mis publicaciones")
    );
  return res.json();
}

export async function fetchUserPosts(
  userId: number,
  limit = 30,
  offset = 0
): Promise<FeedPost[]> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(
    endpoints.feedByUser(token, userId, limit, offset)
  );
  if (!res.ok)
    throw new Error(
      await res
        .text()
        .catch(() => "No se pudo cargar publicaciones del usuario")
    );
  return res.json();
}

/* -------------------------- ⭐ FEED STARS -------------------------- */

export type FeedStarUser = {
  id: number;
  username: string;
  avatar?: string | null;
};

export async function toggleFeedStar(
  postId: number
): Promise<{ post_id: number; stars_count: number; starred: boolean }> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.feedStar(token, postId), {
    method: "POST",
  });
  if (!res.ok) throw new Error("No se pudo marcar estrella del post");
  return res.json();
}

export async function fetchFeedStars(
  postId: number,
  limit = 100,
  offset = 0
): Promise<FeedStarUser[]> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(
    endpoints.feedStars(token, postId, limit, offset)
  );
  if (!res.ok) throw new Error("No se pudo cargar las estrellas del post");
  return res.json();
}

/* ------------------------------- Comments ------------------------------- */

export type CommentNode = {
  id: number;
  post_id: number;
  parent_id: number | null;
  text: string | null;
  media: string | null;
  gift: string | null;
  style: any;
  created_at: string;
  author: {
    id: number;
    username: string;
    avatar?: string | null;
  };
  // ⭐ nuevo
  stars_count: number;
  starred: boolean;
  replies: CommentNode[];
};

export type CommentStats = {
  comments_count: number;
  replies_count: number;
  total_count: number;
  stars_count: number;
};

export async function fetchComments(postId: number): Promise<CommentNode[]> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.commentsList(token, postId));
  if (!res.ok) throw new Error("No se pudo cargar comentarios");
  return res.json();
}

export async function fetchCommentsStats(
  postId: number
): Promise<CommentStats> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.commentsStats(token, postId));
  if (!res.ok) throw new Error("No se pudo cargar stats de comentarios");
  return res.json();
}

export async function createComment(
  postId: number,
  payload: { text?: string; gift?: string; style?: any } = {}
): Promise<CommentNode> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.commentCreate(token), {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      post_id: postId,
      ...payload,
    }),
  });
  if (!res.ok) throw new Error("No se pudo comentar");
  return res.json();
}

export async function replyComment(
  commentId: number,
  payload: { text?: string; gift?: string; style?: any } = {}
): Promise<CommentNode> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.commentReply(token, commentId), {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("No se pudo responder");
  return res.json();
}

export async function uploadCommentMedia(
  commentId: number,
  file: { uri: string; name?: string; type?: string }
): Promise<CommentNode> {
  const token = await getTokenOrThrow();
  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    name: file.name ?? "comment.jpg",
    type: file.type ?? "image/jpeg",
  } as any);
  const res = await safeFetch(endpoints.commentMedia(token, commentId), {
    method: "POST",
    body: form as any,
  });
  if (!res.ok) throw new Error("No se pudo subir media del comentario");
  return res.json();
}

/** Crear comentario raíz CON GIF */
export async function createCommentWithGif(postId: number, gifUrl: string) {
  return createComment(postId, { gift: gifUrl });
}

/** Responder a un comentario CON GIF */
export async function replyWithGif(commentId: number, gifUrl: string) {
  return replyComment(commentId, { gift: gifUrl });
}

// ⭐ toggle star de comentario
export async function toggleCommentStar(
  commentId: number
): Promise<{ id: number; stars_count: number; starred: boolean }> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.commentStar(token, commentId), {
    method: "POST",
  });
  if (!res.ok) throw new Error("No se pudo marcar estrella");
  return res.json();
}

/* ------------------------------- GIFS EXTRA ------------------------------- */

export type GifItem = {
  id: string;
  title?: string;
  url: string;
  width?: number;
  height?: number;
};

function mapTenorResponseToGifItems(raw: any): GifItem[] {
  if (!raw) return [];
  const results = Array.isArray(raw) ? raw : raw.results || raw.items || [];

  return results
    .map((r: any) => {
      // Caso 1: backend local → ya trae url directa
      if (r && typeof r.url === "string" && !r.media_formats) {
        return {
          id: String(r.id ?? r.url),
          title: r.title || "",
          url: toAbsolute(r.url) || r.url,
          width: r.width,
          height: r.height,
        } as GifItem;
      }

      // Caso 2: Tenor v2
      const mf = r?.media_formats || {};
      const chosen =
        mf.tinygif ||
        mf.gif ||
        mf.mediumgif ||
        (mf ? (Object.values(mf) as any[])[0] : undefined);
      if (!chosen?.url) return null;
      return {
        id: String(r.id),
        title: r.content_description || r.title || "",
        url: toAbsolute(chosen.url) || chosen.url,
        width: Array.isArray(chosen.dims) ? chosen.dims[0] : undefined,
        height: Array.isArray(chosen.dims) ? chosen.dims[1] : undefined,
      } as GifItem;
    })
    .filter(Boolean) as GifItem[];
}

export async function fetchTrendingGifs(limit = 16): Promise<GifItem[]> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.gifsTrending(token, limit));
  if (!res.ok) return [];
  const data = await res.json();
  return mapTenorResponseToGifItems(data);
}

export async function searchGifs(
  q: string,
  limit = 16
): Promise<GifItem[]> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.gifsSearch(token, q, limit));
  if (!res.ok) return [];
  const data = await res.json();
  return mapTenorResponseToGifItems(data);
}
