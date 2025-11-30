// app/compose.tsx
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  LayoutChangeEvent,
  ImageSourcePropType,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts, Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import LottieView from "lottie-react-native";
import { Asset } from "expo-asset";

import { authGetProfile, BASE, publishPost, updatePost } from "../lib/api";
import PublishOptionsMenu from "./components/PublishOptionsMenu";
import ComposeTextStyle, {
  DEFAULT_TEXT_STYLE,
} from "./components/ComposeTextStyle";

type Picked =
  | { kind: "image"; uri: string }
  | { kind: "video"; uri: string }
  | null;

const JADE = "#6FD9C5";
const BG = "#000";

const IMMERSIVE_HEIGHT_RATIO = 0.5;
const VISIBLE_LINES = 7;
const LINE_HEIGHT_416 = 20;
const TEXT_MAX_HEIGHT_416 = VISIBLE_LINES * LINE_HEIGHT_416;

// fondo del menú
const MENU_BG: ImageSourcePropType | undefined =
  require("../assets/images/fondo.png");

/* ------------------------------------------------------------------ */
/* TIPOS PARA POSTS DE TEXTO                                          */
/* ------------------------------------------------------------------ */

type BackgroundOption = {
  key: string;
  label: string;
  image: ImageSourcePropType;
};

type TextPostStyle = {
  color: string;
  align: "left" | "center" | "right";
  bgKey: string;
  fontSize?: number;
  shadowColor?: string;
  bubbleColor?: string;
  fontFamily?: string; // 👈 NUEVO: fuente usada
};

type StyledTextValue = {
  text: string;
  style: {
    color: string;
    fontSize?: number;
    shadowColor?: string;
    bubbleColor?: string;
    fontFamily?: string; // 👈 NUEVO
  };
  bgKey: string;
  align: "left" | "center" | "right";
};

const TEXT_POST_BACKGROUNDS: BackgroundOption[] = [
  {
    key: "blur-1",
    label: "Clásico",
    image: require("../assets/images/fondo-1.png"),
  },
  {
    key: "blur-2",
    label: "Azul",
    image: require("../assets/images/fondo-2.png"),
  },
  {
    key: "blur-3",
    label: "Verde",
    image: require("../assets/images/fondo-3.png"),
  },
  {
    key: "blur-4",
    label: "Rojo",
    image: require("../assets/images/fondo-4.png"),
  },
  {
    key: "blur-5",
    label: "Morado",
    image: require("../assets/images/fondo-5.png"),
  },
  {
    key: "blur-6",
    label: "Amarillo",
    image: require("../assets/images/fondo-6.png"),
  },
  {
    key: "blur-7",
    label: "Naranja",
    image: require("../assets/images/fondo.png"),
  },
  {
    key: "blur-8",
    label: "Rosa",
    image: require("../assets/images/fondo-8.png"),
  },
  {
    key: "blur-9",
    label: "Cian",
    image: require("../assets/images/fondo-9.png"),
  }
  , {
    key: "blur-10",
    label: "Gris",
    image: require("../assets/images/fondo-10.png"),
  }
  , {
    key: "blur-11",
    label: "Turquesa",
    image: require("../assets/images/fondo-11.png"),
  }
  , {
    key: "blur-12",
    label: "Lavanda",
    image: require("../assets/images/fondo-12.png"),
  }
  , {
    key: "blur-13",
    label: "Menta",
    image: require("../assets/images/fondo-13.png"),
  }
  , {
    key: "blur-14",
    label: "Coral",
    image: require("../assets/images/fondo-14.png"),
  }
  , {
    key: "blur-15",
    label: "Ocre",
    image: require("../assets/images/fondo-15.png"),
  }
  , {
    key: "blur-16",
    label: "Celeste",
    image: require("../assets/images/fondo-16.png"),
  }
  , {
    key: "blur-17",
    label: "Violeta",
    image: require("../assets/images/fondo-17.png"),
  }
  , {
    key: "blur-18",
    label: "Magenta",
    image: require("../assets/images/fondo-18.png"),
  }
  , {
    key: "blur-19",
    label: "Oliva",
    image: require("../assets/images/fondo-19.png"),
  }
];

const isImage = (p: Picked): p is { kind: "image"; uri: string } =>
  !!p && p.kind === "image";
const isVideo = (p: Picked): p is { kind: "video"; uri: string } =>
  !!p && p.kind === "video";

const looksLikeImage = (u: string) =>
  /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(u);

const absolutize = (u: string) => {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  const rel = u.startsWith("/") ? u : `/${u}`;
  return `${BASE}${rel}`;
};

type ComposeMode = "media" | "text";

// -------------------------------------------------------------
// COMPONENTE PRINCIPAL
// -------------------------------------------------------------
export default function ComposeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { editId, caption, media } = useLocalSearchParams<{
    editId?: string;
    caption?: string;
    media?: string;
  }>();

  const isEdit = !!editId;

  const [fontsLoaded] = useFonts({ Pacifico_400Regular });

  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<Picked>(null);
  const [mode, setMode] = useState<ComposeMode>("media");

  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [barWidth, setBarWidth] = useState(1);
  const [immersive, setImmersive] = useState(false);

  // texto / caption (para posts con media o edición)
  const [text, setText] = useState(caption ?? "");
  const [publishing, setPublishing] = useState(false);

  // estilo base para posts de texto
  const [textStyle] = useState<TextPostStyle>({
    color: DEFAULT_TEXT_STYLE.color,
    align: "center",
    bgKey: TEXT_POST_BACKGROUNDS[0].key,
    fontSize: DEFAULT_TEXT_STYLE.fontSize,
    shadowColor: DEFAULT_TEXT_STYLE.shadowColor,
    bubbleColor: DEFAULT_TEXT_STYLE.bubbleColor,
    fontFamily: DEFAULT_TEXT_STYLE.fontFamily, // 👈 importante
  });

  // refs donde guardamos el post de TEXTO (para publicar sin re-renderizar todo)
  const textRef = useRef<string>("");
  const styleRef = useRef<TextPostStyle>(textStyle);

  // refs playback
  const lastPlaybackRef = useRef<{
    position: number;
    playing: boolean;
  } | null>(null);

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

    setPicked(
      isVid
        ? { kind: "video", uri: asset.uri }
        : { kind: "image", uri: asset.uri }
    );
    setMode("media");
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
      await videoRef.current?.setPositionAsync(
        Math.floor(durationMs * clamped)
      );
    },
    [picked]
  );

  const onCollage = useCallback(() => {
    pickMedia();
  }, [pickMedia]);

  // -------- carga avatar --------
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

  // -------- cuando llega media por params en edición --------
  useEffect(() => {
    if (!isEdit) return;
    if (!media) return;

    const abs = absolutize(String(media));
    if (looksLikeImage(abs)) {
      setPicked({ kind: "image", uri: abs });
    } else {
      setPicked({ kind: "video", uri: abs });
    }
  }, [isEdit, media]);

  useEffect(() => {
    if (isVideo(picked)) restorePlayback();
  }, [immersive, picked, restorePlayback]);

  const durationMs =
    (status && "durationMillis" in status && status.durationMillis) || 0;
  const positionMs =
    (status && "positionMillis" in status && status.positionMillis) || 0;
  const pct = durationMs > 0 ? positionMs / durationMs : 0;

  // ------------------------ handler para estilos de texto ------------------------
  const handleStyledChange = useCallback((v: StyledTextValue) => {
    // guardamos en refs, sin hacer setState → escritura fluida
    textRef.current = v.text;
    styleRef.current = {
      color: v.style.color,
      align: v.align,
      bgKey: v.bgKey,
      fontSize: v.style.fontSize,
      shadowColor: v.style.shadowColor ?? DEFAULT_TEXT_STYLE.shadowColor,
      bubbleColor: v.style.bubbleColor ?? DEFAULT_TEXT_STYLE.bubbleColor,
      fontFamily: v.style.fontFamily ?? DEFAULT_TEXT_STYLE.fontFamily, // 👈 aquí se guarda la fuente
    };
  }, []);

  // ------------------------ PUBLISH / UPDATE ------------------------
  const onPublish = useCallback(async () => {
    if (publishing) return;

    try {
      setPublishing(true);

      // ----- EDITAR POST EXISTENTE -----
      if (isEdit) {
        await updatePost(Number(editId), { caption: text || null });
        router.replace("/feed");
        return;
      }

      // ----- NUEVO POST DE TEXTO -----
      if (mode === "text") {
        const t = (textRef.current || "").trim();
        if (!t) {
          Alert.alert(
            "Post de texto vacío",
            "Escribe algo antes de publicar (máx. 200 caracteres)."
          );
          setPublishing(false);
          return;
        }

        const effectiveStyle = styleRef.current || textStyle;

        const captionPayload = {
          kind: "text" as const,
          text: t,
          style: {
            color: effectiveStyle.color,
            align: effectiveStyle.align,
            fontSize:
              effectiveStyle.fontSize ?? DEFAULT_TEXT_STYLE.fontSize,
            shadowColor:
              effectiveStyle.shadowColor ?? DEFAULT_TEXT_STYLE.shadowColor,
            bubbleColor:
              effectiveStyle.bubbleColor ?? DEFAULT_TEXT_STYLE.bubbleColor,
            fontFamily:
              effectiveStyle.fontFamily ?? DEFAULT_TEXT_STYLE.fontFamily, // 👈 se manda al backend
          },
        };

        const captionJson = JSON.stringify(captionPayload);

        const bg =
          TEXT_POST_BACKGROUNDS.find((b) => b.key === effectiveStyle.bgKey) ??
          TEXT_POST_BACKGROUNDS[0];

        const asset = Asset.fromModule(bg.image as number);
        await asset.downloadAsync();
        const uri = asset.localUri ?? asset.uri;

        const file = {
          uri,
          type: "image/jpeg",
          name: `text_bg_${bg.key}.jpg`,
        };

        await publishPost(file, captionJson);
        router.replace("/feed");
        return;
      }

      // ----- NUEVO POST MEDIA (imagen / video) -----
      if (!picked) {
        Alert.alert(
          "Selecciona un archivo",
          "Elige una imagen o un video para publicar, o cambia al modo texto."
        );
        setPublishing(false);
        return;
      }

      await videoRef.current?.pauseAsync().catch(() => {});

      let file: { uri: string; name?: string; type?: string };
      if (isVideo(picked)) {
        file = {
          uri: picked.uri,
          type: "video/mp4",
          name: "video.mp4",
        };
      } else {
        file = {
          uri: picked.uri,
          type: "image/jpeg",
          name: "image.jpg",
        };
      }

      await publishPost(file, text || undefined);
      router.replace("/feed");
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.message ?? (isEdit ? "No se pudo guardar" : "No se pudo publicar")
      );
      setPublishing(false);
    }
  }, [
    publishing,
    isEdit,
    editId,
    picked,
    text,
    router,
    mode,
    textStyle,
  ]);

  if (loading || !fontsLoaded) {
    return (
      <View
        style={[
          styles.fill,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator />
      </View>
    );
  }

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        disabled={publishing}
      >
        <Ionicons name="chevron-back" size={26} color="#fff" />
      </TouchableOpacity>

      <Image
        source={
          avatar
            ? { uri: avatar }
            : require("../assets/images/avatar_neutral.png")
        }
        style={styles.headerAvatarTight}
      />

      <View style={styles.headerCenter}>
        <Text
          style={styles.pacific}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {isEdit ? "Editar publicación" : "Crear publicación"}
        </Text>
      </View>

      {(isEdit || !!picked || mode === "text") && (
        <TouchableOpacity
          style={[styles.publishBtn, publishing && { opacity: 0.6 }]}
          onPress={onPublish}
          disabled={publishing}
        >
          <Text style={styles.publishTxt}>
            {publishing
              ? isEdit
                ? "Guardando…"
                : "Publicando…"
              : isEdit
              ? "Guardar"
              : "Publicar"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ----------------- Caption Input (solo para media / edición) -----------------
  const CaptionInput = (
    <View
      style={[
        styles.topTextWrap,
        { paddingTop: insets.top + (immersive ? 76 : 88), paddingBottom: 6 },
      ]}
    >
      <TextInput
        value={text}
        onChangeText={(t) => {
          let next = t;
          if (!isEdit && mode === "text" && next.length > 200) {
            next = next.slice(0, 200);
          }
          try {
            setText(
              typeof next.normalize === "function"
                ? next.normalize("NFC")
                : next
            );
          } catch {
            setText(next);
          }
        }}
        placeholder={
          mode === "text"
            ? "Escribe tu publicación (máx. 200 caracteres)…"
            : "¿Qué estás pensando?"
        }
        placeholderTextColor="rgba(255,255,255,0.9)"
        style={[
          styles.topText,
          {
            fontSize: immersive ? 16 : 14,
            lineHeight: LINE_HEIGHT_416,
            maxHeight: TEXT_MAX_HEIGHT_416,
          },
        ]}
        multiline
        numberOfLines={VISIBLE_LINES}
        scrollEnabled
        textAlignVertical="top"
        allowFontScaling={false}
        editable={!publishing}
      />
    </View>
  );

  const renderImage = () =>
    immersive ? (
      <>
        <View
          style={[
            styles.immersiveWrap,
            { paddingTop: (insets.top || 0) + 64, paddingBottom: 120 },
          ]}
        >
          <View
            style={[
              styles.immersiveFrame,
              { height: `${IMMERSIVE_HEIGHT_RATIO * 100}%` },
            ]}
          >
            <Image
              source={{ uri: picked!.uri }}
              style={styles.full}
              resizeMode="cover"
            />
          </View>
        </View>
        {CaptionInput}
      </>
    ) : (
      <>
        <Image
          source={{ uri: picked!.uri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        {CaptionInput}
      </>
    );

  const renderVideo = () =>
    immersive ? (
      <>
        <View
          style={[
            styles.immersiveWrap,
            { paddingTop: (insets.top || 0) + 64, paddingBottom: 120 },
          ]}
        >
          <View
            style={[
              styles.immersiveFrame,
              { height: `${IMMERSIVE_HEIGHT_RATIO * 100}%` },
            ]}
          >
            <Video
              ref={videoRef}
              source={{ uri: picked!.uri }}
              style={styles.full}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              onPlaybackStatusUpdate={onStatusUpdate}
              progressUpdateIntervalMillis={250}
            />
          </View>
        </View>
        {CaptionInput}
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
          progressUpdateIntervalMillis={250}
        />
        {CaptionInput}
      </>
    );

  const onBarLayout = (e: LayoutChangeEvent) =>
    setBarWidth(e.nativeEvent.layout.width);

  const onScrubGrantMove = (x: number) => {
    const w = Math.max(1, barWidth);
    seekToPct(x / w, durationMs);
  };

  return (
    <View style={styles.fill}>
      {Header}

      {/* --- MODO EDICIÓN SIN MEDIA: solo caption --- */}
      {isEdit && !picked && (
        <>
          <View style={StyleSheet.absoluteFill} />
          {CaptionInput}
        </>
      )}

      {/* --- NUEVO POST: sin media y modo MEDIA → menú de opciones --- */}
      {!isEdit && !picked && mode === "media" && (
        <PublishOptionsMenu
          onPickMedia={pickMedia}
          onCamera={pickMedia}
          onTextPlusFile={() => setMode("text")}
          onCollage={onCollage}
          menuBg={MENU_BG}
        />
      )}

      {/* --- NUEVO POST: modo TEXTO → Componente separado --- */}
      {!isEdit && mode === "text" && !picked && (
        <ComposeTextStyle
          value={{
            text: textRef.current || "",
            style: {
              // siempre partimos del default
              ...DEFAULT_TEXT_STYLE,
              // y pisamos con lo que haya en la ref
              color: styleRef.current.color || DEFAULT_TEXT_STYLE.color,
              fontSize:
                styleRef.current.fontSize ?? DEFAULT_TEXT_STYLE.fontSize,
              shadowColor:
                styleRef.current.shadowColor ?? DEFAULT_TEXT_STYLE.shadowColor,
              bubbleColor:
                styleRef.current.bubbleColor ?? DEFAULT_TEXT_STYLE.bubbleColor,
              fontFamily:
                styleRef.current.fontFamily ?? DEFAULT_TEXT_STYLE.fontFamily, // 👈 pasa la fuente al composer
            },
            bgKey:
              styleRef.current.bgKey || TEXT_POST_BACKGROUNDS[0].key,
            align: styleRef.current.align,
          }}
          backgrounds={TEXT_POST_BACKGROUNDS}
          maxLength={200}
          onChange={handleStyledChange}
        />
      )}

      {/* MEDIA */}
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

      {publishing && (
        <View style={styles.lottieOverlay}>
          <View style={styles.lottieCard}>
            <LottieView
              source={require("../assets/lottie/loader.json")}
              autoPlay
              loop
              style={{ width: 180, height: 180 }}
            />
            <Text style={styles.loadingTxt}>
              {isEdit ? "Guardando…" : "Publicando…"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// -------------------------------------------------------------
// bottom controls (para media)
// -------------------------------------------------------------
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
        <TouchableOpacity
          style={[styles.pill, styles.pillInverse]}
          onPress={toggleImmersive}
        >
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
        onResponderGrant={(e) =>
          onScrubGrantMove(e.nativeEvent.locationX || 0)
        }
        onResponderMove={(e) =>
          onScrubGrantMove(e.nativeEvent.locationX || 0)
        }
      >
        <View
          style={[
            styles.scrubFill,
            { width: `${Math.max(0, Math.min(1, pct)) * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

// -------------------------------------------------------------
// styles
// -------------------------------------------------------------
const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: BG },

  immersiveWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BG,
  },
  immersiveFrame: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 0,
  },
  full: { width: "100%", height: "100%" },

  topTextWrap: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  topText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: Platform.OS === "android" ? "600" : "800",
    textShadowColor: Platform.OS === "android" ? "transparent" : "#000",
    textShadowRadius: Platform.OS === "android" ? 0 : 6,
    textShadowOffset: { width: 0, height: 0 },
  },

  header: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  backBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  headerAvatarTight: {
    width: 35,
    height: 35,
    borderRadius: 14,
    marginLeft: 6,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 12,
  },
  pacific: {
    fontFamily: "Pacifico_400Regular",
    color: "#fff",
    fontSize: 20,
    includeFontPadding: false,
    textAlignVertical: "center",
    flexShrink: 1,
  },
  publishBtn: {
    marginLeft: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    backgroundColor: JADE,
    alignItems: "center",
    justifyContent: "center",
  },
  publishTxt: {
    color: "#111",
    fontFamily: "Pacifico_400Regular",
    fontSize: 16,
  },

  bottomWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  bottomPills: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  pillInverse: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  pillTxt: {
    color: "#fff",
    fontFamily: "Pacifico_400Regular",
    fontSize: 16,
  },
  scrubBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  scrubFill: { height: "100%", backgroundColor: JADE },

  lottieOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  lottieCard: {
    backgroundColor: "rgba(17,17,17,0.9)",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  loadingTxt: {
    color: "#fff",
    marginTop: 8,
    fontSize: 16,
    fontFamily: "Pacifico_400Regular",
  },
});
