import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Pressable, Alert, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { authGetMe, authGetProfile, uploadMyAvatar, BASE } from "../lib/api";
import ProfileCover, { COVER_HEIGHT } from "./components/ProfileCover";
import ProfileAvatar from "./components/ProfileAvatar";
import ProfileInfo from "./components/ProfileInfo";

const { width } = Dimensions.get("window");
const AVATAR_SIZE = 120;
const H_PADDING = 16;

export default function ProfileScreen() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return router.replace("/login");
      const [u, p] = await Promise.all([authGetMe(), authGetProfile()]);
      setMe(u); setProfile(p); setLoading(false);
    })().catch(() => { setLoading(false); router.replace("/login"); });
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  const avatarUri = profile?.avatar
    ? (String(profile.avatar).startsWith("http") ? profile.avatar : `${BASE}/media/${profile.avatar}`)
    : undefined;

  const coverPath = profile?.cover ?? me?.cover ?? me?.banner;
  const coverUri = coverPath
    ? (String(coverPath).startsWith("http") ? coverPath : `${BASE}/media/${coverPath}`)
    : undefined;

  async function handleLogout() {
    try { await AsyncStorage.removeItem("userToken"); }
    finally { setMenuOpen(false); router.replace("/login"); }
  }

  async function pickAvatar() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return Alert.alert("Permiso requerido", "Habilita el acceso a la galería para cambiar tu avatar.");
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.9 });
      if (res.canceled) return;
      const a = res.assets?.[0]; if (!a?.uri) return;
      setUploading(true);
      const out = await uploadMyAvatar({ uri: a.uri, name: (a as any).fileName ?? "avatar.jpg", type: (a as any).mimeType ?? "image/jpeg" });
      setProfile((old: any) => ({ ...(old || {}), avatar: out.avatar }));
    } catch (e: any) { Alert.alert("Error", e?.message || "No se pudo actualizar el avatar"); }
    finally { setUploading(false); }
  }

  return (
    <View style={styles.wrap}>
      <View style={{ width, height: COVER_HEIGHT }}>
        <ProfileCover
          coverUri={coverUri}
          onBack={() => router.back()}
          // 👇 desde app/* a assets/* → ../assets/...
          fallback={require("../assets/images/portada.jpg")}
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

      <ProfileInfo me={me} profile={profile} avatarSize={AVATAR_SIZE} hPadding={H_PADDING} />

      <View style={styles.menuRow}>
        <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.menuDots}>⋯</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.pull} />
          <TouchableOpacity style={[styles.sheetItem]} onPress={handleLogout}>
            <Text style={[styles.sheetText, { color: "#ff6b6b" }]}>Cerrar sesión</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.sheetItem} onPress={() => setMenuOpen(false)}>
            <Text style={styles.sheetText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#000" },
  menuRow: { paddingHorizontal: H_PADDING, paddingBottom: 24, flexDirection: "row", justifyContent: "flex-end" },
  menuBtn: { height: 36, minWidth: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "rgba(255,255,255,0.08)" },
  menuDots: { color: "#fff", fontSize: 22, lineHeight: 22, marginTop: -2 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#111", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 28, paddingTop: 8 },
  pull: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)", marginBottom: 8 },
  sheetItem: { paddingVertical: 16, paddingHorizontal: 20 },
  sheetText: { color: "#fff", fontSize: 16, textAlign: "center", fontWeight: "600" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.15)", marginHorizontal: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
