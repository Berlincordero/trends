// lib/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

/**
 * BASE URL – forzamos la IP LAN del backend
 * Asegúrate que coincide con la que imprime tu script como "API LAN"
 */
export const BASE = "http://192.168.100.142:8000";


if (__DEV__) {
  console.log("🔌 API BASE =", BASE);
}

/* ------------------------------- Endpoints ------------------------------- */

export const endpoints = {
  // Auth & Perfil
  login: () => `${BASE}/api/users/login/`,
  register: () => `${BASE}/api/users/register/`,
  me: (token: string) =>
    `${BASE}/api/users/me/?token=${encodeURIComponent(token)}`,
  profileMe: (token: string) =>
    `${BASE}/api/profile/me/?token=${encodeURIComponent(token)}`,
  meMedia: (token: string) =>
    `${BASE}/api/users/me/media/?token=${encodeURIComponent(token)}`,
  health: () => `${BASE}/api/health/`,

  // Feed
  feedList: (token: string, limit = 10, offset = 0) =>
    `${BASE}/api/feed/?token=${encodeURIComponent(
      token
    )}&limit=${limit}&offset=${offset}`,
  feedCreate: (token: string) =>
    `${BASE}/api/feed/?token=${encodeURIComponent(token)}`,
  feedView: (id: number) => `${BASE}/api/feed/${id}/view/`,

  // editar / eliminar
  feedUpdate: (token: string, id: number) =>
    `${BASE}/api/feed/${id}/?token=${encodeURIComponent(token)}`,
  feedDelete: (token: string, id: number) =>
    `${BASE}/api/feed/${id}/?token=${encodeURIComponent(token)}`,

  // ⭐
  feedStar: (token: string, postId: number) =>
    `${BASE}/api/feed/${postId}/star/?token=${encodeURIComponent(token)}`,
  feedStars: (token: string, postId: number, limit = 100, offset = 0) =>
    `${BASE}/api/feed/${postId}/stars/?token=${encodeURIComponent(
      token
    )}&limit=${limit}&offset=${offset}`,

  // Feed por usuario
  feedMine: (token: string, limit = 30, offset = 0) =>
    `${BASE}/api/feed/me/?token=${encodeURIComponent(
      token
    )}&limit=${limit}&offset=${offset}`,
  feedByUser: (token: string, userId: number, limit = 30, offset = 0) =>
    `${BASE}/api/feed/user/${userId}/?token=${encodeURIComponent(
      token
    )}&limit=${limit}&offset=${offset}`,

  // Clips (vibes)
  // - POST /api/clips/ -> crear nuevo clip
  // - GET /api/clips/ -> feed global de clips
  // - GET /api/clips/me/ -> último clip del usuario actual
  clipsList: (token: string, limit = 16, offset = 0) =>
    `${BASE}/api/clips/?token=${encodeURIComponent(
      token
    )}&limit=${limit}&offset=${offset}`,
  clipsCreate: (token: string) =>
    `${BASE}/api/clips/?token=${encodeURIComponent(token)}`,
  clipsMe: (token: string) =>
    `${BASE}/api/clips/me/?token=${encodeURIComponent(token)}`,

  // Feed global de vibes (usa el mismo /api/clips/)
  clipsFeed: (token: string, limit = 24, offset = 0) =>
    `${BASE}/api/clips/?token=${encodeURIComponent(
      token
    )}&limit=${limit}&offset=${offset}`,

  // Clips por usuario (para VibePlayer carrusel)
  clipsByUser: (token: string, userId: number, limit = 32, offset = 0) =>
    `${BASE}/api/clips/user/${userId}/?token=${encodeURIComponent(
      token
    )}&limit=${limit}&offset=${offset}`,

  // Eliminar clip
  clipsDelete: (token: string, clipId: number) =>
    `${BASE}/api/clips/${clipId}/?token=${encodeURIComponent(token)}`,

  // Musiquita asociada a un clip
  clipMusic: (token: string, clipId: number) =>
    `${BASE}/api/clips/${clipId}/music/?token=${encodeURIComponent(token)}`,

  // 👁‍🗨 Vistas / viewers de un clip
  clipView: (token: string, clipId: number) =>
    `${BASE}/api/clips/${clipId}/view/?token=${encodeURIComponent(token)}`,
  clipViewers: (token: string, clipId: number, limit = 50, offset = 0) =>
    `${BASE}/api/clips/${clipId}/viewers/?token=${encodeURIComponent(
      token
    )}&limit=${limit}&offset=${offset}`,

  // ⭐ Estrellas de clips
  clipStar: (token: string, clipId: number) =>
    `${BASE}/api/clips/${clipId}/star/?token=${encodeURIComponent(token)}`,
  clipStars: (token: string, clipId: number, limit = 100, offset = 0) =>
    `${BASE}/api/clips/${clipId}/stars/?token=${encodeURIComponent(
      token
    )}&limit=${limit}&offset=${offset}`,

  // Comentarios
  commentsList: (token: string, postId: number) =>
    `${BASE}/api/comments/post/${postId}/?token=${encodeURIComponent(token)}`,
  commentsStats: (token: string, postId: number) =>
    `${BASE}/api/comments/post/${postId}/stats/?token=${encodeURIComponent(
      token
    )}`,
  commentCreate: (token: string) =>
    `${BASE}/api/comments/?token=${encodeURIComponent(token)}`,
  commentReply: (token: string, commentId: number) =>
    `${BASE}/api/comments/${commentId}/reply/?token=${encodeURIComponent(
      token
    )}`,
  commentMedia: (token: string, commentId: number) =>
    `${BASE}/api/comments/${commentId}/media/?token=${encodeURIComponent(
      token
    )}`,
  commentStar: (token: string, commentId: number) =>
    `${BASE}/api/comments/${commentId}/star/?token=${encodeURIComponent(
      token
    )}`,

  // GIFs
  gifsTrending: (token: string, limit = 16) =>
    `${BASE}/api/gif/trending/?token=${encodeURIComponent(
      token
    )}&limit=${limit}`,
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
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return `${BASE}${path}`;
  return `${BASE}/${path}`;
}

/** Detecta si una URL (sin querystring) apunta a imagen */
export function isLikelyImageUrl(u?: string | null): boolean {
  if (!u) return false;
  const clean = u.split("?")[0] || "";
  return /\.(png|jpe?g|gif|webp)$/i.test(clean);
}

/** Detecta si apunta a HLS */
export function isHlsUrl(u?: string | null): boolean {
  if (!u) return false;
  const clean = u.split("?")[0] || "";
  return /\.m3u8$/i.test(clean);
}

/**
 * safeFetch (timeout 15s / 10min uploads)
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
    (init?.body as any) instanceof FormData;

  const effectiveTimeout = isUpload ? UPLOAD_TIMEOUT_MS : timeoutMs;

  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), effectiveTimeout);

  try {
    return await fetch(input as any, {
      signal: ctrl.signal,
      ...(init || {}),
    });
  } catch (e) {
    if (__DEV__) {
      console.log("❌ safeFetch NETWORK_ERROR ->", input, e);
    }
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

// Alias cómodo, por si prefieres usar getMe()
export async function getMe() {
  return authGetMe();
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

/** Registro incluyendo birth_date y sex */
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

/* --------------------------- Helpers base64 UTF-8 ------------------------ */

function utf8BytesOf(s: string): Uint8Array {
  const enc = encodeURIComponent(s);
  const bytes: number[] = [];
  for (let i = 0; i < enc.length; ) {
    const c = enc[i];
    if (c === "%") {
      bytes.push(parseInt(enc.substr(i + 1, 2), 16));
      i += 3;
    } else {
      bytes.push(enc.charCodeAt(i));
      i += 1;
    }
  }
  return new Uint8Array(bytes);
}

function base64FromBytes(bytes: Uint8Array): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  let i = 0;

  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out +=
      chars[(n >> 18) & 63] +
      chars[(n >> 12) & 63] +
      chars[(n >> 6) & 63] +
      chars[n & 63];
  }

  const rem = bytes.length - i;
  if (rem === 1) {
    const n = bytes[i] << 16;
    out += chars[(n >> 18) & 63] + chars[(n >> 12) & 63] + "==";
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out +=
      chars[(n >> 18) & 63] +
      chars[(n >> 12) & 63] +
      chars[(n >> 6) & 63] +
      "=";
  }

  return out;
}

function toBase64Utf8(s: string): string {
  return base64FromBytes(utf8BytesOf(s));
}

/* ---------------------------------- Feed -------------------------------- */

export type FeedAuthor = {
  id: number;
  username: string;
  avatar?: string | null;
};

/** Meta de estilo de captions de texto (lo que ahora guarda el backend en caption_meta) */
export type TextCaptionStyleMeta = {
  color?: string;
  align?: "left" | "center" | "right";
  fontSize?: number;
  shadowColor?: string;
  bubbleColor?: string;
  fontFamily?: string;
};

export type TextCaptionMeta = {
  kind: "text";
  text: string;
  style?: TextCaptionStyleMeta;
};

export type FeedPost = {
  id: number;
  media: string; // puede ser /hls/... .m3u8, /media/... .mp4, o imagen .jpg/.png/.webp/.gif
  caption?: string | null;
  caption_meta?: TextCaptionMeta | null; // meta estructurada
  created_at: string;
  views_count: number;
  author: FeedAuthor;
  stars_count: number;
  starred: boolean;
};

/** Clips (vibes) */
export type Clip = {
  id: number;
  media: string;
  kind?: "image" | "video";
  created_at: string;
  expires_at?: string | null;
  author?: FeedAuthor;
};

/** Usuarios que vieron un clip */
export type ClipViewerUser = {
  id: number;
  username: string;
  avatar?: string | null;
};

/** Usuarios que dieron estrella a un clip */
export type ClipStarUser = {
  id: number;
  username: string;
  avatar?: string | null;
};

export async function publishPost(
  file: { uri: string; name?: string; type?: string },
  caption?: string
): Promise<FeedPost> {
  const token = await getTokenOrThrow();
  const url = endpoints.feedCreate(token);

  const isImage = !!file.type && file.type.startsWith("image/");
  const mimeType = file.type ?? (isImage ? "image/jpeg" : "video/mp4");

  try {
    const info: FileSystem.FileInfo = await FileSystem.getInfoAsync(file.uri);
    if (__DEV__) {
      const sizeMb =
        typeof info.size === "number" ? info.size / (1024 * 1024) : undefined;
      console.log(
        "📦 publishPost size MB =",
        sizeMb !== undefined ? sizeMb.toFixed(2) : "?"
      );
    }
  } catch {}

  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    name: file.name ?? (isImage ? "image.jpg" : "video.mp4"),
    type: mimeType,
  } as any);

  if (typeof caption === "string") {
    form.append("caption", caption);
    form.append("caption_b64", toBase64Utf8(caption));
  }

  const res = await safeFetch(
    url,
    {
      method: "POST",
      body: form as any,
    },
    UPLOAD_TIMEOUT_MS
  );

  if (!res.ok)
    throw new Error(
      (await res.text().catch(() => "")) || "No se pudo publicar"
    );
  return res.json();
}

/** Publicar clip/vibe (solo media, sin caption) */
export async function publishClip(
  file: { uri: string; name?: string; type?: string }
): Promise<Clip> {
  const token = await getTokenOrThrow();
  const url = endpoints.clipsCreate(token);

  const isImage = !!file.type && file.type.startsWith("image/");
  const mimeType = file.type ?? (isImage ? "image/jpeg" : "video/mp4");

  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    name: file.name ?? (isImage ? "vibe.jpg" : "vibe.mp4"),
    type: mimeType,
  } as any);

  const res = await safeFetch(
    url,
    {
      method: "POST",
      body: form as any,
    },
    UPLOAD_TIMEOUT_MS
  );

  if (!res.ok)
    throw new Error(
      (await res.text().catch(() => "")) || "No se pudo publicar la vibra"
    );
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

/** Obtener mis clips (lista, si la usas en algún lado) */
export async function fetchMyClips(
  limit = 16,
  offset = 0
): Promise<Clip[]> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.clipsList(token, limit, offset));
  if (!res.ok)
    throw new Error(
      await res.text().catch(() => "No se pudieron cargar los clips")
    );
  return res.json();
}

/** Obtener mi último clip REAL desde /api/clips/me/ */
export async function fetchMyClip(): Promise<Clip | null> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.clipsMe(token));
  if (!res.ok) {
    return null;
  }
  return res.json();
}

/** Feed global de vibes (para carrusel tipo historias) */
export async function fetchVibesFeed(
  limit = 24,
  offset = 0
): Promise<Clip[]> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.clipsFeed(token, limit, offset));
  if (!res.ok)
    throw new Error(
      await res.text().catch(() => "No se pudo cargar el feed de vibes")
    );
  return res.json();
}

/** Historias de un usuario concreto (para VibePlayer carrusel) */
export async function listUserClips(
  userId: number,
  limit = 32,
  offset = 0
): Promise<Clip[]> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(
    endpoints.clipsByUser(token, userId, limit, offset)
  );
  if (!res.ok)
    throw new Error(
      await res.text().catch(
        () => "No se pudieron cargar las historias del usuario"
      )
    );
  return res.json();
}

/** Eliminar un clip (solo autor) */
export async function deleteClip(clipId: number): Promise<void> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.clipsDelete(token, clipId), {
    method: "DELETE",
  });
  if (!res.ok)
    throw new Error(
      await res.text().catch(() => "No se pudo eliminar el clip")
    );
}

/** Obtener música asociada a un clip (devuelve id de track o null) */
export async function getClipMusic(
  clipId: number
): Promise<string | null> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.clipMusic(token, clipId));
  if (!res.ok) return null;

  try {
    const data = await res.json();
    const trackId = data?.track_id ?? data?.trackId ?? null;
    return typeof trackId === "string" ? trackId : null;
  } catch {
    return null;
  }
}

/** Guardar música asociada a un clip (trackId puede ser null para limpiar) */
export async function setClipMusic(
  clipId: number,
  trackId: string | null
): Promise<void> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.clipMusic(token, clipId), {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ track_id: trackId }),
  });

  if (!res.ok) {
    throw new Error(
      (await res.text().catch(() => "")) ||
        "No se pudo guardar la música del clip"
    );
  }
}

/** Registrar vista de un clip (vibra) */
export async function trackClipView(
  clipId: number
): Promise<{ clip_id: number; views_count: number } | null> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.clipView(token, clipId), {
    method: "POST",
  });
  if (!res.ok) return null;
  return res.json();
}

/** Obtener viewers de un clip (solo autor) */
export async function fetchClipViewers(
  clipId: number,
  limit = 50,
  offset = 0
): Promise<{ total: number; viewers: ClipViewerUser[] }> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(
    endpoints.clipViewers(token, clipId, limit, offset)
  );
  if (!res.ok)
    throw new Error("No se pudieron cargar los viewers de la vibra");
  return res.json();
}

/** Estrellitas de clips: toggle + listado */
export async function toggleClipStar(
  clipId: number
): Promise<{ clip_id: number; stars_count: number; starred: boolean }> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.clipStar(token, clipId), {
    method: "POST",
  });
  if (!res.ok) throw new Error("No se pudo marcar estrella del clip");
  return res.json();
}

export async function fetchClipStars(
  clipId: number,
  limit = 100,
  offset = 0
): Promise<ClipStarUser[]> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(
    endpoints.clipStars(token, clipId, limit, offset)
  );
  if (!res.ok) throw new Error("No se pudo cargar las estrellas del clip");
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

export async function fetchMyPosts(
  limit = 30,
  offset = 0
): Promise<FeedPost[]> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.feedMine(token, limit, offset));
  if (!res.ok)
    throw new Error(
      await res.text().catch(() => "No se pudo cargar mis publicaciones")
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
      await res.text().catch(
        () => "No se pudo cargar publicaciones del usuario"
      )
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

/* ------------------------ Feed: editar / eliminar ------------------------ */

export async function updatePost(
  postId: number,
  payload: { caption?: string }
): Promise<FeedPost> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.feedUpdate(token, postId), {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok)
    throw new Error(
      await res.text().catch(() => "No se pudo actualizar la publicación")
    );
  return res.json();
}

export async function deletePost(postId: number): Promise<void> {
  const token = await getTokenOrThrow();
  const res = await safeFetch(endpoints.feedDelete(token, postId), {
    method: "DELETE",
  });
  if (!res.ok)
    throw new Error(
      await res.text().catch(() => "No se pudo eliminar la publicación")
    );
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

export async function fetchComments(
  postId: number
): Promise<CommentNode[]> {
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
    body: JSON.stringify({ post_id: postId, ...payload }),
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

export async function createCommentWithGif(
  postId: number,
  gifUrl: string
) {
  return createComment(postId, { gift: gifUrl });
}

export async function replyWithGif(
  commentId: number,
  gifUrl: string
) {
  return replyComment(commentId, { gift: gifUrl });
}

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

/* ------------------------------- GIFS EXTRA ------------------------------ */

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

  return (
    results
      .map((r: any) => {
        if (r && typeof r.url === "string" && !r.media_formats) {
          return {
            id: String(r.id ?? r.url),
            title: r.title || "",
            url: toAbsolute(r.url) || r.url,
            width: r.width,
            height: r.height,
          } as GifItem;
        }

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
      .filter(Boolean) as GifItem[]
  );
}

export async function fetchTrendingGifs(
  limit = 16
): Promise<GifItem[]> {
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
