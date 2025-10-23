// app/compose.tsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  LayoutChangeEvent,
  Dimensions,
  ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts, Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import { authGetProfile, BASE } from "../lib/api";
import PublishOptionsMenu from "./components/PublishOptionsMenu";

// ---------- types ----------
type Picked =
  | { kind: "image"; uri: string }
  | { kind: "video"; uri: string }
  | null;

// ---------- UI consts ----------
const JADE = "#6FD9C5";
const BG = "#000";
const IMMERSIVE_HEIGHT_RATIO = 0.5;
const VISIBLE_LINES = 7;
const LINE_HEIGHT_416 = 20;
const TEXT_MAX_HEIGHT_416 = VISIBLE_LINES * LINE_HEIGHT_416;

// Fondo del menú
const MENU_BG: ImageSourcePropType | undefined =
  require("../assets/images/fondo.png");

// ---------- helpers ----------
const isImage = (p: Picked): p is { kind: "image"; uri: string } =>
  !!p && p.kind === "image";
const isVideo = (p: Picked): p is { kind: "video"; uri: string } =>
  !!p && p.kind === "video";

export default function ComposeScreen() {
  // 1) hooks SIEMPRE en el mismo orden
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Pacifico_400Regular });

  // state
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<Picked>(null);
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [barWidth, setBarWidth] = useState(1);
  const [immersive, setImmersive] = useState(false);
  const [text, setText] = useState("");

  // refs para playback
  const lastPlaybackRef = useRef<{ position: number; playing: boolean } | null>(
    null
  );

  // callbacks (orden fijo, ninguno condicional)
  const snapshotPlayback = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      const s = await v.getStatusAsync();
      if ("isLoaded" in s && s.isLoaded) {
        lastPlaybackRef.current = {
          position: s.positionMillis ?? 0,
          playing: !!(s.isPlaying || s.shouldPlay),
        };
      }
    } catch {}
  }, []);

  const restorePlayback = useCallback(async () => {
    const v = videoRef.current;
    const snap = lastPlaybackRef.current;
    if (!v || !snap) return;
    try {
      await v.setPositionAsync(Math.max(0, snap.position));
      if (snap.playing) await v.playAsync();
      else await v.pauseAsync();
    } catch {}
  }, []);

  const toggleImmersiveSafe = useCallback(() => {
    if (isVideo(picked)) {
      // no condicionar hooks, solo lógica dentro
      snapshotPlayback().finally(() => setImmersive((v) => !v));
    } else {
      setImmersive((v) => !v);
    }
  }, [picked, snapshotPlayback]);

  const pickMedia = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const VIDEO_QUALITY: any =
      (ImagePicker as any).UIImagePickerControllerQualityType?.High ?? "high";

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
      videoQuality: VIDEO_QUALITY,
      allowsEditing: false,
    } as any);

    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset?.uri) return;

    const isVid = (asset.type ?? "").includes("video");
    setPicked(isVid ? { kind: "video", uri: asset.uri } : { kind: "image", uri: asset.uri });
  }, []);

  const clearMedia = useCallback(() => {
    setPicked(null);
    setStatus(null);
    setImmersive(false);
    lastPlaybackRef.current = null;
  }, []);

  const onStatusUpdate = useCallback((s: AVPlaybackStatus) => setStatus(s), []);

  const seekToPct = useCallback(
    async (p: number, durationMs: number) => {
      if (!isVideo(picked) || !durationMs) return;
      const clamped = Math.min(1, Math.max(0, p));
      await videoRef.current?.setPositionAsync(Math.floor(durationMs * clamped));
    },
    [picked]
  );

  const onCollage = useCallback(() => {
    // placeholder estable (no lo borres para que la firma de hooks no cambie)
    pickMedia();
  }, [pickMedia]);

  // effects (orden fijo)
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) return router.replace("/login");
        const p = await authGetProfile();
        const a = p?.avatar
          ? String(p.avatar).startsWith("http")
            ? p.avatar
            : `${BASE}/media/${p.avatar}`
          : null;
        setAvatar(a);
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (isVideo(picked)) restorePlayback();
  }, [immersive, picked, restorePlayback]);

  // memo derivados (no cambian el orden de hooks)
  const durationMs =
    (status && "durationMillis" in status && status.durationMillis) || 0;
  const positionMs =
    (status && "positionMillis" in status && status.positionMillis) || 0;
  const pct = durationMs > 0 ? positionMs / durationMs : 0;

  // early return OK (todos los hooks ya se declararon)
  if (loading || !fontsLoaded) {
    return (
      <View style={[styles.fill, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator />
      </View>
    );
  }

  // UI
  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="chevron-back" size={26} color="#fff" />
      </TouchableOpacity>

      <Image
        source={avatar ? { uri: avatar } : require("../assets/images/avatar_neutral.png")}
        style={styles.headerAvatarTight}
      />

      <View style={styles.headerCenter}>
        <Text
          style={styles.pacific}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          Crear publicación
        </Text>
      </View>

      {!!picked && (
        <TouchableOpacity style={styles.publishBtn} onPress={() => router.back()}>
          <Text style={styles.publishTxt}>Publicar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const TopText = immersive ? (
    <View style={[styles.topTextWrap, { paddingTop: insets.top + 76, paddingBottom: 6 }]}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="¿Qué estás pensando?"
        placeholderTextColor="rgba(255,255,255,0.9)"
        style={[styles.topText, { fontSize: 16, lineHeight: LINE_HEIGHT_416, maxHeight: TEXT_MAX_HEIGHT_416 }]}
        multiline
        numberOfLines={VISIBLE_LINES}
        scrollEnabled
        textAlignVertical="top"
        underlineColorAndroid="transparent"
      />
    </View>
  ) : null;

  const renderImage = () =>
    immersive ? (
      <>
        <View style={[styles.immersiveWrap, { paddingTop: (insets.top || 0) + 64, paddingBottom: 120 }]}>
          <View style={[styles.immersiveFrame, { height: `${IMMERSIVE_HEIGHT_RATIO * 100}%` }]}>
            <Image source={{ uri: picked!.uri }} style={styles.full} resizeMode="cover" />
          </View>
        </View>
        {TopText}
      </>
    ) : (
      <>
        <Image source={{ uri: picked!.uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <View pointerEvents="box-none" style={styles.textOverlayWrap}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="¿Qué estás pensando?"
            placeholderTextColor="rgba(255,255,255,0.9)"
            style={styles.textOverlay}
            multiline
          />
        </View>
      </>
    );

  const renderVideo = () =>
    immersive ? (
      <>
        <View style={[styles.immersiveWrap, { paddingTop: (insets.top || 0) + 64, paddingBottom: 120 }]}>
          <View style={[styles.immersiveFrame, { height: `${IMMERSIVE_HEIGHT_RATIO * 100}%` }]}>
            <Video
              ref={videoRef}
              source={{ uri: picked!.uri }}
              style={styles.full}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              onPlaybackStatusUpdate={onStatusUpdate}
            />
          </View>
        </View>
        {TopText}
      </>
    ) : (
      <>
        <Video
          ref={videoRef}
          source={{ uri: picked!.uri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          onPlaybackStatusUpdate={onStatusUpdate}
        />
        <View pointerEvents="box-none" style={styles.textOverlayWrap}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="¿Qué estás pensando?"
            placeholderTextColor="rgba(255,255,255,0.9)"
            style={styles.textOverlay}
            multiline
          />
        </View>
      </>
    );

  const onBarLayout = (e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width);
  const onScrubGrantMove = (x: number) => {
    const w = Math.max(1, barWidth);
    seekToPct(x / w, durationMs);
  };

  return (
    <View style={styles.fill}>
      {Header}

      {!picked && (
        <PublishOptionsMenu
          onPickMedia={pickMedia}
          onCamera={pickMedia}
          onTextPlusFile={pickMedia}
          onCollage={onCollage}
          menuBg={MENU_BG}
        />
      )}

      {isImage(picked) && picked.uri !== "" && (
        <>
          {renderImage()}
          <BottomControls
            pct={0}
            onBarLayout={onBarLayout}
            onScrubGrantMove={onScrubGrantMove}
            onClear={clearMedia}
            immersive={immersive}
            toggleImmersive={toggleImmersiveSafe}
          />
        </>
      )}

      {isVideo(picked) && (
        <>
          {renderVideo()}
          <BottomControls
            pct={pct}
            onBarLayout={onBarLayout}
            onScrubGrantMove={onScrubGrantMove}
            onClear={clearMedia}
            immersive={immersive}
            toggleImmersive={toggleImmersiveSafe}
          />
        </>
      )}
    </View>
  );
}

// ---------- bottom controls ----------
function BottomControls({
  pct,
  onBarLayout,
  onScrubGrantMove,
  onClear,
  immersive,
  toggleImmersive,
}: {
  pct: number;
  onBarLayout: (e: LayoutChangeEvent) => void;
  onScrubGrantMove: (x: number) => void;
  onClear: () => void;
  immersive: boolean;
  toggleImmersive: () => void;
}) {
  return (
    <View pointerEvents="box-none" style={styles.bottomWrap}>
      <View style={styles.bottomPills}>
        <TouchableOpacity style={styles.pill} onPress={onClear}>
          <MaterialCommunityIcons name="brush" size={18} color="#fff" />
          <Text style={styles.pillTxt}>Limpiar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.pill, styles.pillInverse]} onPress={toggleImmersive}>
          <MaterialCommunityIcons
            name={immersive ? "fullscreen-exit" : "fullscreen"}
            size={18}
            color="#fff"
          />
          <Text style={[styles.pillTxt, { color: "#fff" }]}>4:16</Text>
        </TouchableOpacity>
      </View>

      <View
        style={styles.scrubBg}
        onLayout={onBarLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => onScrubGrantMove(e.nativeEvent.locationX || 0)}
        onResponderMove={(e) => onScrubGrantMove(e.nativeEvent.locationX || 0)}
      >
        <View style={[styles.scrubFill, { width: `${Math.max(0, Math.min(1, pct)) * 100}%` }]} />
      </View>
    </View>
  );
}

// ---------- styles ----------
const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: BG },
  immersiveWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BG,
  },
  immersiveFrame: { width: "100%", overflow: "hidden", borderRadius: 0 },
  full: { width: "100%", height: "100%" },

  topTextWrap: { position: "absolute", left: 16, right: 16 },
  topText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    textShadowColor: "#000",
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },

  header: {
    position: "absolute",
    left: 0, right: 0, top: 0, zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  backBtn: {
    height: 36, width: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  headerAvatarTight: {
    width: 35, height: 35, borderRadius: 14,
    marginLeft: 6, marginRight: 8,
  },
  headerCenter: {
    flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 16,
    paddingVertical: 6, paddingHorizontal: 10, marginRight: 12,
  },
  pacific: {
    fontFamily: "Pacifico_400Regular",
    color: "#fff", fontSize: 20,
    includeFontPadding: false, textAlignVertical: "center", flexShrink: 1,
  },
  publishBtn: {
    marginLeft: 6, paddingHorizontal: 12, height: 32,
    borderRadius: 16, backgroundColor: JADE,
    alignItems: "center", justifyContent: "center",
  },
  publishTxt: { color: "#111", fontFamily: "Pacifico_400Regular", fontSize: 16 },

  textOverlayWrap: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 88, paddingHorizontal: 16,
  },
  textOverlay: {
    color: "#fff", fontSize: 14, fontWeight: "800",
    textShadowColor: "#000", textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },

  bottomWrap: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 12, paddingBottom: 12,
  },
  bottomPills: {
    flexDirection: "row", alignItems: "center",
    gap: 10, marginBottom: 8,
  },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    height: 36, borderRadius: 18, paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  pillInverse: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  pillTxt: { color: "#fff", fontFamily: "Pacifico_400Regular", fontSize: 16 },
  scrubBg: {
    height: 8, borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)", overflow: "hidden",
  },
  scrubFill: { height: "100%", backgroundColor: JADE },
});
