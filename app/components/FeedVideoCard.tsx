import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  LayoutChangeEvent,
  ScrollView,
  Platform,
} from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";

import {
  BASE,
  fetchCommentsStats,
  toggleFeedStar,
  FeedPost,
} from "../../lib/api";
import CommentsSheet from "./CommentsSheet";
import PostStarsSheet from "./PostStarsSheet";

const JADE = "#6FD9C5";
const BG = "#000";

const NEON_COLORS = ["#39FF14", "#FF6EC7", "#00FFFF", "#FFD700", "#FF00FF"];

const AVATAR_SIZE = 56;
const GUTTER = 12;
const BETWEEN = 6;

const BAR_H = 8;

const SIDE_MARGIN_PORTRAIT = 12;
const SIDE_MARGIN_LANDSCAPE = 28;
const ICONS_GAP_BELOW = 52;
const ICONS_ROW_MAX_WIDTH = 210;
const CAPTION_MAX_WIDTH = "68%";

const CAPTION_MODE: "fromBottom" | "ratio" = "fromBottom";
const CAPTION_Y_RATIO = 0.58;
const CAPTION_GAP_OVER_BAR = 90;

const CAPTION_FONT_SIZE = 12;
const CAPTION_LINE_HEIGHT = 20;
const CAPTION_VISIBLE_LINES = 3;
const MIDCAPTION_PAD_V = 6;

// 🔒 Regla global: solo 1 video reproduciéndose a la vez
let CURRENT_VIDEO: { id: number | null; ref: Video | null } = {
  id: null,
  ref: null,
};

// 👇 Export para poder pausar desde otras pantallas (feed.tsx)
export function pauseCurrentVideo() {
  if (!CURRENT_VIDEO.ref) return;
  (async () => {
    try {
      await CURRENT_VIDEO.ref?.pauseAsync();
    } catch {}
    CURRENT_VIDEO = { id: null, ref: null };
  })();
}

const TG_SIZE = 28;
const TG_ICON_SIZE = 18;
const TG_BG = "rgba(255,255,255,0.18)";
const TG_BORDER = "rgba(255,255,255,0.25)";
const TG_ICON_COLOR = "#fff";

function normalizeCommentStats(raw: any) {
  const commentsExplicit =
    raw?.total_count ?? raw?.comments_count ?? raw?.comments ?? 0;
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

function padForAndroidEmojiClip(s: string): string {
  if (Platform.OS !== "android") return s;
  const txt = String(s ?? "");
  const GLYPH_PAD = "\u200A";
  const WJ = "\u2060";
  const safe = `${GLYPH_PAD}${txt}${WJ}${GLYPH_PAD}`;
  return safe.length < 12 ? safe + GLYPH_PAD.repeat(2) : safe;
}

type Props = {
  item: FeedPost;
  autoplay?: boolean;
  onFirstPlay?: (id: number) => void;
  isLandscape?: boolean;
};

async function head(url: string) {
  try {
    await fetch(url, { method: "HEAD" });
  } catch {}
}

export async function prewarmNext(absoluteUrl: string) {
  if (!absoluteUrl) return;
  head(absoluteUrl);
}

export default function FeedVideoCard({
  item,
  autoplay,
  onFirstPlay,
  isLandscape = false,
}: Props) {
  const videoRef = useRef<Video>(null);
  const isFocused = useIsFocused();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [positionMs, setPositionMs] = useState(0);
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

  const [fourSixteen, setFourSixteen] = useState(false);

  const barWidthRef = useRef(1);
  const wasPlayingRef = useRef(false);
  const onBarLayout = useCallback((e: LayoutChangeEvent) => {
    barWidthRef.current = Math.max(1, e.nativeEvent.layout.width);
  }, []);

  const [cardH, setCardH] = useState(0);
  const midCaptionTop = Math.round(cardH * CAPTION_Y_RATIO);

  const lastOrientationChangeRef = useRef<number>(0);
  const wasPlayingBeforeRotateRef = useRef<boolean>(false);
  const wasPlayingBeforeFSRef = useRef<boolean>(false);

  const [hashColorIndex, setHashColorIndex] = useState(0);
  const hashColor = NEON_COLORS[hashColorIndex];

  useEffect(() => {
    const id = setInterval(
      () => setHashColorIndex((prev) => (prev + 1) % NEON_COLORS.length),
      10000
    );
    return () => clearInterval(id);
  }, []);

  // cambio de orientación
  useEffect(() => {
    lastOrientationChangeRef.current = Date.now();
    if (isLandscape) {
      setCommentsOpen(false);
      setStarsOpen(false);
      setFourSixteen(false);
    }
    const v = videoRef.current;
    if (!v) return;
    (async () => {
      try {
        if (isLandscape) {
          const st = await v.getStatusAsync();
          wasPlayingBeforeRotateRef.current = !!(st?.isLoaded && st?.isPlaying);
        } else {
          if (autoplay || wasPlayingBeforeRotateRef.current) {
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
  }, [isLandscape, autoplay, item.id]);

  const refreshCommentStats = useCallback(async () => {
    try {
      const raw = await fetchCommentsStats(item.id);
      setCommentStats(normalizeCommentStats(raw));
    } catch {
      setCommentStats({
        comments_count: 0,
        replies_count: 0,
        total_count: 0,
        stars_count: 0,
      });
    }
  }, [item.id]);

  const round500 = (n: number) => Math.floor(n / 500) * 500;

  const onStatus = useCallback(
    (s: AVPlaybackStatus) => {
      if (!("isLoaded" in s) || !s.isLoaded) {
        if (isLoaded) {
          setIsLoaded(false);
          setIsPlaying(false);
        }
        return;
      }
      setIsLoaded(true);
      if (isPlaying !== !!s.isPlaying) setIsPlaying(!!s.isPlaying);

      const d = s.durationMillis ?? 0;
      const p = s.positionMillis ?? 0;
      const rp = round500(p);

      setDurationMs((prev) => (prev !== d ? d : prev));
      setPositionMs((prev) => (prev !== rp ? rp : prev));
    },
    [isLoaded, isPlaying]
  );

  // autoplay + foco de pantalla
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    (async () => {
      try {
        if (!isFocused) {
          await v.pauseAsync().catch(() => {});
          if (CURRENT_VIDEO.id === item.id) {
            CURRENT_VIDEO = { id: null, ref: null };
          }
          return;
        }

        if (autoplay) {
          if (CURRENT_VIDEO.ref && CURRENT_VIDEO.id !== item.id) {
            await CURRENT_VIDEO.ref.pauseAsync().catch(() => {});
          }
          CURRENT_VIDEO = { id: item.id, ref: v };
          await v.playAsync().catch(() => {});
          setPausedByTap(false);
        } else {
          if (Date.now() - lastOrientationChangeRef.current < 800) return;
          await v.pauseAsync().catch(() => {});
        }
      } catch {}
    })();
  }, [autoplay, item.id, reloadKey, isFocused]);

  // contar view (primeros 500ms)
  useEffect(() => {
    if (autoplay && !counted && positionMs > 500) {
      setCounted(true);
      onFirstPlay?.(item.id);
    }
  }, [autoplay, counted, positionMs, item.id, onFirstPlay]);

  // cleanup
  useEffect(() => {
    return () => {
      (async () => {
        try {
          await videoRef.current?.pauseAsync();
          await videoRef.current?.unloadAsync();
          if (CURRENT_VIDEO.id === item.id) {
            CURRENT_VIDEO = { id: null, ref: null };
          }
        } catch {}
      })();
    };
  }, [item.id]);

  useEffect(() => {
    refreshCommentStats();
  }, [refreshCommentStats]);

  // abrir/cerrar comentarios pausa/reanuda
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
          if (autoplay && isFocused) {
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
  }, [commentsOpen, autoplay, item.id, refreshCommentStats, isFocused]);

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

  const baseUri = item.media.startsWith("http")
    ? item.media
    : `${BASE}${item.media}`;
  const src =
    reloadKey > 0 ? { uri: `${baseUri}?r=${reloadKey}` } : { uri: baseUri };

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

  const displayedCommentsCount =
    commentStats.total_count || commentStats.comments_count || 0;

  const handleTogglePostStar = useCallback(async () => {
    try {
      const res = await toggleFeedStar(item.id);
      setPostStarred(res.starred);
      setPostStarsCount(res.stars_count);
    } catch {}
  }, [item.id]);

  const handleToggleFourSixteen = useCallback(() => {
    if (isLandscape) return;
    setFourSixteen((prev) => !prev);
  }, [isLandscape]);

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

  const onFsUpdate = useCallback(
    async (ev: any) => {
      const code = ev?.nativeEvent?.fullscreenUpdate;
      try {
        if (code === 0) {
          const st = await videoRef.current?.getStatusAsync();
          wasPlayingBeforeFSRef.current = !!(st?.isLoaded && st?.isPlaying);
        } else if (code === 3) {
          const v = videoRef.current;
          if (!v) return;
          if ((autoplay || wasPlayingBeforeFSRef.current) && isFocused) {
            if (CURRENT_VIDEO.ref && CURRENT_VIDEO.id !== item.id) {
              await CURRENT_VIDEO.ref.pauseAsync().catch(() => {});
            }
            CURRENT_VIDEO = { id: item.id, ref: v };
            await v.playAsync().catch(() => {});
            setPausedByTap(false);
          }
        }
      } catch {}
    },
    [autoplay, item.id, isFocused]
  );

  const fmtTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(1, "0")}:${String(ss).padStart(2, "0")}`;
  };

  const pct = durationMs > 0 ? positionMs / durationMs : 0;

  const sideMargin = isLandscape ? SIDE_MARGIN_LANDSCAPE : SIDE_MARGIN_PORTRAIT;

  const progressLeft = sideMargin + AVATAR_SIZE + 10;
  const progressRight = sideMargin;
  const timesLeft = sideMargin + AVATAR_SIZE + 10;
  const timesRight = sideMargin;

  const showBarAndTimes = !isLandscape || !isPlaying || pausedByTap;

  const threeLineHeight =
    CAPTION_LINE_HEIGHT * CAPTION_VISIBLE_LINES + MIDCAPTION_PAD_V * 2;

  const nfcCaption = useMemo(() => {
    const raw = item.caption ?? "";
    try {
      return typeof raw.normalize === "function" ? raw.normalize("NFC") : raw;
    } catch {
      return raw;
    }
  }, [item.caption]);

  const safeCaption = useMemo(
    () => padForAndroidEmojiClip(nfcCaption),
    [nfcCaption]
  );

  const [captionLines, setCaptionLines] = useState(0);
  const needsScroll = captionLines > CAPTION_VISIBLE_LINES;
  const onCaptionTextLayout = useCallback(
    (e: any) => {
      const l = Array.isArray(e?.nativeEvent?.lines)
        ? e.nativeEvent.lines.length
        : 0;
      if (l !== captionLines) setCaptionLines(l);
    },
    [captionLines]
  );

  return (
    <View
      style={styles.fill}
      onLayout={(e) => setCardH(e.nativeEvent.layout.height)}
    >
      {/* Tap para play/pause */}
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        activeOpacity={1}
        onPress={togglePlayPause}
      >
        <View
          style={
            fourSixteen && !isLandscape
              ? styles.letterboxContainer
              : StyleSheet.absoluteFillObject
          }
        >
          <Video
            key={reloadKey}
            ref={videoRef}
            source={src}
            style={
              fourSixteen && !isLandscape
                ? styles.letterboxVideo
                : StyleSheet.absoluteFillObject
            }
            resizeMode={
              fourSixteen && !isLandscape
                ? ResizeMode.CONTAIN
                : ResizeMode.COVER
            }
            shouldPlay={!!autoplay && isFocused}
            isLooping
            progressUpdateIntervalMillis={500}
            onPlaybackStatusUpdate={onStatus}
            onError={handleError}
            onFullscreenUpdate={onFsUpdate}
          />
        </View>

        {(!isPlaying || pausedByTap) && !isLandscape && (
          <View style={styles.centerPlay}>
            <MaterialCommunityIcons
              name="play-circle-outline"
              size={74}
              color="#ffffffcc"
            />
          </View>
        )}
      </TouchableOpacity>

      {/* Overlay */}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {/* tiempos y botón 4:16 */}
        {showBarAndTimes && (
          <View
            style={{
              position: "absolute",
              left: timesLeft,
              right: timesRight,
              bottom: GUTTER + AVATAR_SIZE + BETWEEN + BAR_H + 6,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.timeLabel}>{fmtTime(positionMs)}</Text>
            <View style={{ alignItems: "flex-end" }}>
              {!isLandscape && (
                <TouchableOpacity
                  onPress={handleToggleFourSixteen}
                  style={styles.fullscreenBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.fullscreenBtnText}>4:16</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.timeLabel}>
                {durationMs ? `-${fmtTime(remainingMs)}` : "--:--"}
              </Text>
            </View>
          </View>
        )}

        {/* barra de progreso */}
        {showBarAndTimes && (
          <View
            style={{
              position: "absolute",
              left: progressLeft,
              right: progressRight,
              bottom: PROGRESS_BOTTOM,
              height: BAR_H,
              borderRadius: BAR_H / 2,
              backgroundColor: "rgba(255,255,255,0.25)",
              overflow: "hidden",
            }}
            onLayout={onBarLayout}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(e) =>
              onScrubGrant(e.nativeEvent.locationX || 0)
            }
            onResponderMove={(e) =>
              onScrubMove(e.nativeEvent.locationX || 0)
            }
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
        )}

        {/* Caption (solo vertical) */}
        {!!safeCaption && !isLandscape && (
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              left: sideMargin,
              right: sideMargin,
              ...(CAPTION_MODE === "fromBottom"
                ? {
                    bottom:
                      GUTTER +
                      AVATAR_SIZE +
                      BETWEEN +
                      CAPTION_GAP_OVER_BAR,
                  }
                : { top: midCaptionTop }),
            }}
          >
            {needsScroll ? (
              <ScrollView
                style={{
                  height: threeLineHeight,
                  maxHeight: threeLineHeight,
                  alignSelf: "flex-start",
                }}
                contentContainerStyle={{
                  alignItems: "flex-start",
                  paddingVertical: 1,
                }}
                removeClippedSubviews={false}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
              >
                <View style={styles.captionBubble}>
                  <Text
                    style={[
                      styles.captionText,
                      Platform.OS === "android"
                        ? ({ textBreakStrategy: "simple" } as any)
                        : null,
                    ]}
                    allowFontScaling={false}
                    onTextLayout={onCaptionTextLayout}
                  >
                    {safeCaption}
                  </Text>
                </View>
              </ScrollView>
            ) : (
              <View style={{ alignSelf: "flex-start" }}>
                <View style={styles.captionBubble}>
                  <Text
                    style={[
                      styles.captionText,
                      Platform.OS === "android"
                        ? ({ textBreakStrategy: "simple" } as any)
                        : null,
                    ]}
                    allowFontScaling={false}
                    onTextLayout={onCaptionTextLayout}
                  >
                    {safeCaption}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Botonera derecha */}
        <View
          style={{
            position: "absolute",
            right: sideMargin,
            bottom:
              GUTTER +
              AVATAR_SIZE +
              BETWEEN -
              (BAR_H + ICONS_GAP_BELOW),
            maxWidth: ICONS_ROW_MAX_WIDTH,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <View style={styles.iconCol}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleTogglePostStar}
              style={{ alignItems: "center" }}
            >
              <MaterialCommunityIcons
                name={postStarred ? "star" : "star-outline"}
                size={22}
                color={postStarred ? JADE : "#fff"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStarsOpen(true)}
              style={styles.countPill}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.countText}>{postStarsCount}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.iconCol, { marginLeft: 12 }]}
            activeOpacity={0.9}
            onPress={() => setCommentsOpen(true)}
          >
            <MaterialCommunityIcons
              name="comment-outline"
              size={22}
              color="#fff"
            />
            <View style={styles.countPill}>
              <Text style={styles.countText}>{displayedCommentsCount}</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.iconCol, { marginLeft: 12 }]}>
            <MaterialCommunityIcons
              name="share-variant"
              size={22}
              color="#fff"
            />
            <View style={styles.countPill}>
              <Text style={styles.countText}>0</Text>
            </View>
          </View>
        </View>

        {/* Pie con avatar, nombre y vistas */}
        <View
          style={{
            position: "absolute",
            left: sideMargin,
            right: sideMargin,
            bottom: GUTTER,
            flexDirection: "row",
            alignItems: "flex-end",
          }}
        >
          <View style={{ maxWidth: CAPTION_MAX_WIDTH, flexShrink: 1 }}>
            <View style={styles.bubble}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <Image
                  source={require("../../assets/images/avatar_neutral.png")}
                  style={styles.avatar}
                />
              )}
            </View>

            <Text style={styles.postLabel}>Publicación</Text>

            <View style={styles.sideBtnWrap}>
              <TouchableOpacity style={styles.sideBtn} activeOpacity={0.9}>
                <MaterialCommunityIcons
                  name="send-circle-outline"
                  size={TG_ICON_SIZE}
                  color={TG_ICON_COLOR}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.authorName} numberOfLines={1}>
              <Text style={[styles.authorName, { color: hashColor }]}>#</Text>{" "}
              {item.author.username}
            </Text>

            <View style={styles.viewsRow}>
              <Text
                style={styles.views}
              >{`${item.views_count} vistas`}</Text>
              <MaterialCommunityIcons
                name="account-plus"
                size={16}
                color="#fff"
                style={{ opacity: 0.9 }}
              />
            </View>
          </View>

          <View style={{ flex: 1 }} />
        </View>
      </View>

      {/* Sheets comentarios / estrellas */}
      {!isLandscape && (
        <>
          <CommentsSheet
            visible={commentsOpen}
            onClose={() => setCommentsOpen(false)}
            postId={item.id}
            accentColor={JADE}
          />
          <PostStarsSheet
            visible={starsOpen}
            onClose={() => setStarsOpen(false)}
            postId={item.id}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: BG },
  centerPlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  letterboxContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  letterboxVideo: { width: "112%", aspectRatio: 16 / 9 },

  bubble: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatar: {
    width: AVATAR_SIZE - 8,
    height: AVATAR_SIZE - 8,
    borderRadius: (AVATAR_SIZE - 8) / 2,
  },

  postLabel: { color: "#fff", fontSize: 11, opacity: 0.9, marginBottom: 2 },
  authorName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
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

  viewsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  views: { color: "#fff", opacity: 0.9, textAlign: "left" },

  sideBtnWrap: {
    position: "absolute",
    left: AVATAR_SIZE - (TG_SIZE - 6),
    top: AVATAR_SIZE - TG_SIZE / 2 + 6 - 10,
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

  timeLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    opacity: 0.95,
  },
  fullscreenBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(0,0,0,0.55)",
    marginBottom: 4,
  },
  fullscreenBtnText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  captionBubble: {
    alignSelf: "flex-start",
    maxWidth: "82%",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: MIDCAPTION_PAD_V,
    paddingRight: 12,
    overflow: "visible",
    minHeight: CAPTION_LINE_HEIGHT + MIDCAPTION_PAD_V,
  },
  captionText: {
    fontSize: CAPTION_FONT_SIZE,
    lineHeight: CAPTION_LINE_HEIGHT,
    color: "#fff",
    fontWeight: Platform.OS === "android" ? "500" : "800",
    includeFontPadding: Platform.OS === "android",
    textShadowColor: Platform.OS === "android" ? "transparent" : "#000",
    textShadowRadius: Platform.OS === "android" ? 0 : 6,
    textShadowOffset: { width: 0, height: 0 },
  },
});
