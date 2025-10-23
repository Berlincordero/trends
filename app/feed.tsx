// app/feed.tsx
import React, { useCallback, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { authGetProfile, BASE } from "../lib/api";

// Componentes (desde app/ → ./components/…)
import FeedHeader from "./components/FeedHeader";
import FeedTabs, { TabKey } from "./components/FeedTabs";

const JADE = "#6FD9C5";

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("likes");

  const loadData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return router.replace("/login");
      const profile = await authGetProfile();
      setAvatar(profile?.avatar ?? null);
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

  if (loading) {
    return (
      <View style={styles.fill}>
        <ActivityIndicator />
      </View>
    );
  }

  const avatarUri =
    avatar && (String(avatar).startsWith("http") ? avatar : `${BASE}/media/${avatar}`);

  const headerPaddingTop = insets.top + 8; // separación del notch

  const onPressThink = () => {
    // Ir a la pantalla de composición
    router.push("/compose");
  };

  const onPressMore = () => {
    Alert.alert("Más", "Acciones rápidas del feed.");
  };

  const handleTab = (key: TabKey) => setTab(key);

  return (
    <View style={styles.fill}>
      <FeedHeader
        avatarUri={avatarUri}
        onPressProfile={() => router.push("/profile")}
        onPressThink={onPressThink}
        onPressMore={onPressMore}
        paddingTop={headerPaddingTop}
        jade={JADE}
      />

      <FeedTabs value={tab} onChange={handleTab} jade={JADE} />

      {/* Aquí iría el contenido por pestaña:
         {tab === "likes" && <LikesList/>}
         {tab === "audio" && <AudioList/>}
         {tab === "shop" && <ShopView/>}
         {tab === "notifications" && <NotificationsView/>}
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000", alignItems: "stretch" },
});
