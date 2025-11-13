import React, { useCallback, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutChangeEvent,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { authGetProfile, BASE, fetchFeed, trackView } from "../lib/api";

import FeedHeader from "./components/FeedHeader";
import FeedTabs, { TabKey } from "./components/FeedTabs";
import FeedVideoCard, { FeedItem } from "./components/FeedVideoCard";

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("likes");
  const [items, setItems] = useState<FeedItem[]>([]);
  const [index, setIndex] = useState(0);

  // Alturas medidas en runtime
  const [headerH, setHeaderH] = useState(0);
  const [tabsH, setTabsH] = useState(0);

  // 🔧 Alto REAL disponible para la lista (debajo de header+tabs)
  const [listH, setListH] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return router.replace("/login");

      const profile = await authGetProfile();
      setAvatar(profile?.avatar ?? null);

      const data = await fetchFeed(10, 0);
      setItems(data);
    } catch {
      Alert.alert("Sesión", "Vuelve a iniciar sesión");
      router.replace("/login");
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

  const onHeaderLayout = (e: LayoutChangeEvent) =>
    setHeaderH(e.nativeEvent.layout.height);
  const onTabsLayout = (e: LayoutChangeEvent) =>
    setTabsH(e.nativeEvent.layout.height);

  // 👇 Alto del área de la lista (lo que queda libre bajo header+tabs)
  const onListAreaLayout = (e: LayoutChangeEvent) =>
    setListH(e.nativeEvent.layout.height);

  if (loading) {
    return (
      <View style={styles.fill}>
        <ActivityIndicator />
      </View>
    );
  }

  const avatarUri =
    avatar &&
    (String(avatar).startsWith("http") ? avatar : `${BASE}/media/${avatar}`);

  const headerPaddingTop = insets.top + 8;

  return (
    <View style={styles.fill}>
      <View onLayout={onHeaderLayout}>
        <FeedHeader
          avatarUri={avatarUri}
          onPressProfile={() => router.push("/profile")}
          onPressThink={() => router.push("/compose")}
          onPressMore={() => {}}
          paddingTop={headerPaddingTop}
          jade="#6FD9C5"
        />
      </View>

      <View onLayout={onTabsLayout}>
        <FeedTabs value={tab} onChange={setTab} jade="#6FD9C5" />
      </View>

      {/* 🔧 Medimos el alto REAL disponible para el FlatList */}
      <View style={{ flex: 1 }} onLayout={onListAreaLayout}>
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item, index: i }) => (
            // Cada item mide EXACTAMENTE el alto del área disponible
            <View style={{ height: listH || undefined }}>
              <FeedVideoCard
                item={item}
                autoplay={i === index}
                onFirstPlay={(id) => trackView(id).catch(() => {})}
              />
            </View>
          )}
          pagingEnabled
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false} // evita glitches con Video en algunos Android
          // 👇 Alineamos el paginado con la altura real para evitar “cortes”
          snapToInterval={listH || undefined}
          snapToAlignment="start"
          disableIntervalMomentum
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000", alignItems: "stretch" },
});
