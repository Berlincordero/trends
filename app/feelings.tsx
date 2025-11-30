// app/feelings.tsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { Video, ResizeMode } from "expo-av";

import {
  authGetMe,
  authGetProfile,
  BASE,
  Clip,
  fetchMyClip,
  isLikelyImageUrl,
  toAbsolute,
} from "../lib/api";

export default function FeelingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [me, setMe] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [avatar, setAvatar] = useState<string | null>(null);
  const [clip, setClip] = useState<Clip | null>(null);

  const [loading, setLoading] = useState(true);
  const [fontsLoaded] = useFonts({ Pacifico_400Regular });

  useEffect(() => {
    (async () => {
      try {
        const [u, p] = await Promise.all([authGetMe(), authGetProfile()]);
        setMe(u);
        setProfile(p);

        const raw = p?.avatar ?? u?.avatar ?? null;
        if (raw) {
          const uri = String(raw).startsWith("http")
            ? raw
            : `${BASE}/media/${raw}`;
          setAvatar(uri);
        } else {
          setAvatar(null);
        }

        // cargar último clip de vibes (si existe)
        try {
          const c = await fetchMyClip();
          setClip(c ?? null);
        } catch {
          setClip(null);
        }
      } catch (e) {
        setAvatar(null);
        setClip(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const displayName =
    profile?.display_name ||
    profile?.name ||
    me?.name ||
    me?.username ||
    me?.nick ||
    "";

  const clipMediaAbs = useMemo(() => {
    if (!clip?.media) return null;
    return toAbsolute(clip.media) || clip.media;
  }, [clip]);

  const hasClip = !!clipMediaAbs;

  const handlePressAvatar = useCallback(() => {
    // Si ya hay clip → abrir reproductor tipo historias
    if (hasClip && clipMediaAbs) {
      router.push({
        pathname: "/vibesplayer",
        params: { media: clipMediaAbs },
      });
      return;
    }
    // Si no hay clip → ir a vibescompose para subir uno nuevo
    router.push("/vibescompose");
  }, [hasClip, clipMediaAbs, router]);

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header con back + título */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>Clips Stories</Text>
      </View>

      {/* Subtítulo superior */}
      <Text style={styles.subtitle}> Vibes</Text>

      {/* Círculo (Vibes) con gradient suave + texto dentro */}
      <View style={styles.avatarWrapper}>
        <LinearGradient
          style={styles.playerCircle}
          colors={["#6FD9C5", "#A1C4FD"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.playerCircleText}>Cual es tu vibra hoy 🌴🥥</Text>
        </LinearGradient>

        {/* Burbuja: si hay clip → preview (imagen o video mudo); si no → avatar o placeholder */}
        <TouchableOpacity
          style={styles.avatarBubble}
          activeOpacity={0.9}
          onPress={handlePressAvatar}
        >
          {hasClip && clipMediaAbs ? (
            isLikelyImageUrl(clipMediaAbs) ? (
              <Image source={{ uri: clipMediaAbs }} style={styles.avatarImage} />
            ) : (
              <Video
                source={{ uri: clipMediaAbs }}
                style={styles.avatarImage}
                resizeMode={ResizeMode.COVER}
                isMuted
                shouldPlay
                isLooping
              />
            )
          ) : avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
              <Ionicons name="add" size={24} color="#000" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Bloque con nombre + seguidores */}
      {!!displayName && (
        <View style={styles.userBlock}>
          <Text style={styles.userName} numberOfLines={1}>
            {displayName}
          </Text>

          <View style={styles.followRow}>
            <Ionicons
              name="people"
              size={16}
              color="#ffffff"
              style={styles.followIcon}
            />
            <Text style={styles.followText}>Seguidores: 125</Text>
          </View>
        </View>
      )}

      {/* Sección Rails Travel con título + Lottie justo al lado */}
      <View style={styles.railsRow}>
        <Text style={styles.railsTitle}>Rails Trip</Text>

        {/* Lottie de estrellitas pegado al texto */}
        <LottieView
          source={require("../assets/lottie/stars.json")}
          autoPlay
          loop
          style={styles.railsLottie}
        />
      </View>

      {/* Card mediano debajo de Rails Travel con avatar en el borde */}
      <View style={styles.travelCardWrapper}>
        <View style={styles.travelCard}>
          <Text style={styles.travelCardTitle}>Tu próximo viaje</Text>
          <Text style={styles.travelCardSubtitle}>
            Guarda o crea un nuevo rail de tu próxima aventura. Compártenos
            fotos o pequeños clips de tus viajes favoritos. Visita partes de tu
            ciudad o del mundo o simplemente lugares que te gusten y
            compártenos tus experiencias durante 24 horas. 😊 🚗 🗺️ ✈️
          </Text>

          {/* Fila de botones dentro del card */}
          <View style={styles.cardButtonsRow}>
            <TouchableOpacity
              style={styles.createRailsButton}
              activeOpacity={0.85}
              onPress={() => {
                // Aquí puedes navegar a la creación de Rails
                // router.push("/rails/create");
              }}
            >
              <Ionicons
                name="add"
                size={18}
                color="#000"
                style={styles.createRailsIcon}
              />
              <Text style={styles.createRailsButtonText}>Subir Rails</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.createRailsButton, styles.openCameraButton]}
              activeOpacity={0.85}
              onPress={() => {
                // Aquí puedes abrir la cámara
                // router.push("/camera");
              }}
            >
              <Ionicons
                name="add"
                size={18}
                color="#000"
                style={styles.createRailsIcon}
              />
              <Text style={styles.createRailsButtonText}>Abrir cámara</Text>
            </TouchableOpacity>
          </View>
        </View>

        {avatar && (
          <View style={styles.travelCardAvatar}>
            <Image
              source={{ uri: avatar }}
              style={styles.travelCardAvatarImage}
            />
          </View>
        )}
      </View>
    </View>
  );
}

// ========================
// Tamaños de los círculos
// ========================

const AVATAR_SIZE = 130; // círculo grande (mini player)
const INNER_AVATAR_SIZE = 62; // burbuja del avatar superior

// Avatar del card
const CARD_AVATAR_SIZE = 62;

// Altura mínima del card de viaje
const TRAVEL_CARD_MIN_HEIGHT = 260; // card alto

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    width: "100%",
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
  title: {
    fontFamily: "Pacifico_400Regular",
    color: "#6FD9C5",
    fontSize: 24,
  },
  subtitle: {
    fontFamily: "Pacifico_400Regular",
    color: "#ffffff",
    fontSize: 22,
    marginTop: 12,
    marginBottom: 24,
  },

  avatarWrapper: {
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  playerCircle: {
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  playerCircleText: {
    fontFamily: "Pacifico_400Regular",
    fontSize: 18,
    color: "#ffffff",
    textAlign: "center",
  },

  avatarBubble: {
    position: "absolute",
    right: -INNER_AVATAR_SIZE * 0.15,
    bottom: -INNER_AVATAR_SIZE * 0.4,
    width: INNER_AVATAR_SIZE,
    height: INNER_AVATAR_SIZE,
    borderRadius: INNER_AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: "#000",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: INNER_AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    backgroundColor: "#6FD9C5",
    alignItems: "center",
    justifyContent: "center",
  },

  // Bloque nombre + seguidores
  userBlock: {
    marginTop: 32,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  userName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  followRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  followIcon: {
    marginRight: 6,
  },
  followText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
  },

  // Fila de "Rails Trip" + Lottie al lado
  railsRow: {
    marginTop: 40,
    width: "100%",
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  railsTitle: {
    fontFamily: "Pacifico_400Regular",
    color: "#ffffff",
    fontSize: 20,
    marginRight: 8,
  },

  railsLottie: {
    width: 48,
    height: 48,
  },

  // Card mediano para Rails Travel
  travelCardWrapper: {
    marginTop: 60,
    width: "100%",
    paddingHorizontal: 24,
    alignItems: "center",
    position: "relative",
  },
  travelCard: {
    width: "100%",
    minHeight: TRAVEL_CARD_MIN_HEIGHT,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    padding: 14,
    justifyContent: "center",
  },
  travelCardTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  travelCardSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    marginBottom: 16,
  },

  cardButtonsRow: {
    flexDirection: "row",
    marginTop: 4,
  },

  createRailsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  openCameraButton: {
    marginLeft: 8,
  },
  createRailsIcon: {
    marginRight: 6,
  },
  createRailsButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "700",
  },

  travelCardAvatar: {
    position: "absolute",
    right: 32,
    top: -CARD_AVATAR_SIZE * 0.4,
    width: CARD_AVATAR_SIZE,
    height: CARD_AVATAR_SIZE,
    borderRadius: CARD_AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: "#000",
    overflow: "hidden",
  },
  travelCardAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: CARD_AVATAR_SIZE / 2,
  },
});
