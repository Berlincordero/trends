// app/vibescompose.tsx
import React, { useCallback, useEffect, useState } from "react";
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
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Pacifico_400Regular } from "@expo-google-fonts/pacifico";

import { authGetProfile, BASE, publishClip } from "../lib/api";

type Picked =
  | { kind: "image"; uri: string }
  | { kind: "video"; uri: string }
  | null;

const BG = "#000";
const JADE = "#6FD9C5";

// 👉 altura del card de preview (ajusta aquí si quieres más / menos alto)
const PREVIEW_CARD_HEIGHT = 420;

export default function VibesComposeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Pacifico_400Regular });

  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<Picked>(null);
  const [uploading, setUploading] = useState(false);

  // 👉 texto en la burbuja
  const [textBubble, setTextBubble] = useState("");
  // 👉 mostrar / ocultar la burbuja
  const [showTextBubble, setShowTextBubble] = useState(false);

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

    // 👉 cuando cambias de media se resetea la burbuja
    setTextBubble("");
    setShowTextBubble(false);
  }, []);

  const handlePublish = useCallback(async () => {
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
        file = {
          uri: picked.uri,
          type: "image/jpeg",
          name: "vibe.jpg",
        };
      } else {
        file = {
          uri: picked.uri,
          type: "video/mp4",
          name: "vibe.mp4",
        };
      }

      // TODO: si quieres enviar también el texto de la burbuja al backend,
      // aquí podrías incluir "textBubble" en el payload.
      await publishClip(file);
      Alert.alert("Listo", "Tu vibra se publicó correctamente.");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo publicar la vibra");
      setUploading(false);
    }
  }, [picked, uploading, router]);

  if (loading || !fontsLoaded) {
    return (
      <View style={[styles.fill, styles.center]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      // 👉 offset en iOS para no tapar el header
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 16 : 0}
    >
      <ScrollView
        style={styles.fill}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24, // 👉 espacio extra abajo, pero sin dejar huecos blancos
        }}
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

          {/* CARD de preview */}
          <View style={styles.previewCard}>
            {!picked && (
              <View style={styles.previewPlaceholderWrap}>
                <Text style={styles.previewPlaceholder}>
                  Aquí verás la vista previa{"\n"}de tu foto o video
                </Text>
              </View>
            )}

            {picked && (
              <View style={styles.previewMediaWrapper}>
                {picked.kind === "image" ? (
                  <Image
                    source={{ uri: picked.uri }}
                    style={styles.previewMedia}
                    resizeMode="contain" // 👉 siempre se ve la imagen completa
                  />
                ) : (
                  <Video
                    source={{ uri: picked.uri }}
                    style={styles.previewMedia}
                    resizeMode={ResizeMode.CONTAIN} // 👉 siempre se ve el video completo
                    shouldPlay
                    useNativeControls
                  />
                )}

                {/* 👉 Burbuja de texto sobre la imagen / video */}
                {showTextBubble && (
                  <View style={styles.textBubble}>
                    <TextInput
                      style={styles.textBubbleInput}
                      value={textBubble}
                      onChangeText={setTextBubble}
                      placeholder="Escribe algo..."
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      multiline
                      numberOfLines={2}        // 👉 altura base pensada para ~2 líneas
                      scrollEnabled={true}     // 👉 si hay más texto, se hace scroll dentro
                    />
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Botones */}
          <View style={styles.buttonsRow}>
            {/* Fila de herramientas: A, tijeras, música, # */}
            <View style={styles.toolsRow}>
              {/* A: abre/activa la burbuja */}
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
                  setShowTextBubble(true);
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
                <Ionicons
                  name="cut-outline"
                  size={16}
                  color="#fff"
                />
              </TouchableOpacity>

              {/* Música */}
              <TouchableOpacity
                style={styles.toolBtn}
                activeOpacity={0.9}
                onPress={() =>
                  Alert.alert(
                    "Música",
                    "Aquí podrás agregar música a tu vibra. 🎵"
                  )
                }
                disabled={uploading}
              >
                <Ionicons
                  name="musical-notes-outline"
                  size={16}
                  color="#fff"
                />
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

            {/* Fila con elegir foto / video y publicar */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.pickBtn}
                activeOpacity={0.9}
                onPress={handlePickMedia}
                disabled={uploading}
              >
                <Ionicons name="images" size={18} color="#000" />
                <Text style={styles.pickBtnText}>Elegir foto / video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.publishBtn,
                  (!picked || uploading) && { opacity: 0.6 },
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: BG, // 👉 MUY importante: fondo negro en toda la pantalla
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

  // CARD de preview
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
    justifyContent: "center", // centra el media
    alignItems: "center",
    backgroundColor: "#000", // 👉 color de fondo del área de preview
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

  // 👉 burbuja de texto (más corta, centrada, con scroll si hay mucho texto)
  textBubble: {
    position: "absolute",
    alignSelf: "center",     // 👉 centrada horizontalmente
    maxWidth: "70%",         // 👉 ancho máx. (pon 60%, 50% para hacerla más corta)
    minWidth: "40%",         // 👉 ancho mínimo
    bottom: 24,              // 👉 distancia desde abajo del video/imagen
    paddingHorizontal: 10,   // 👉 padding horizontal dentro de la burbuja
    paddingVertical: 4,      // 👉 padding vertical
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)", // 👉 color de fondo de la burbuja
  },
  textBubbleInput: {
    color: "#fff",           // 👉 color del texto
    fontSize: 14,            // 👉 tamaño de letra en el preview
    textAlign: "center",
    textAlignVertical: "top",
    maxHeight: 40,           // 👉 altura máx. (~2 líneas)
  },

  buttonsRow: {
    marginTop: 8,
    width: "100%",
    marginBottom: 8,
  },

  // 👉 fila de herramientas (A, tijeras, música, #)
  toolsRow: {
    flexDirection: "row",
    justifyContent: "center",
    columnGap: 8, // 👉 espacio horizontal entre los botones pequeños
    marginBottom: 8,
  },

  // 👉 botón pequeño de herramienta
  toolBtn: {
    width: 32, // 👉 tamaño del botón (ancho)
    height: 32, // 👉 tamaño del botón (alto)
    borderRadius: 16, // 👉 radio para hacerlo circular
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)", // 👉 color del borde de los botones pequeños
    backgroundColor: "rgba(255,255,255,0.06)", // 👉 color de fondo del botón
    alignItems: "center",
    justifyContent: "center",
  },

  // 👉 texto dentro de los botones pequeños (A y #)
  toolBtnText: {
    color: "#fff", // 👉 color del texto
    fontSize: 16, // 👉 tamaño de letra de A y #
    fontWeight: "700",
  },

  actionsRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: 4,
    columnGap: 8, // si da error, quita esto y usa marginRight en pickBtn
  },

  // 👉 botón elegir foto / video
  pickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff", // 👉 color de fondo del botón
    borderRadius: 999,
    paddingHorizontal: 10, // 👉 padding horizontal
    paddingVertical: 8, // 👉 padding vertical
  },
  pickBtnText: {
    color: "#000", // 👉 color del texto
    fontWeight: "700",
    fontSize: 12, // 👉 tamaño de fuente del texto
    marginLeft: 6,
  },

  // 👉 botón publicar vibe
  publishBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: JADE, // 👉 color de fondo del botón publicar
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  publishText: {
    color: "#111", // 👉 color del texto del botón publicar
    fontFamily: "Pacifico_400Regular",
    fontSize: 14, // 👉 tamaño de fuente del texto publicar
  },
});
