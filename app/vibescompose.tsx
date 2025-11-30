// app/vibescompose.tsx
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Audio, Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import { authGetProfile, BASE, publishClip } from "../lib/api";
import { MUSIC_TRACKS, type MusicTrack } from "./music";

type Picked =
  | { kind: "image"; uri: string }
  | { kind: "video"; uri: string }
  | null;

const BG = "#000";
const JADE = "#6FD9C5";
const PREVIEW_CARD_HEIGHT = 420;

export default function VibesComposeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isIOS = Platform.OS === "ios";

  const [fontsLoaded] = useFonts({
    Pacifico_400Regular,
  });

  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<Picked>(null);
  const [uploading, setUploading] = useState(false);

  // texto en la burbuja
  const [textBubble, setTextBubble] = useState("");
  const [showTextBubble, setShowTextBubble] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);

  // refs
  const scrollRef = useRef<ScrollView | null>(null);
  const textInputRef = useRef<TextInput | null>(null);

  // música
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // cargar avatar
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

  // limpiar sonido al desmontar
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const handlePickMedia = useCallback(async () => {
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

    // reset burbuja
    setTextBubble("");
    setShowTextBubble(false);
    setIsEditingText(false);
  }, []);

  // reproducir / parar canción
  const handleSelectTrack = useCallback(
    async (track: MusicTrack | null) => {
      setSelectedTrack(track);

      // sincronizar con AsyncStorage
      try {
        if (track) {
          await AsyncStorage.setItem("selectedMusicTrackId", track.id);
        } else {
          await AsyncStorage.removeItem("selectedMusicTrackId");
        }
      } catch (e) {
        console.warn("Error guardando música seleccionada", e);
      }

      // detener sonido anterior
      try {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
      } catch (e) {
        console.warn("Error al detener sonido anterior", e);
      }

      if (!track) return;

      try {
        const { sound } = await Audio.Sound.createAsync(track.file, {
          shouldPlay: true,
          isLooping: true,
        });
        soundRef.current = sound;
      } catch (e) {
        console.warn("Error al cargar sonido", e);
        Alert.alert("Error", "No se pudo reproducir esta canción.");
      }
    },
    []
  );

  // leer canción guardada cada vez que la pantalla se enfoca
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const id = await AsyncStorage.getItem("selectedMusicTrackId");
          const track = id
            ? MUSIC_TRACKS.find((t) => t.id === id) ?? null
            : null;
          await handleSelectTrack(track);
        } catch (e) {
          console.warn("Error leyendo música seleccionada", e);
        }
      })();

      // opcional: al salir de esta pantalla, parar audio
      return () => {
        if (soundRef.current) {
          soundRef.current.stopAsync().catch(() => {});
        }
      };
    }, [handleSelectTrack])
  );

  const handlePublish = useCallback(
    async () => {
      if (uploading) return;
      if (!picked) {
        Alert.alert(
          "Selecciona algo",
          "Elige una imagen o un video para tu vibra."
        );
        return;
      }

      try {
        setUploading(true);
        let file: { uri: string; name?: string; type?: string };

        if (picked.kind === "image") {
          file = { uri: picked.uri, type: "image/jpeg", name: "vibe.jpg" };
        } else {
          file = { uri: picked.uri, type: "video/mp4", name: "vibe.mp4" };
        }

        await publishClip(file);
        Alert.alert("Listo", "Tu vibra se publicó correctamente.");
        router.back();
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "No se pudo publicar la vibra");
        setUploading(false);
      }
    },
    [picked, uploading, router]
  );

  if (loading || !fontsLoaded) {
    return (
      <View style={[styles.fill, styles.center]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  const scrollContent = (
    <ScrollView
      ref={scrollRef}
      style={styles.fill}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          disabled={uploading}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Image
          source={
            avatar
              ? { uri: avatar }
              : require("../assets/images/avatar_neutral.png")
          }
          style={styles.headerAvatar}
        />
        <Text style={styles.headerTitle}>Nueva vibra</Text>
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        <Text style={styles.title}>Crea tu vibe del día ✨</Text>
        <Text style={styles.subtitle}>
          Sube una foto o un video, compártenos tu esencia de hoy y crea una
          vibra única ✨.
        </Text>

        {/* Card preview */}
        <View style={styles.previewCard}>
          {!picked && (
            <View style={styles.previewPlaceholderWrap}>
              <Text style={styles.previewPlaceholder}>
                Aquí verás la vista previa{"\n"}de tu foto o video
              </Text>

              {/* botón + para subir foto/video dentro del card */}
              <TouchableOpacity
                style={styles.cardPickBtn}
                activeOpacity={0.9}
                onPress={handlePickMedia}
                disabled={uploading}
              >
                <Ionicons name="add" size={22} color="#000" />
              </TouchableOpacity>
            </View>
          )}

          {picked && (
            <View style={styles.previewMediaWrapper}>
              {picked.kind === "image" ? (
                <Image
                  source={{ uri: picked.uri }}
                  style={styles.previewMedia}
                  resizeMode="contain"
                />
              ) : (
                <Video
                  source={{ uri: picked.uri }}
                  style={styles.previewMedia}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  useNativeControls
                  isMuted={!!selectedTrack}
                />
              )}

              {/* Burbuja de texto */}
              {showTextBubble && (
                <View
                  style={[
                    styles.textBubble,
                    isEditingText && styles.textBubbleEditing,
                  ]}
                >
                  <TextInput
                    ref={textInputRef}
                    style={styles.textBubbleInput}
                    value={textBubble}
                    onChangeText={setTextBubble}
                    placeholder="Escribe algo..."
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    multiline
                    numberOfLines={3}
                    scrollEnabled
                    onFocus={() => {
                      setIsEditingText(true);
                      setTimeout(() => {
                        scrollRef.current?.scrollToEnd({ animated: true });
                      }, 50);
                    }}
                    onBlur={() => {
                      setIsEditingText(false);
                    }}
                  />
                </View>
              )}

              {/* botón flotante + dentro del card para cambiar foto/video */}
              <TouchableOpacity
                style={styles.cardPickFloating}
                activeOpacity={0.9}
                onPress={handlePickMedia}
                disabled={uploading}
              >
                <Ionicons name="add" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Música seleccionada */}
        {selectedTrack && (
          <View style={styles.selectedMusic}>
            <Image
              source={selectedTrack.cover}
              style={styles.selectedMusicAvatar}
            />

            <Text style={styles.selectedMusicText}>{selectedTrack.title}</Text>

            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => handleSelectTrack(null)}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Botones inferiores */}
        <View style={styles.buttonsRow}>
          {/* herramientas: A, tijeras, música, # */}
          <View style={styles.toolsRow}>
            {/* A */}
            <TouchableOpacity
              style={styles.toolBtn}
              activeOpacity={0.9}
              onPress={() => {
                if (!picked) {
                  Alert.alert(
                    "Primero agrega una foto o video",
                    "Para agregar texto necesitas seleccionar una imagen o video."
                  );
                  return;
                }
                if (showTextBubble) {
                  setShowTextBubble(false);
                  setIsEditingText(false);
                  textInputRef.current?.blur();
                  return;
                }
                setShowTextBubble(true);
                setTimeout(() => {
                  textInputRef.current?.focus();
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 40);
                }, 20);
              }}
              disabled={uploading}
            >
              <Text style={styles.toolBtnText}>A</Text>
            </TouchableOpacity>

            {/* Tijeras */}
            <TouchableOpacity
              style={styles.toolBtn}
              activeOpacity={0.9}
              onPress={() =>
                Alert.alert(
                  "Recortar",
                  "Aquí podrás recortar tu foto o video. ✂️"
                )
              }
              disabled={uploading}
            >
              <Ionicons name="cut-outline" size={16} color="#fff" />
            </TouchableOpacity>

            {/* Música: abre la pantalla music.tsx */}
            <TouchableOpacity
              style={styles.toolBtn}
              activeOpacity={0.9}
              onPress={() => router.push("/music")}
              disabled={uploading}
            >
              <Ionicons name="musical-notes-outline" size={16} color="#fff" />
            </TouchableOpacity>

            {/* # */}
            <TouchableOpacity
              style={styles.toolBtn}
              activeOpacity={0.9}
              onPress={() =>
                Alert.alert(
                  "Hashtags",
                  "Aquí podrás agregar hashtags a tu vibra. #️⃣"
                )
              }
              disabled={uploading}
            >
              <Text style={styles.toolBtnText}>#</Text>
            </TouchableOpacity>
          </View>

          {/* solo botón de publicar, centrado y más delgado */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.publishBtn,
                (!picked || uploading) && { opacity: 0.5 },
              ]}
              activeOpacity={0.9}
              onPress={handlePublish}
              disabled={!picked || uploading}
            >
              <Text style={styles.publishText}>
                {uploading ? "Publicando…" : "Publicar vibe"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.fill}>
      {isIOS ? (
        <KeyboardAvoidingView
          style={styles.fill}
          behavior="padding"
          keyboardVerticalOffset={insets.top + 16}
        >
          {scrollContent}
        </KeyboardAvoidingView>
      ) : (
        scrollContent
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: BG,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  headerTitle: {
    fontFamily: "Pacifico_400Regular",
    color: "#fff",
    fontSize: 20,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
  },
  title: {
    fontFamily: "Pacifico_400Regular",
    color: "#fff",
    fontSize: 24,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  previewCard: {
    width: "100%",
    height: PREVIEW_CARD_HEIGHT,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    marginBottom: 24,
  },
  previewMediaWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  previewMedia: {
    width: "100%",
    height: "100%",
  },
  previewPlaceholderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  previewPlaceholder: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    textAlign: "center",
  },
  // botón + dentro del card (estado sin media)
  cardPickBtn: {
    marginTop: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  // botón + flotante dentro del card (cuando ya hay media)
  cardPickFloating: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.9,
  },
  textBubble: {
    position: "absolute",
    alignSelf: "center",
    maxWidth: "70%",
    minWidth: "40%",
    bottom: 24,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  textBubbleEditing: {
    bottom: PREVIEW_CARD_HEIGHT * 0.88,
  },
  textBubbleInput: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    textAlignVertical: "top",
    maxHeight: 60,
  },
  selectedMusic: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  selectedMusicAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  selectedMusicText: {
    color: "#fff",
    fontSize: 13,
    marginRight: 8,
  },
  buttonsRow: {
    marginTop: 8,
    width: "100%",
    marginBottom: 8,
  },
  toolsRow: {
    flexDirection: "row",
    justifyContent: "center",
    columnGap: 8,
    marginBottom: 12,
  },
  toolBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  toolBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  // fila del botón de publicar (centrado)
  actionsRow: {
    width: "100%",
    alignItems: "center",
  },
  // botón de publicar: fondo transparente, borde blanco, texto blanco
  publishBtn: {
    paddingHorizontal: 28,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#fff",
    backgroundColor: "transparent",
  },
  publishText: {
    color: "#fff",
    fontFamily: "Pacifico_400Regular",
    fontSize: 14,
  },
});
