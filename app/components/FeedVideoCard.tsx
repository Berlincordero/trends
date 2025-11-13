import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from "react-native";
import {
  Video,
  ResizeMode,
  AVPlaybackStatus,
  // El tipo puede no existir en todas las versiones; si te marca error, cámbialo por `any`
  VideoReadyForDisplayEvent,
} from "expo-av";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BASE, fetchCommentsStats, toggleFeedStar } from "../../lib/api";
import CommentsSheet from "./CommentsSheet";
import PostStarsSheet from "./PostStarsSheet";

const JADE = "#6FD9C5";
const BG = "#000";

// Layout
const AVATAR_SIZE = 56;
const GUTTER = 12;
const BETWEEN = 6;

// Barra
const BAR_H = 8;

// offsets
const RIGHT_CLEAR = 0;
const LEFT_CLEAR = AVATAR_SIZE + 10;
const PILL_OFFSET_ABOVE_BAR = 36;
const ICONS_GAP_BELOW = 52;

// registro global simple
let CURRENT_VIDEO: { id: number | null; ref: Video | null } = { id: null, ref: null };

// botón lateral
const TG_SIZE = 28;
const TG_ICON_SIZE = 18;
const TG_BG = "rgba(255,255,255,0.18)";
const TG_BORDER = "rgba(255,255,255,0.25)";
const TG_ICON_COLOR = "#fff";
const TG_OFFSET_DOWN = 6;
const TG_NUDGE_Y = -10;

function normalizeCommentStats(raw: any) {
  const commentsExplicit = raw?.total_count ?? raw?.comments_count ?? raw?.comments ?? 0;
  const repliesExplicit = raw?.replies_count ?? raw?.replies ?? 0;
  const total =
    typeof raw?.total_count === "number"
      ? raw.total_count
      : (Number(commentsExplicit) || 0) + (Number(repliesExplicit) || 0);
  const stars = raw?.stars_count ?? raw?.stars ?? 0;
  return {
    comments_count: Number(commentsExplicit) || 0,
    replies_count: Number(repliesExplicit) || 0,
    total_count: Number(total) || 0,
    stars_count: Number(stars) || 0,
  };
}

export type FeedItem = {
  id: number;
  media: string;
  caption?: string | null;
  views_count: number;
  author: { id: number; username: string; avatar?: string | null };
  stars_count: number;
  starred: boolean;
};

type Nat = { w: number; h: number; orientation: "portrait" | "landscape" | "unknown" };

export default function FeedVideoCard({
  item,
  autoplay,
  onFirstPlay,
}: {
  item: FeedItem;
  autoplay?: boolean;
  onFirstPlay?: (id: number) => void;
}) {
  const videoRef = useRef<Video>(null);

  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [immersive, setImmersive] = useState(false);
  const [counted, setCounted] = useState(false);
  const [pausedByTap, setPausedByTap] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const [starsOpen, setStarsOpen] = useState(false);
  const [commentStats, setCommentStats] = useState({
    comments_count: 0,
    replies_count: 0,
    total_count: 0,
    stars_count: 0,
  });

  const [postStarsCount, setPostStarsCount] = useState<number>(
    typeof item.stars_count === "number" ? item.stars_count : 0
  );
  const [postStarred, setPostStarred] = useState<boolean>(!!item.starred);

  // ======= SCRUB =======
  const barWidthRef = useRef(1);
  const wasPlayingRef = useRef(false);
  const onBarLayout = useCallback((e: LayoutChangeEvent) => {
    barWidthRef.current = Math.max(1, e.nativeEvent.layout.width);
  }, []);
  // ======================

  // ======= PERISCOPE =======
  const [container, setContainer] = useState({ w: 0, h: 0 });
  const [nat, setNat] = useState<Nat | null>(null);

  const devicePortrait = container.h >= container.w && container.h > 0 && container.w > 0;
  const videoLandscape = nat ? nat.orientation === "landscape" || nat.w > nat.h : true;
  const periscope = devicePortrait && videoLandscape;

  // 👈 TIPADO CORRECTO: StyleProp<ViewStyle>
  const videoStyle: StyleProp<ViewStyle> = periscope
    ? ( {
        position: "absolute",
        width: container.h || "100%",
        height: container.w || "100%",
        left: (container.w - container.h) / 2 || 0,
        top: (container.h - container.w) / 2 || 0,
        transform: [{ rotate: "90deg" }],
      } as ViewStyle )
    : StyleSheet.absoluteFillObject;
  // ==========================

  const refreshCommentStats = useCallback(async () => {
    try {
      const raw = await fetchCommentsStats(item.id);
      setCommentStats(normalizeCommentStats(raw));
    } catch {
      setCommentStats({ comments_count: 0, replies_count: 0, total_count: 0, stars_count: 0 });
    }
  }, [item.id]);

  const isPlaying = !!(status && "isLoaded" in status && (status as any).isLoaded && (status as any).isPlaying);
  const durationMs = (status && "isLoaded" in status && (status as any).isLoaded && (status as any).durationMillis) || 0;
  const positionMs = (status && "isLoaded" in status && (status as any).isLoaded && (status as any).positionMillis) || 0;

  const pct = durationMs > 0 ? positionMs / durationMs : 0;

  const fmtTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(1, "0")}:${String(ss).padStart(2, "0")}`;
  };

  // autoplay / exclusión
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    (async () => {
      try {
        if (autoplay) {
          if (CURRENT_VIDEO.ref && CURRENT_VIDEO.id !== item.id) {
            await CURRENT_VIDEO.ref.pauseAsync().catch(() => {});
          }
          CURRENT_VIDEO = { id: item.id, ref: v };
          await v.playAsync().catch(() => {});
          setPausedByTap(false);
        } else {
          await v.pauseAsync().catch(() => {});
        }
      } catch {}
    })();
  }, [autoplay, item.id, reloadKey]);

  // contar vista
  useEffect(() => {
    if (autoplay && !counted && positionMs > 500) {
      setCounted(true);
      onFirstPlay?.(item.id);
    }
  }, [autoplay, counted, positionMs, item?.id, onFirstPlay]);

  // cleanup
  useEffect(() => {
    return () => {
      (async () => {
        try {
          await videoRef.current?.pauseAsync();
          await videoRef.current?.unloadAsync();
          if (CURRENT_VIDEO.id === item.id) CURRENT_VIDEO = { id: null, ref: null };
        } catch {}
      })();
    };
  }, [item.id]);

  useEffect(() => {
    refreshCommentStats();
  }, [refreshCommentStats]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    (async () => {
      try {
        if (commentsOpen) {
          await v.pauseAsync().catch(() => {});
          setPausedByTap(true);
        } else {
          await refreshCommentStats();
          if (autoplay) {
            if (CURRENT_VIDEO.ref && CURRENT_VIDEO.id !== item.id) {
              await CURRENT_VIDEO.ref.pauseAsync().catch(() => {});
            }
            CURRENT_VIDEO = { id: item.id, ref: v };
            await v.playAsync().catch(() => {});
            setPausedByTap(false);
          }
        }
      } catch {}
    })();
  }, [commentsOpen, autoplay, item.id, refreshCommentStats]);

  const toggleImmersive = () => setImmersive((v) => !v);

  const togglePlayPause = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (isPlaying) {
        await v.pauseAsync();
        setPausedByTap(true);
      } else {
        if (CURRENT_VIDEO.ref && CURRENT_VIDEO.id !== item.id) {
          await CURRENT_VIDEO.ref.pauseAsync().catch(() => {});
        }
        CURRENT_VIDEO = { id: item.id, ref: v };
        await v.playAsync();
        setPausedByTap(false);
      }
    } catch {}
  }, [isPlaying, item.id]);

  const baseUri = item.media.startsWith("http") ? item.media : `${BASE}${item.media}`;
  const src = { uri: `${baseUri}${baseUri.includes("?") ? "&" : "?"}r=${reloadKey}` };

  const avatarUri = item.author.avatar
    ? item.author.avatar.startsWith("http")
      ? item.author.avatar
      : `${BASE}/media/${item.author.avatar.replace(/^\/+/, "")}`
    : undefined;

  const PROGRESS_BOTTOM = GUTTER + AVATAR_SIZE + BETWEEN;
  const remainingMs = Math.max(durationMs - positionMs, 0);

  const handleError = useCallback(
    (e: any) => {
      console.warn("FEED_VIDEO_ERROR", { src, error: e?.nativeEvent?.error ?? e });
      setTimeout(() => setReloadKey((k) => k + 1), 250);
    },
    [src]
  );

  const displayedCommentsCount = commentStats.total_count || commentStats.comments_count || 0;

  const handleTogglePostStar = useCallback(async () => {
    try {
      const res = await toggleFeedStar(item.id);
      setPostStarred(res.starred);
      setPostStarsCount(res.stars_count);
    } catch {}
  }, [item.id]);

  // ======= SCRUB HANDLERS =======
  const seekToPct = useCallback(
    async (p: number) => {
      if (!durationMs) return;
      const v = videoRef.current;
      if (!v) return;
      const clamped = Math.max(0, Math.min(1, p));
      const target = Math.floor(durationMs * clamped);
      try {
        await v.setPositionAsync(target);
      } catch {}
    },
    [durationMs]
  );

  const onScrubGrant = useCallback(
    async (x: number) => {
      wasPlayingRef.current = !!isPlaying;
      try {
        await videoRef.current?.pauseAsync();
      } catch {}
      const w = Math.max(1, barWidthRef.current);
      await seekToPct(x / w);
    },
    [isPlaying, seekToPct]
  );

  const onScrubMove = useCallback(
    async (x: number) => {
      const w = Math.max(1, barWidthRef.current);
      await seekToPct(x / w);
    },
    [seekToPct]
  );

  const onScrubRelease = useCallback(async () => {
    if (wasPlayingRef.current) {
      try {
        if (CURRENT_VIDEO.ref && CURRENT_VIDEO.id !== item.id) {
          await CURRENT_VIDEO.ref.pauseAsync().catch(() => {});
        }
        CURRENT_VIDEO = { id: item.id, ref: videoRef.current };
        await videoRef.current?.playAsync();
        setPausedByTap(false);
      } catch {}
    }
  }, [item.id]);
  // ===============================

  return (
    <View
      style={styles.fill}
      onLayout={(e) =>
        setContainer({
          w: Math.max(1, Math.floor(e.nativeEvent.layout.width)),
          h: Math.max(1, Math.floor(e.nativeEvent.layout.height)),
        })
      }
    >
      <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={togglePlayPause}>
        <Video
          key={reloadKey}
          ref={videoRef}
          source={src}
          style={videoStyle}  // ✅ tipado correcto
          resizeMode={ResizeMode.COVER}
          shouldPlay={!!autoplay}
          isLooping
          onPlaybackStatusUpdate={(s: AVPlaybackStatus) => {
            setStatus(s);
            if ("isLoaded" in s && (s as any).isLoaded) {
              const ns = (s as any).naturalSize as
                | { width: number; height: number; orientation?: "portrait" | "landscape" }
                | undefined;
              if (ns && typeof ns.width === "number" && typeof ns.height === "number") {
                const ori = ns.orientation || (ns.width >= ns.height ? "landscape" : "portrait");
                setNat({ w: ns.width, h: ns.height, orientation: ori as any });
              }
            }
          }}
          onReadyForDisplay={(e: VideoReadyForDisplayEvent | any) => {
            const ns = e?.naturalSize || e?.nativeEvent?.naturalSize;
            if (ns && typeof ns.width === "number" && typeof ns.height === "number") {
              const ori = ns.orientation || (ns.width >= ns.height ? "landscape" : "portrait");
              setNat({ w: ns.width, h: ns.height, orientation: ori });
            }
          }}
          progressUpdateIntervalMillis={250}
          onError={handleError}
        />

        {(!isPlaying || pausedByTap) && (
          <View style={styles.centerPlay}>
            <MaterialCommunityIcons name="play-circle-outline" size={74} color="#ffffffcc" />
          </View>
        )}
      </TouchableOpacity>

      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {/* tiempos */}
        <View
          style={{
            position: "absolute",
            left: GUTTER + LEFT_CLEAR,
            right: GUTTER + RIGHT_CLEAR,
            bottom: PROGRESS_BOTTOM + BAR_H + 6,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={styles.timeLabel}>{fmtTime(positionMs)}</Text>
          <Text style={styles.timeLabel}>{durationMs ? `-${fmtTime(remainingMs)}` : "--:--"}</Text>
        </View>

        {/* barra interactiva */}
        <View
          style={{
            position: "absolute",
            left: GUTTER + LEFT_CLEAR,
            right: GUTTER + RIGHT_CLEAR,
            bottom: PROGRESS_BOTTOM,
            height: BAR_H,
            borderRadius: BAR_H / 2,
            backgroundColor: "rgba(255,255,255,0.25)",
            overflow: "hidden",
          }}
          onLayout={onBarLayout}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => onScrubGrant(e.nativeEvent.locationX || 0)}
          onResponderMove={(e) => onScrubMove(e.nativeEvent.locationX || 0)}
          onResponderRelease={onScrubRelease}
        >
          <View
            style={{
              height: "100%",
              width: `${Math.max(0, Math.min(1, pct)) * 100}%`,
              backgroundColor: JADE,
            }}
          />
        </View>

        {/* fullscreen pill */}
        <View
          style={{
            position: "absolute",
            right: GUTTER,
            bottom: PROGRESS_BOTTOM + BAR_H + PILL_OFFSET_ABOVE_BAR,
          }}
        >
          <TouchableOpacity style={styles.pillSm} onPress={() => setImmersive((v) => !v)} activeOpacity={0.9}>
            <MaterialCommunityIcons name={immersive ? "fullscreen-exit" : "fullscreen"} size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* fila de iconos */}
        <View
          style={{
            position: "absolute",
            right: GUTTER,
            bottom: PROGRESS_BOTTOM - (BAR_H + ICONS_GAP_BELOW),
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 18,
          }}
        >
          {/* ⭐ post stars */}
          <View style={styles.iconCol}>
            <TouchableOpacity activeOpacity={0.9} onPress={handleTogglePostStar} style={{ alignItems: "center" }}>
              <MaterialCommunityIcons name={postStarred ? "star" : "star-outline"} size={22} color={postStarred ? JADE : "#fff"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStarsOpen(true)} style={styles.countPill} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.countText}>{postStarsCount}</Text>
            </TouchableOpacity>
          </View>

          {/* 💬 comments */}
          <TouchableOpacity style={styles.iconCol} activeOpacity={0.9} onPress={() => setCommentsOpen(true)}>
            <MaterialCommunityIcons name="comment-outline" size={22} color="#fff" />
            <View style={styles.countPill}>
              <Text style={styles.countText}>{displayedCommentsCount}</Text>
            </View>
          </TouchableOpacity>

          {/* share (placeholder) */}
          <View style={styles.iconCol}>
            <MaterialCommunityIcons name="share-variant" size={22} color="#fff" />
            <View style={styles.countPill}>
              <Text style={styles.countText}>0</Text>
            </View>
          </View>
        </View>

        {/* avatar + textos */}
        <View style={{ position: "absolute", left: GUTTER, bottom: GUTTER, maxWidth: "72%" }}>
          <View style={styles.bubble}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <Image source={require("../../assets/images/avatar_neutral.png")} style={styles.avatar} />
            )}
          </View>

          <View style={styles.sideBtnWrap}>
            <TouchableOpacity style={styles.sideBtn} activeOpacity={0.9}>
              <MaterialCommunityIcons name="send-circle-outline" size={TG_ICON_SIZE} color={TG_ICON_COLOR} />
            </TouchableOpacity>
          </View>

          <Text style={styles.caption} numberOfLines={2}>
            {item.caption || "Publicación"}
          </Text>

          <View style={styles.viewsRow}>
            <Text style={styles.views}>{`${item.views_count} vistas`}</Text>
            <MaterialCommunityIcons name="account-plus" size={16} color="#fff" style={{ opacity: 0.9 }} />
          </View>
        </View>
      </View>

      {/* modales */}
      <CommentsSheet visible={commentsOpen} onClose={() => setCommentsOpen(false)} postId={item.id} accentColor={JADE} />
      <PostStarsSheet visible={starsOpen} onClose={() => setStarsOpen(false)} postId={item.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: BG },
  centerPlay: {
    position: "absolute",
    left: 0, right: 0, top: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatar: {
    width: AVATAR_SIZE - 8,
    height: AVATAR_SIZE - 8,
    borderRadius: (AVATAR_SIZE - 8) / 2,
  },
  iconCol: { alignItems: "center", gap: 4 },
  countPill: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    minWidth: 30,
    height: 22,
    borderRadius: 999,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  caption: { color: "#fff", fontWeight: "800", marginTop: 2, textAlign: "left" },
  viewsRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  views: { color: "#fff", opacity: 0.9, textAlign: "left" },
  sideBtnWrap: {
    position: "absolute",
    left: AVATAR_SIZE - (TG_SIZE - 6),
    top: AVATAR_SIZE - TG_SIZE / 2 + TG_OFFSET_DOWN + TG_NUDGE_Y,
  },
  sideBtn: {
    width: TG_SIZE,
    height: TG_SIZE,
    borderRadius: TG_SIZE / 2,
    backgroundColor: TG_BG,
    borderWidth: 1,
    borderColor: TG_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  pillSm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 26,
    borderRadius: 14,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  timeLabel: { color: "#fff", fontSize: 11, fontWeight: "700", opacity: 0.95 },
});
