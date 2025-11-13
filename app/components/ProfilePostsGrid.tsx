 // app/components/ProfilePostGrid.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Video, ResizeMode, Audio } from "expo-av";
import {
  FeedPost,
  fetchMyPosts,
  fetchUserPosts,
  toAbsolute,
} from "../../lib/api";

const GAP = 6;               // un poco más de aire para 2 columnas
const PAD = 8;
const COLS = 2;              // 👈 dos columnas
const { width } = Dimensions.get("window");
const CELL_W = Math.floor((width - PAD * 2 - GAP * (COLS - 1)) / COLS);

// relación de aspecto vertical (más alto que ancho)
const TALL_RATIO = 1.5;      // p.ej. ~3:2 — puedes subir a 1.6 si lo quieres aún más alto
const CELL_H = Math.floor(CELL_W * TALL_RATIO);

type MediaType = "all" | "image" | "video";

type Props =
  | {
      scope: "me";
      mediaType?: MediaType;
      enabled?: boolean;
      onOpenPost?: (post: FeedPost) => void;
    }
  | {
      scope: "user";
      userId: number;
      mediaType?: MediaType;
      enabled?: boolean;
      onOpenPost?: (post: FeedPost) => void;
    };

const JADE = "#6FD9C5";

function isVideo(url?: string | null) {
  if (!url) return false;
  return /\.(mp4|m4v|mov|3gp|3gpp|webm|mkv)(\?|$)/i.test(
    (url.split("?")[0] || "")
  );
}

function byMediaType(items: FeedPost[], type: MediaType) {
  if (type === "all") return items;
  return items.filter((p) =>
    type === "video" ? isVideo(p.media) : !isVideo(p.media)
  );
}

/** compara sets sin renderizar de más */
function setsEqual(a: Set<number>, b: Set<number>) {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export default function ProfilePostsGrid(props: Props) {
  const mediaType = props.mediaType ?? "all";
  const enabled = props.enabled ?? true;

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [rawItems, setRawItems] = useState<FeedPost[]>([]);
  const offsetRef = useRef(0);
  const pageSizeRef = useRef(30);

  // 🔒 Fuentes de video estables por id → evita rebuffer/recreación
  const videoSourcesRef = useRef(new Map<number, { uri: string }>());
  const getStableSource = useCallback((id: number, uri: string) => {
    const map = videoSourcesRef.current;
    const prev = map.get(id);
    if (prev && prev.uri === uri) return prev;
    const obj = { uri };
    map.set(id, obj);
    return obj;
  }, []);

  // ➕ Set de IDs ya vistos para evitar duplicados entre páginas
  const seenIdsRef = useRef<Set<number>>(new Set());

  // visibilidad controlada (histeresis)
  const [visibleIds, _setVisibleIds] = useState<Set<number>>(new Set());
  const visibleIdsRef = useRef(visibleIds);
  const setVisibleIds = (s: Set<number>) => {
    if (!setsEqual(visibleIdsRef.current, s)) {
      visibleIdsRef.current = s;
      _setVisibleIds(new Set(s));
    }
  };

  // iOS: reproducir en silencio
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    }).catch(() => {});
  }, []);

  // items filtrados
  const items = useMemo(
    () => byMediaType(rawItems, mediaType),
    [rawItems, mediaType]
  );

  // carga (infinita) con deduplicado por id
  const loadMore = useCallback(async () => {
    if (!enabled || loadingMore || !hasMore) return;
    setLoadingMore(true);

    const limit = pageSizeRef.current;
    const offset = offsetRef.current;

    try {
      const loader =
        props.scope === "me"
          ? fetchMyPosts
          : (l: number, o: number) => fetchUserPosts((props as any).userId, l, o);

      const page = await loader(limit, offset);

      // 🔐 deduplicar por id
      const unique: FeedPost[] = [];
      const seen = seenIdsRef.current;
      for (const p of page) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          unique.push(p);
        }
      }

      setRawItems((prev) => prev.concat(unique));
      // Importante: avanzamos el offset por el tamaño de la página recibida,
      // no por los únicos, para evitar re-solicitar el mismo rango.
      offsetRef.current = offset + page.length;
      setHasMore(page.length === limit);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [enabled, loadingMore, hasMore, props]);

  // primer fetch + cuando cambia el filtro/scope
  useEffect(() => {
    setRawItems([]);
    setHasMore(true);
    offsetRef.current = 0;
    videoSourcesRef.current.clear();
    seenIdsRef.current.clear(); // 👈 reset del set anti-duplicados
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, props.scope, mediaType]);

  // evitar ping-pong de visibilidad
  const viewabilityConfig = useRef({
    minimumViewTime: 160,
    itemVisiblePercentThreshold: 70,
    waitForInteraction: false,
  }).current;

  const onViewableItemsChanged = useRef(
    (info: {
      viewableItems: Array<{ item: FeedPost; isViewable: boolean }>;
    }) => {
      const next = new Set<number>();
      for (const vi of info.viewableItems) {
        if (vi.isViewable) next.add(vi.item.id);
      }
      setVisibleIds(next);
    }
  );

  // throttle de onEndReached
  const canTriggerMoreRef = useRef(true);
  const onEndReached = useCallback(() => {
    if (!canTriggerMoreRef.current) return;
    canTriggerMoreRef.current = false;
    loadMore().finally(() => {
      setTimeout(() => (canTriggerMoreRef.current = true), 450);
    });
  }, [loadMore]);

  const onMomentumScrollBegin = useCallback(() => {
    canTriggerMoreRef.current = true;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: FeedPost }) => {
      const uri = toAbsolute(item.media) || undefined;
      const video = isVideo(uri);
      const playing = video && visibleIds.has(item.id);

      // ⚠️ ¡Sin hooks aquí! Solo usamos el Map para tener source estable
      const source = video && uri ? getStableSource(item.id, uri) : undefined;

      return (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.cell}
          onPress={() => props.onOpenPost?.(item)}
        >
          {video ? (
            <View style={{ flex: 1 }}>
              <Video
                source={source!}
                resizeMode={ResizeMode.COVER}
                style={styles.media}
                shouldPlay={playing}
                isLooping
                isMuted
                useNativeControls={false}
              />
              <View style={styles.badgeTopRight}>
                <MaterialCommunityIcons name="video-outline" size={14} color={JADE} />
              </View>
            </View>
          ) : (
            <>
              <Image source={{ uri }} style={styles.media} />
              <View style={styles.badgeTopRight}>
                <MaterialCommunityIcons name="image-outline" size={14} color="#fff" />
              </View>
            </>
          )}

          <View style={styles.overlayRow}>
            <MaterialCommunityIcons name="eye-outline" size={14} color="#fff" />
            <Text style={styles.overlayText}>{item.views_count ?? 0}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [props, visibleIds, getStableSource]
  );

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        numColumns={COLS}
        renderItem={renderItem}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP, paddingBottom: 28 }}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.2}
        onMomentumScrollBegin={onMomentumScrollBegin}
        removeClippedSubviews
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged.current}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: CELL_W,
    height: CELL_H, // 👈 más alto
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  overlayRow: {
    position: "absolute",
    left: 8,
    bottom: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 8,
    height: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  overlayText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  badgeTopRight: {
    position: "absolute",
    right: 6,
    top: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    height: 22,
    minWidth: 22,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
