// app/vibesplayer.tsx
import React, { useMemo, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  StatusBar,
  Share,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Audio, Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

import {
  isLikelyImageUrl,
  getClipMusic,
  listUserClips,
  deleteClip,
  toAbsolute,
  getMe,
  BASE,
  fetchClipViewers,
  trackClipView,
  toggleClipStar,
  type Clip,
  type ClipViewerUser,
} from "../lib/api";
import { MUSIC_TRACKS, type MusicTrack } from "./music";

const BG = "#000";

/**
 * Normaliza avatar:
 * - http(s)://...
 * - "avatars/xxx.jpg"
 * - "/media/avatars/xxx.jpg"
 */
function resolveAvatarUri(raw?: string | null): string | null {
  if (!raw) return null;
  const v = raw.trim();
  if (!v) return null;

  if (v.startsWith("http://") || v.startsWith("https://")) return v;

  let p = v.replace(/^\/+/, ""); // quita "/" inicial

  if (p.startsWith("media/")) {
    // ya viene con "media/..."
    return `${BASE}/${p}`;
  }

  // solo subruta dentro de /media
  return `${BASE}/media/${p}`;
}

export default function VibesPlayerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const params = useLocalSearchParams<{
    media?: string;
    clipId?: string;
    userId?: string;
  }>();

  // media pasada por params (modo antiguo / fallback)
  const mediaParam = useMemo(() => {
    if (!params?.media) return "";
    if (Array.isArray(params.media)) return params.media[0] ?? "";
    return String(params.media);
  }, [params]);

  const clipIdParam = useMemo(() => {
    const raw = params?.clipId;
    const s = Array.isArray(raw) ? raw[0] : raw;
    const n = s ? Number(s) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [params]);

  const userIdParam = useMemo(() => {
    const raw = params?.userId;
    const s = Array.isArray(raw) ? raw[0] : raw;
    const n = s ? Number(s) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [params]);

  // lista de clips del autor (carrusel)
  const [clips, setClips] = useState<Clip[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const currentClip: Clip | null =
    clips.length > 0 && currentIndex >= 0 && currentIndex < clips.length
      ? clips[currentIndex]
      : null;

  // usuario logeado, para saber si es autor
  const [meId, setMeId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (!cancelled) setMeId(me?.id ?? null);
      } catch {
        // si falla, simplemente no mostramos eliminar ni viewers
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // considerar también userIdParam
  const isAuthor =
    !!meId &&
    ((currentClip?.author?.id != null && currentClip.author.id === meId) ||
      (userIdParam != null && userIdParam === meId));

  // Carga de clips del usuario (carrusel). Si no hay userId, cae a 1 solo clip.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);

        if (userIdParam != null) {
          // modo carrusel: todas las vibes del autor
          const all = await listUserClips(userIdParam, 32, 0);
          if (!mounted) return;

          if (all && all.length > 0) {
            setClips(all);

            if (clipIdParam != null) {
              const idx = all.findIndex((c) => c.id === clipIdParam);
              setCurrentIndex(idx >= 0 ? idx : 0);
            } else {
              setCurrentIndex(0);
            }
            return;
          }
        }

        // fallback: un solo clip con los datos que vienen por params
        if (clipIdParam != null && mediaParam) {
          const single: Clip = {
            id: clipIdParam,
            media: mediaParam,
            created_at: "",
          } as any;

          if (!mounted) return;
          setClips([single]);
          setCurrentIndex(0);
        }
      } catch (e) {
        console.warn("Error cargando clips del usuario", e);
        // si algo falla, intentamos al menos mostrar el clip pasado por params
        if (clipIdParam != null && mediaParam && mounted) {
          const single: Clip = {
            id: clipIdParam,
            media: mediaParam,
            created_at: "",
          } as any;
          setClips([single]);
          setCurrentIndex(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userIdParam, clipIdParam, mediaParam]);

  // media actual ya absoluta
  const effectiveMediaUri = useMemo(() => {
    if (currentClip?.media) {
      const abs = toAbsolute(currentClip.media);
      return abs ?? currentClip.media;
    }
    return mediaParam;
  }, [currentClip, mediaParam]);

  const currentClipId = currentClip?.id ?? clipIdParam ?? null;
  const isImage = isLikelyImageUrl(effectiveMediaUri);

  // Música asociada al clip actual
  const [musicTrack, setMusicTrack] = useState<MusicTrack | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMusic() {
      if (currentClipId == null) return;

      // limpia anterior
      setMusicTrack(null);
      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch {}
        soundRef.current = null;
      }

      try {
        const trackId = await getClipMusic(currentClipId);
        if (!trackId || cancelled) return;

        const track = MUSIC_TRACKS.find((t) => t.id === trackId) ?? null;
        if (!track || cancelled) return;

        setMusicTrack(track);
        const { sound } = await Audio.Sound.createAsync(track.file, {
          shouldPlay: true,
          isLooping: true,
        });

        if (cancelled) {
          await sound.unloadAsync().catch(() => {});
          return;
        }
        soundRef.current = sound;
      } catch (e) {
        console.warn("Error cargando música del clip", e);
      }
    }

    if (currentClipId != null) {
      loadMusic();
    }

    return () => {
      cancelled = true;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [currentClipId]);

  // --------- Estrellita del clip (estado local) ---------
  const [starsCount, setStarsCount] = useState<number | null>(null);
  const [starred, setStarred] = useState(false);
  const [togglingStar, setTogglingStar] = useState(false);

  // Inicializar la estrella cuando cambia de clip
  useEffect(() => {
    if (!currentClip) {
      setStarsCount(null);
      setStarred(false);
      return;
    }

    const initialCount = (currentClip as any).stars_count;
    const initialStarred = (currentClip as any).starred;

    setStarsCount(
      typeof initialCount === "number" && !Number.isNaN(initialCount)
        ? initialCount
        : 0
    );
    setStarred(!!initialStarred);
  }, [currentClipId, currentClip]);

  const handleToggleStar = async () => {
    if (!currentClipId || togglingStar) return;
    try {
      setTogglingStar(true);
      const res = await toggleClipStar(currentClipId);
      setStarsCount(res.stars_count ?? 0);
      setStarred(!!res.starred);
    } catch (e) {
      console.warn("Error al marcar estrella del clip", e);
      Alert.alert("Error", "No se pudo reaccionar con estrellita.");
    } finally {
      setTogglingStar(false);
    }
  };

  // --------- Track de vistas + carga de viewers (solo autor) ---------

  const [viewers, setViewers] = useState<ClipViewerUser[]>([]);
  const [viewersTotal, setViewersTotal] = useState<number | null>(null);
  const [viewersLoading, setViewersLoading] = useState(false);
  const [viewersModalVisible, setViewersModalVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!currentClipId) return;

      // todos los usuarios registran vista (solo cuenta 1 vez)
      try {
        await trackClipView(currentClipId);
      } catch (e) {
        console.warn("Error registrando vista de clip", e);
      }

      // si NO es el autor, no cargamos la lista de viewers
      if (!isAuthor) return;

      setViewersLoading(true);
      try {
        const res = await fetchClipViewers(currentClipId, 50, 0);
        if (cancelled) return;

        setViewers(res.viewers ?? []);
        setViewersTotal(
          typeof res.total === "number"
            ? res.total
            : res.viewers?.length ?? 0
        );
      } catch (e) {
        console.warn("Error cargando viewers de clip", e);
        if (!cancelled) {
          setViewers([]);
          setViewersTotal(0);
        }
      } finally {
        if (!cancelled) setViewersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentClipId, isAuthor]);

  // Navegación izquierda / derecha
  const handleNext = () => {
    if (!clips.length) return;

    if (currentIndex < clips.length - 1) {
      setCurrentIndex((prev) => Math.min(prev + 1, clips.length - 1));
    } else {
      // última historia -> cerramos
      router.back();
    }
  };

  const handlePrev = () => {
    if (!clips.length) return;

    if (currentIndex > 0) {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    } else {
      // en la primera -> cerramos
      router.back();
    }
  };

  // Menú lápiz
  const [menuVisible, setMenuVisible] = useState(false);

  const handleDeleteCurrent = () => {
    if (!currentClipId) return;

    Alert.alert(
      "Eliminar vibra",
      "¿Seguro que deseas eliminar esta vibra?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteClip(currentClipId);
              setMenuVisible(false);

              setClips((prev) => {
                const next = prev.filter((c) => c.id !== currentClipId);
                if (!next.length) {
                  router.back();
                  return [];
                }
                // ajusta índice si hace falta
                setCurrentIndex((idx) =>
                  idx >= next.length ? next.length - 1 : idx
                );
                return next;
              });
            } catch (e) {
              console.warn("Error eliminando clip", e);
              Alert.alert(
                "Error",
                "No se pudo eliminar la vibra. Inténtalo de nuevo."
              );
            }
          },
        },
      ]
    );
  };

  const handleShareCurrent = async () => {
    if (!effectiveMediaUri) return;

    try {
      await Share.share({
        message: effectiveMediaUri,
      });
    } catch (e) {
      console.warn("Error al compartir clip", e);
    }
  };

  // --------- Datos del autor actual (para mostrar en header) ----------
  const currentAuthor = currentClip?.author ?? null;
  const authorAvatarUri = currentAuthor?.avatar
    ? resolveAvatarUri(currentAuthor.avatar)
    : null;
  const authorName = currentAuthor?.username ?? "Usuario";

  const handleOpenViewers = () => {
    if (!isAuthor || (viewersTotal ?? 0) === 0) return;
    setMenuVisible(false);
    setViewersModalVisible(true);
  };

  return (
    <View style={styles.fill}>
      <StatusBar hidden />

      {/* Media principal */}
      {!effectiveMediaUri ? (
        <View style={styles.center}>
          <Text style={{ color: "#fff" }}>
            {loading ? "Cargando vibra..." : "No se encontró el clip."}
          </Text>
        </View>
      ) : isImage ? (
        <Image
          key={currentClipId ?? effectiveMediaUri}
          source={{ uri: effectiveMediaUri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : (
        <Video
          key={currentClipId ?? effectiveMediaUri}
          source={{ uri: effectiveMediaUri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping
          // si hay música asociada, silenciamos el audio del video (como IG)
          isMuted={!!musicTrack}
          useNativeControls={false}
        />
      )}

      {/* Zonas táctiles para avanzar/retroceder historias */}
      {clips.length > 0 && (
        <View style={styles.tapRow} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.tapSide}
            activeOpacity={0.8}
            onPress={handlePrev}
          />
          <TouchableOpacity
            style={styles.tapSide}
            activeOpacity={0.8}
            onPress={handleNext}
          />
        </View>
      )}

      {/* Header: botón cerrar + avatar+nombre centrado + barras de progreso + lápiz */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
          },
        ]}
      >
        {/* Botón cerrar a la izquierda */}
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Centro: barras + avatar+nombre centrados */}
        <View style={styles.headerCenter}>
          {clips.length > 1 && (
            <View style={styles.progressRow}>
              {clips.map((c, idx) => (
                <View
                  key={c.id}
                  style={[
                    styles.progressDot,
                    idx <= currentIndex && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {currentAuthor && (
            <View style={styles.headerAuthorInfo}>
              {authorAvatarUri ? (
                <Image
                  source={{ uri: authorAvatarUri }}
                  style={styles.headerAuthorAvatar}
                />
              ) : (
                <Image
                  source={require("../assets/images/avatar_neutral.png")}
                  style={styles.headerAuthorAvatar}
                />
              )}

              {/* Badge con sombreado obscuro detrás del nombre */}
              <View style={styles.headerAuthorNameBadge}>
                <Text style={styles.headerAuthorName} numberOfLines={1}>
                  {authorName}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Botón lápiz a la derecha */}
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Preview de viewers (solo autor) */}
      {isAuthor && currentClipId != null && viewersTotal !== null && (
        <View
          style={[
            styles.viewersPreviewRow,
            {
              // 👇 sube/baja la burbuja de vistas (a mayor número, más arriba)
              bottom: insets.bottom + 72,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.viewersPreviewInner}
            activeOpacity={0.9}
            onPress={handleOpenViewers}
            disabled={(viewersTotal ?? 0) === 0}
          >
            <View style={styles.viewersAvatarsStack}>
              {(viewers ?? []).slice(0, 3).map((u, idx) => {
                const avatarUri = u.avatar
                  ? resolveAvatarUri(u.avatar)
                  : null;
                return avatarUri ? (
                  <Image
                    key={u.id}
                    source={{ uri: avatarUri }}
                    style={[
                      styles.viewersAvatarMini,
                      idx > 0 && { marginLeft: -8 },
                    ]}
                  />
                ) : (
                  <Image
                    key={u.id}
                    source={require("../assets/images/avatar_neutral.png")}
                    style={[
                      styles.viewersAvatarMini,
                      idx > 0 && { marginLeft: -8 },
                    ]}
                  />
                );
              })}

              {viewers.length === 0 && (
                <Ionicons name="eye-outline" size={18} color="#fff" />
              )}
            </View>

            <Text style={styles.viewersText}>
              {viewersLoading
                ? "Cargando vistas..."
                : (viewersTotal ?? 0) === 0
                ? "Aún no hay vistas"
                : (viewersTotal ?? 0) === 1
                ? "1 vista"
                : `${viewersTotal} vistas`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bloque de estrellita: esquina inferior derecha, sobre las canciones */}
      {currentClipId != null && (
        <View
          style={[
            styles.starReactionWrap,
            { bottom: (insets.bottom || 0) + (musicTrack ? 88 : 68) },
          ]}
        >
          <Text style={styles.starLabel} numberOfLines={2}>
            Dale una estrellita{"\n"}a este vibe
          </Text>

          <TouchableOpacity
            style={[
              styles.starButton,
              starred && styles.starButtonActive,
              togglingStar && { opacity: 0.7 },
            ]}
            activeOpacity={0.85}
            onPress={handleToggleStar}
            disabled={togglingStar}
          >
            <Ionicons
              name={starred ? "star" : "star-outline"}
              size={20}
              color={starred ? "#000" : "#fff"}
            />
          </TouchableOpacity>

          <Text style={styles.starCount}>
            {starsCount ?? 0}
          </Text>
        </View>
      )}

      {/* Zona inferior: SOLO nombre de la canción */}
      <View
        style={[
          styles.bottomHint,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        {musicTrack && (
          <View style={styles.bottomSongRow}>
            <Ionicons
              name="musical-notes"
              size={14}
              color="#fff"
              // 👇 más separación entre ícono y texto
              style={{ marginRight: 18 }}
            />
            <Text style={styles.songTitleBottom} numberOfLines={1}>
              {musicTrack.title}
            </Text>
          </View>
        )}
      </View>

      {/* Modal menú (lápiz abre esto) */}
      {menuVisible && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <View
            style={[
              styles.menuCard,
              { paddingBottom: insets.bottom + 18 },
            ]}
          >
            <View style={styles.menuHandle} />

            {isAuthor && (
              <TouchableOpacity
                style={styles.menuItemDelete}
                onPress={handleDeleteCurrent}
              >
                <Text style={styles.menuItemDeleteText}>Eliminar vibra</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleShareCurrent}
            >
              <Text style={styles.menuItemText}>Compartir</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal lista de viewers */}
      {viewersModalVisible && (
        <View style={styles.viewersOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setViewersModalVisible(false)}
          />
          <View
            style={[
              styles.viewersCard,
              { paddingBottom: insets.bottom + 18 },
            ]}
          >
            <View style={styles.menuHandle} />

            <Text style={styles.viewersTitle}>Vieron tu vibra</Text>
            <Text style={styles.viewersSubtitle}>
              {(viewersTotal ?? 0) === 1
                ? "1 persona"
                : `${viewersTotal ?? 0} personas en total`}
            </Text>

            {viewersLoading ? (
              <Text style={styles.viewersEmptyText}>Cargando...</Text>
            ) : viewers.length === 0 ? (
              <Text style={styles.viewersEmptyText}>
                Aún nadie ha visto esta vibra.
              </Text>
            ) : (
              <ScrollView
                style={styles.viewersList}
                showsVerticalScrollIndicator={false}
              >
                {viewers.map((u) => {
                  const avatarUri = u.avatar
                    ? resolveAvatarUri(u.avatar)
                    : null;
                  return (
                    <View key={u.id} style={styles.viewersItemRow}>
                      {avatarUri ? (
                        <Image
                          source={{ uri: avatarUri }}
                          style={styles.viewersItemAvatar}
                        />
                      ) : (
                        <Image
                          source={require("../assets/images/avatar_neutral.png")}
                          style={styles.viewersItemAvatar}
                        />
                      )}
                      <Text style={styles.viewersItemName}>{u.username}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: BG,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    zIndex: 20,
  },
  headerLeft: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  circleBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  // avatar + nombre centrados, avatar arriba, nombre abajo
  headerAuthorInfo: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  headerAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  // Badge con sombreado obscuro detrás del nombre
  headerAuthorNameBadge: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.65)",
    maxWidth: "80%",
  },
  headerAuthorName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 16,
  },
  progressDot: {
    flex: 1,
    height: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  progressDotActive: {
    backgroundColor: "#fff",
  },

  tapRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 5,
  },
  tapSide: {
    flex: 1,
  },

  // fila de preview de viewers
  viewersPreviewRow: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 22,
  },
  viewersPreviewInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  viewersAvatarsStack: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  viewersAvatarMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#000",
  },
  viewersText: {
    color: "#fff",
    fontSize: 12,
  },

  // bloque de estrellita
  starReactionWrap: {
    position: "absolute",
    right: 16,
    alignItems: "center",
    zIndex: 23,
  },
  starLabel: {
    color: "#fff",
    fontSize: 11,
    textAlign: "center",
    marginBottom: 4,
    // 👇 sombreado al texto de la estrella
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  starButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#fff",
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  starButtonActive: {
    backgroundColor: "#FFD700",
    borderColor: "#FFD700",
  },
  starCount: {
    marginTop: 2,
    color: "#fff",
    fontSize: 11,
  },

  // zona inferior (canción)
  bottomHint: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  bottomSongRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18, // más aire lateral
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.6)",
    marginBottom: 6,
    maxWidth: "90%",
  },
  songTitleBottom: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 12,
    flexShrink: 1,
  },

  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 40,
  },
  menuCard: {
    backgroundColor: "#111",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  menuHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 8,
  },
  menuItem: {
    paddingVertical: 14,
  },
  menuItemText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  menuItemDelete: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.18)",
  },
  menuItemDeleteText: {
    color: "#ff4d4f",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },

  // modal viewers
  viewersOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 45,
  },
  viewersCard: {
    backgroundColor: "#111",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  viewersTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },
  viewersSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  viewersEmptyText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    textAlign: "center",
    marginVertical: 18,
  },
  viewersList: {
    maxHeight: 320,
  },
  viewersItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  viewersItemAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
  },
  viewersItemName: {
    color: "#fff",
    fontSize: 14,
  },
});
  