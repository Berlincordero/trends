// app/feed.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutChangeEvent,
  StatusBar,
  useWindowDimensions,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import {
  authGetProfile,
  authGetMe,
  BASE,
  fetchFeed,
  trackView,
  FeedPost,
  isLikelyImageUrl,
  toAbsolute,
  deletePost,
} from "../lib/api";
import FeedHeader from "./components/FeedHeader";
import FeedTabs, { TabKey } from "./components/FeedTabs";
import FeedVideoCard, {
  prewarmNext,
  pauseCurrentVideo, // 👈 NUEVO
} from "./components/FeedVideoCard";
import FeedImageCard from "./components/FeedImageCard";
import ContentOptionsSheet from "./components/ContentOptionsSheet";

const JADE = "#fdfdfdff";

// solo para mp4/hls
const isLikelyVideoUrl = (u: string) =>
  /\.m3u8(\?.*)?$|\.mp4(\?.*)?$/i.test(u);

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [avatar, setAvatar] = useState<string | null>(null);
  const [viewerId, setViewerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("likes");
  const [items, setItems] = useState<FeedPost[]>([]);
  const [index, setIndex] = useState(0);
  const [moreVisible, setMoreVisible] = useState(false);

  const [headerH, setHeaderH] = useState(0);
  const [tabsH, setTabsH] = useState(0);
  const [listH, setListH] = useState(0);

  const currentItem = items[index] ?? null;
  const isAuthor =
    !!(viewerId && currentItem && viewerId === currentItem.author.id);

  const avatarUri =
    avatar &&
    (String(avatar).startsWith("http") ? avatar : `${BASE}/media/${avatar}`);
  const headerPaddingTop = insets.top + 8;

  // 🔧 NUEVO loadData: separo auth / perfil / feed para no tumbar la sesión por un 401 del feed
  const loadData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        router.replace("/login");
        return;
      }

      // 1) Usuario (si falla → limpiar token y forzar login)
      try {
        const me = await authGetMe();
        setViewerId(me?.id ?? null);
      } catch (e: any) {
        console.warn("authGetMe error:", e?.message);
        Alert.alert("Sesión", "Vuelve a iniciar sesión");
        await AsyncStorage.removeItem("userToken").catch(() => {});
        router.replace("/login");
        return;
      }

      // 2) Perfil (si falla no rompemos nada)
      try {
        const profile = await authGetProfile();
        setAvatar(profile?.avatar ?? null);
      } catch (e: any) {
        console.warn("authGetProfile error:", e?.message);
        setAvatar(null);
      }

      // 3) Feed (si falla NO mandamos al login)
      try {
        const data = await fetchFeed(10, 0);
        setItems(data);
      } catch (e: any) {
        console.warn("fetchFeed error:", e?.message);
        setItems([]); // dejamos el feed vacío en vez de tirar la sesión
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems?.length > 0) {
      const i = viewableItems[0].index ?? 0;
      setIndex(i);
    }
  }).current;

  const onMomentumScrollEnd = useCallback(() => {
    const next = items[index + 1];
    if (next) {
      const abs = toAbsolute(next.media) || next.media;
      if (abs && isLikelyVideoUrl(abs)) prewarmNext(abs);
    }
  }, [index, items]);

  const onHeaderLayout = (e: LayoutChangeEvent) =>
    setHeaderH(e.nativeEvent.layout.height);
  const onTabsLayout = (e: LayoutChangeEvent) =>
    setTabsH(e.nativeEvent.layout.height);
  const onListAreaLayout = (e: LayoutChangeEvent) =>
    setListH(e.nativeEvent.layout.height);

  const handleDownload = useCallback(async () => {
    try {
      if (!currentItem) return;
      const abs = toAbsolute(currentItem.media) || currentItem.media;
      if (!abs) return;

      const baseDir = String(
        (FileSystem as any).documentDirectory ??
          (FileSystem as any).cacheDirectory ??
          ""
      );

      const normalizedBase = baseDir.endsWith("/") ? baseDir : `${baseDir}/`;
      const ext = isLikelyImageUrl(abs) ? ".jpg" : ".mp4";
      const dest = `${normalizedBase}trends_post_${currentItem.id}${ext}`;

      const downloadRes = await FileSystem.downloadAsync(abs, dest);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadRes.uri);
      }
      Alert.alert("Descarga", "Archivo guardado", [{ text: "OK" }]);
    } catch (e: any) {
      Alert.alert("Descarga", e?.message ?? "No se pudo descargar");
    } finally {
      setMoreVisible(false);
    }
  }, [currentItem]);

  const handleEdit = useCallback(() => {
    if (currentItem) {
      router.push({
        pathname: "/compose",
        params: {
          editId: String(currentItem.id),
          caption: currentItem.caption ?? "",
          media: currentItem.media, // puede ser /hls/... o /media/...
        },
      });
    }
    setMoreVisible(false);
  }, [currentItem, router]);

  const handleDelete = useCallback(() => {
    if (!currentItem) return;

    Alert.alert(
      "Eliminar publicación",
      "¿Seguro que deseas eliminar esta publicación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePost(currentItem.id); // 🔥 backend
              await loadData(); // recarga feed
              setMoreVisible(false);
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "No se pudo eliminar");
            }
          },
        },
      ]
    );
  }, [currentItem, loadData]);

  return (
    <View style={styles.fill}>
      <StatusBar hidden={isLandscape} animated />

      {!isLandscape && (
        <View onLayout={onHeaderLayout}>
          <FeedHeader
            avatarUri={avatarUri}
            onPressProfile={() => router.push("/profile")}
            onPressThink={() => router.push("/compose")}
            onPressMore={() => setMoreVisible(true)}
            paddingTop={headerPaddingTop}
            jade={JADE}
          />
        </View>
      )}
      {!isLandscape && (
        <View onLayout={onTabsLayout}>
          <FeedTabs
            value={tab}
            onChange={setTab}
            jade={JADE}
            // 👇 cuando se toca el corazón, primero pausamos el video
            onPressHeart={() => {
              pauseCurrentVideo();      // 👈 pausa lo que esté sonando
              router.push("/feelings"); // 👈 navega a feelings
            }}
          />
        </View>
      )}

      <View style={{ flex: 1 }} onLayout={onListAreaLayout}>
        {listH > 0 ? (
          <FlatList
            data={items}
            keyExtractor={(it) => String(it.id)}
            renderItem={({ item, index: i }) => {
              const abs = toAbsolute(item.media) || item.media;
              const showAsImage = !!abs && isLikelyImageUrl(abs);
              const showAsVideo =
                !!abs && !showAsImage && isLikelyVideoUrl(abs);

              return (
                <View style={{ height: listH || undefined }}>
                  {showAsVideo ? (
                    <FeedVideoCard
                      item={item}
                      autoplay={i === index}
                      onFirstPlay={(id) => trackView(id).catch(() => {})}
                      isLandscape={isLandscape}
                    />
                  ) : (
                    <FeedImageCard item={item} isLandscape={isLandscape} />
                  )}
                </View>
              );
            }}
            pagingEnabled
            decelerationRate="fast"
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 85 }}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            onMomentumScrollEnd={onMomentumScrollEnd}
            snapToInterval={listH || undefined}
            snapToAlignment="start"
            disableIntervalMomentum
            getItemLayout={(_, i) => ({
              length: listH || 0,
              offset: (listH || 0) * i,
              index: i,
            })}
          />
        ) : (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        )}
      </View>

      <ContentOptionsSheet
        visible={moreVisible}
        onClose={() => setMoreVisible(false)}
        isAuthor={isAuthor}
        onDownload={handleDownload}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator />
          <Text style={{ color: "#fff", marginTop: 8 }}>Cargando…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000", alignItems: "stretch" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
});
