import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  Dimensions,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  authGetMe,
  authGetProfile,
  uploadMyAvatar,
  BASE,
} from "../lib/api";
import ProfileCover, { COVER_HEIGHT } from "./components/ProfileCover";
import ProfileAvatar from "./components/ProfileAvatar";
import ProfileInfo from "./components/ProfileInfo";
import ProfilePostsGrid from "./components/ProfilePostsGrid";

const { width } = Dimensions.get("window");
const AVATAR_SIZE = 120;
const H_PADDING = 16;

const TG_BTN_SIZE = 36;
const TG_ICON_SIZE = 20;
const TG_ICON_COLOR = "#fff";
const TG_BG = "rgba(255,255,255,0.08)";
const TG_BORDER = "rgba(255,255,255,0.18)";

const JADE = "#6FD9C5";

// Icono "post-outline" no existe en MDI; uso "view-grid-outline"
const TABS = [
  { key: "posts", label: "Mis publicaciones", icon: "view-grid-outline" },
  { key: "photos", label: "Mis fotos", icon: "image-multiple-outline" },
  { key: "videos", label: "Mis videos", icon: "video-outline" },
  { key: "settings", label: "Mis configuraciones", icon: "cog-outline" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ProfileScreen() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("posts");

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return router.replace("/login");
      const [u, p] = await Promise.all([authGetMe(), authGetProfile()]);
      setMe(u);
      setProfile(p);
      setLoading(false);
    })().catch(() => {
      setLoading(false);
      router.replace("/login");
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const avatarUri = profile?.avatar
    ? String(profile.avatar).startsWith("http")
      ? profile.avatar
      : `${BASE}/media/${profile.avatar}`
    : undefined;

  const coverPath = profile?.cover ?? me?.cover ?? me?.banner;
  const coverUri = coverPath
    ? String(coverPath).startsWith("http")
      ? coverPath
      : `${BASE}/media/${coverPath}`
    : undefined;

  async function handleLogout() {
    try {
      await AsyncStorage.removeItem("userToken");
    } finally {
      setMenuOpen(false);
      router.replace("/login");
    }
  }

  async function pickAvatar() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        return Alert.alert(
          "Permiso requerido",
          "Habilita el acceso a la galería para cambiar tu avatar."
        );
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (res.canceled) return;
      const a = res.assets?.[0];
      if (!a?.uri) return;
      setUploading(true);
      const out = await uploadMyAvatar({
        uri: a.uri,
        name: (a as any).fileName ?? "avatar.jpg",
        type: (a as any).mimeType ?? "image/jpeg",
      });
      setProfile((old: any) => ({ ...(old || {}), avatar: out.avatar }));
    } catch (e: any) {
      Alert.alert("Error", e?.message || "No se pudo actualizar el avatar");
    } finally {
      setUploading(false);
    }
  }

  function handleTelegram() {
    Alert.alert("Telegram", "Acción del botón Telegram (ajústame).");
  }

  function renderTabContent() {
    switch (activeTab) {
      case "posts":
        return <ProfilePostsGrid scope="me" mediaType="all" enabled={true} />;
      case "photos":
        return <ProfilePostsGrid scope="me" mediaType="image" enabled={true} />;
      case "videos":
        return <ProfilePostsGrid scope="me" mediaType="video" enabled={true} />;
      case "settings":
        return (
          <View style={styles.tabContentBox}>
            <Text style={styles.tabContentText}>
              Aquí van tus configuraciones.
            </Text>
          </View>
        );
      default:
        return null;
    }
  }

  return (
    <View style={styles.wrap}>
      {/* Portada + avatar */}
      <View style={{ width, height: COVER_HEIGHT }}>
        <ProfileCover
          coverUri={coverUri}
          onBack={() => router.back()}
          fallback={require("../assets/images/portada.png")}
        />
        <ProfileAvatar
          avatarUri={avatarUri}
          placeholder={require("../assets/images/avatar_neutral.png")}
          uploading={uploading}
          onPress={pickAvatar}
          size={AVATAR_SIZE}
          leftPadding={H_PADDING}
        />
      </View>

      {/* Info */}
      <ProfileInfo
        me={me}
        profile={profile}
        avatarSize={AVATAR_SIZE}
        hPadding={H_PADDING}
      />

      {/* fila de iconos */}
      <View style={styles.menuRow}>
        <TouchableOpacity
          onPress={handleTelegram}
          style={styles.tgBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.9}
        >
          <MaterialCommunityIcons
            name="send-circle-outline"
            size={TG_ICON_SIZE}
            color={TG_ICON_COLOR}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          style={styles.menuBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.menuDots}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsBar}
        contentContainerStyle={{ paddingHorizontal: H_PADDING }}
      >
        {TABS.map((t, idx) => {
          const active = t.key === activeTab;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.85}
              style={[
                styles.tabBtn,
                active && styles.tabBtnActive,
                idx === 0 && { marginLeft: 0 },
              ]}
            >
              <MaterialCommunityIcons
                name={t.icon as any}
                size={13}
                color={active ? JADE : "rgba(255,255,255,0.6)"}
                style={{ marginRight: 6, marginTop: -1 }}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Contenido */}
      <View style={styles.tabContentWrap}>{renderTabContent()}</View>

      {/* Modal menú */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.pull} />
          <TouchableOpacity style={[styles.sheetItem]} onPress={handleLogout}>
            <Text style={[styles.sheetText, { color: "#ff6b6b" }]}>
              Cerrar sesión
            </Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.sheetItem}
            onPress={() => setMenuOpen(false)}
          >
            <Text style={styles.sheetText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#000" },

  menuRow: {
    paddingHorizontal: H_PADDING,
    paddingBottom: 10,
    paddingTop: 18,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
  },

  tgBtn: {
    height: TG_BTN_SIZE,
    minWidth: TG_BTN_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: TG_BTN_SIZE / 2,
    backgroundColor: TG_BG,
    borderWidth: 1,
    borderColor: TG_BORDER,
  },
  menuBtn: {
    height: 36,
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  menuDots: { color: "#fff", fontSize: 22, lineHeight: 22, marginTop: -2 },

  tabsBar: {
    marginTop: 10,
    maxHeight: 38,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 12,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: JADE,
  },
  tabLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    // ❗️Quito fontFamily "Pacifico" para evitar error si no está cargada
  },
  tabLabelActive: {
    color: JADE,
    fontWeight: "600",
  },

  tabContentWrap: {
    paddingHorizontal: H_PADDING,
    paddingTop: 14,
    flex: 1,
  },
  tabContentBox: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 14,
  },
  tabContentText: {
    color: "#fff",
    opacity: 0.9,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#111",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 28,
    paddingTop: 8,
  },
  pull: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 8,
  },
  sheetItem: { paddingVertical: 16, paddingHorizontal: 20 },
  sheetText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 20,
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
