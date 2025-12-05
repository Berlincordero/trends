// app/feelings.tsx
import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
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
  fetchVibesFeed,
  isLikelyImageUrl,
  toAbsolute,
} from "../lib/api";

const BG = "#000";

// tamaño base más pequeño
const BUBBLE_SIZE = 110;
const AVATAR_OVERLAY_SIZE = 38;

// Avatar del card "Tu próximo viaje"
const CARD_AVATAR_SIZE = 62;

// Altura mínima del card de viaje
// 🔧 Sube este valor para hacerlo más alto, bájalo para hacerlo más bajo.
const TRAVEL_CARD_MIN_HEIGHT = 320;

// ancho efectivo de cada ítem del carrusel (burbuja + margen)
const BUBBLE_ITEM_WIDTH = BUBBLE_SIZE + 18;

type VibeItem = {
  clip: Clip | null;
  authorId: number | "me";
  username: string;
  avatarUri: string | null;
  isMe: boolean;
};

/**
 * Normaliza cualquier ruta de avatar:
 * - http(s)://...
 * - "avatars/xxx.jpg"
 * - "/media/avatars/xxx.jpg"
 */
function resolveAvatarUri(raw?: string | null): string | null {
  if (!raw) return null;
  const v = raw.trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;

  let p = v.replace(/^\/+/, ""); // quita "/" inicial
  if (p.startsWith("media/")) {
    // ya viene con "media/..."
    return `${BASE}/${p}`;
  }
  // solo subruta dentro de /media
  return `${BASE}/media/${p}`;
}

export default function FeelingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [me, setMe] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [avatar, setAvatar] = useState<string | null>(null);
  const [myClip, setMyClip] = useState<Clip | null>(null);

  const [vibes, setVibes] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVibes, setLoadingVibes] = useState(true);

  const [fontsLoaded] = useFonts({ Pacifico_400Regular });

  // valor animado del scroll horizontal
  const scrollX = useRef(new Animated.Value(0)).current;

  const loadEverything = useCallback(async () => {
    setLoading(true);
    setLoadingVibes(true);
    try {
      // Usuario + perfil
      try {
        const [u, p] = await Promise.all([authGetMe(), authGetProfile()]);
        setMe(u);
        setProfile(p);

        const raw =
          (p && (p.avatar || p.avatar_url)) ||
          (u && (u.avatar || u.avatar_url)) ||
          null;
        setAvatar(resolveAvatarUri(raw));
      } catch {
        setMe(null);
        setProfile(null);
        setAvatar(null);
      }

      // Mi último clip (para mi burbuja principal)
      try {
        const c = await fetchMyClip();
        setMyClip(c ?? null);
      } catch {
        setMyClip(null);
      }

      // Feed global de vibes (para las demás burbujas)
      try {
        const feed = await fetchVibesFeed(48, 0);
        setVibes(feed ?? []);
      } catch {
        setVibes([]);
      }
    } finally {
      setLoading(false);
      setLoadingVibes(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEverything();
    }, [loadEverything])
  );

  const displayName =
    profile?.display_name ||
    profile?.name ||
    me?.name ||
    me?.username ||
    me?.nick ||
    "";

  const myUserId = me?.id ?? null;

  // Construimos los ítems del carrusel:
  // - Primero la burbuja del usuario actual
  // - Luego 1 burbuja por cada autor distinto del feed global
  const vibeItems: VibeItem[] = useMemo(() => {
    const items: VibeItem[] = [];

    // 1) Mi propia burbuja
    items.push({
      clip: myClip,
      authorId: myUserId ?? "me",
      username: displayName || (me?.username ?? "Yo"),
      avatarUri: avatar,
      isMe: true,
    });

    // 2) Burbujas de otros autores (solo 1 clip por autor)
    const byAuthor = new Map<number, Clip>();
    for (const c of vibes) {
      const authorId = c.author?.id ?? (c as any).author_id;
      if (!authorId) continue;
      if (myUserId && authorId === myUserId) {
        // ya lo mostramos en la primera burbuja
        continue;
      }
      if (!byAuthor.has(authorId)) {
        byAuthor.set(authorId, c);
      }
    }

    for (const [authorId, c] of byAuthor.entries()) {
      // soportamos varias formas posibles de venir del backend:
      const rawAvatar =
        (c as any).author?.avatar ??
        (c as any).author_avatar ??
        (c as any).avatar ??
        null;

      const authorAvatar = resolveAvatarUri(rawAvatar);

      items.push({
        clip: c,
        authorId,
        username: c.author?.username ?? (c as any).author_username ?? "Usuario",
        avatarUri: authorAvatar,
        isMe: false,
      });
    }

    return items;
  }, [myClip, myUserId, displayName, me?.username, avatar, vibes]);

  const handlePressBubble = useCallback(
    (item: VibeItem) => {
      // Si es mi burbuja y no tengo clip publicado todavía → ir a composer
      if (item.isMe && !item.clip) {
        router.push("/vibescompose");
        return;
      }

      const clip = item.clip;
      if (!clip?.media) return;

      const abs = toAbsolute(clip.media) || clip.media;

      // userId para que VibesPlayer pueda hacer el carrusel de ese autor
      let targetUserId: number | null = null;

      if (item.isMe && myUserId) {
        targetUserId = myUserId;
      } else if (typeof item.authorId === "number") {
        targetUserId = item.authorId;
      } else if (clip.author?.id) {
        targetUserId = clip.author.id;
      }

      const params: Record<string, string> = {
        media: abs,
        clipId: String(clip.id),
      };
      if (targetUserId != null) {
        params.userId = String(targetUserId);
      }

      router.push({
        pathname: "/vibesplayer",
        params,
      });
    },
    [router, myUserId]
  );

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

        <Text style={styles.headerTitle}>Clips Stories</Text>
      </View>

      {/* Subtítulo superior */}
      <Text style={styles.vibesTitle}>Vibes</Text>

      {/* Carrusel de burbujas (mi vibra + demás usuarios) */}
      <View style={styles.bubblesRow}>
        {loadingVibes && !myClip ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bubblesScroll}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
          >
            {vibeItems.map((item, index) => {
              const clip = item.clip;
              const mediaAbs = clip?.media
                ? toAbsolute(clip.media) || clip.media
                : null;
              const isImg = mediaAbs ? isLikelyImageUrl(mediaAbs) : false;

              // escala según la posición en el scroll
              const inputRange = [
                (index - 1) * BUBBLE_ITEM_WIDTH,
                index * BUBBLE_ITEM_WIDTH,
                (index + 1) * BUBBLE_ITEM_WIDTH,
              ];

              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.8, 1.0, 0.8],
                extrapolate: "clamp",
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.7, 1, 0.7],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={`${item.isMe ? "me" : item.authorId}-${clip?.id ?? "none"}`}
                  style={[
                    styles.bubbleItem,
                    { transform: [{ scale }], opacity },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handlePressBubble(item)}
                  >
                    <LinearGradient
                      colors={["#6FD9C5", "#A1C4FD"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.bubbleOuter}
                    >
                      <View style={styles.bubbleInner}>
                        {mediaAbs && clip ? (
                          isImg ? (
                            <Image
                              source={{ uri: mediaAbs }}
                              style={styles.bubbleMedia}
                            />
                          ) : (
                            <Video
                              source={{ uri: mediaAbs }}
                              style={styles.bubbleMedia}
                              resizeMode={ResizeMode.COVER}
                              isMuted
                              shouldPlay
                              isLooping
                            />
                          )
                        ) : (
                          <Text style={styles.bubblePlaceholderText}>
                            {item.isMe
                              ? "Cuál es tu vibra hoy 🌴🥥"
                              : "Nueva vibra ✨"}
                          </Text>
                        )}
                      </View>

                      {/* Avatar pequeño como botón independiente */}
                      <TouchableOpacity
                        style={styles.bubbleAvatarWrap}
                        activeOpacity={0.9}
                        onPress={() => {
                          if (item.isMe) {
                            // Tocar TU avatar -> siempre abre VibesCompose
                            router.push("/vibescompose");
                          } else {
                            // Otros usuarios -> comportarse como antes (abre player)
                            handlePressBubble(item);
                          }
                        }}
                      >
                        {item.avatarUri ? (
                          <Image
                            source={{ uri: item.avatarUri }}
                            style={styles.bubbleAvatar}
                          />
                        ) : (
                          <Image
                            source={require("../assets/images/avatar_neutral.png")}
                            style={styles.bubbleAvatar}
                          />
                        )}
                      </TouchableOpacity>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Nombre del autor */}
                  <Text style={styles.bubbleUsername} numberOfLines={1}>
                    {item.username}
                  </Text>

                  {/* Seguidores en común + 2 avatares pequeñitos (mock) */}
                  <View style={styles.commonWrapper}>
                    <Text style={styles.commonText} numberOfLines={1}>
                      Seguidores en común
                    </Text>
                    <View style={styles.commonAvatarsRow}>
                      <Image
                        source={require("../assets/images/avatar_neutral.png")}
                        style={styles.commonAvatarMini}
                      />
                      <Image
                        source={require("../assets/images/avatar_neutral.png")}
                        style={[styles.commonAvatarMini, { marginLeft: -6 }]}
                      />
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </Animated.ScrollView>
        )}
      </View>

      {/* Sección Rails Trip con título + Lottie justo al lado */}
      <View style={styles.railsRow}>
        <Text style={styles.railsTitle}>Rails Trip</Text>
        <LottieView
          source={require("../assets/lottie/stars.json")}
          autoPlay
          loop
          style={styles.railsLottie}
        />
      </View>

      {/* Card mediano debajo de Rails Trip con avatar en el borde */}
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

          {/* Ícono de estrella debajo de los botones */}
          <View style={styles.favoriteStarContainer}>
            <Ionicons name="star" size={24} color="#FFD700" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: BG,
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
  headerTitle: {
    fontFamily: "Pacifico_400Regular",
    color: "#6FD9C5",
    fontSize: 24,
  },
  vibesTitle: {
    fontFamily: "Pacifico_400Regular",
    color: "#ffffff",
    fontSize: 22,
    marginTop: 12,
    marginBottom: 16,
  },

  /* Carrusel de burbujas */
  bubblesRow: {
    width: "100%",
  },
  bubblesScroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  bubbleItem: {
    alignItems: "center",
    marginRight: 18,
  },
  bubbleOuter: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleInner: {
    width: BUBBLE_SIZE - 10,
    height: BUBBLE_SIZE - 10,
    borderRadius: (BUBBLE_SIZE - 10) / 2,
    backgroundColor: "#000",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleMedia: {
    width: "100%",
    height: "100%",
  },
  bubblePlaceholderText: {
    color: "#ffffff",
    fontSize: 13,
    textAlign: "center",
  },
  bubbleAvatarWrap: {
    position: "absolute",
    right: -AVATAR_OVERLAY_SIZE * 0.1,
    bottom: -AVATAR_OVERLAY_SIZE * 0.1,
    width: AVATAR_OVERLAY_SIZE,
    height: AVATAR_OVERLAY_SIZE,
    borderRadius: AVATAR_OVERLAY_SIZE / 2,
    borderWidth: 2,
    borderColor: "#000",
    backgroundColor: "#000",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: AVATAR_OVERLAY_SIZE / 2,
  },
  bubbleUsername: {
    marginTop: 6,
    color: "#ffffff",
    fontSize: 11,
    maxWidth: BUBBLE_SIZE + 10,
    textAlign: "center",
  },

  // Seguidores en común
  commonWrapper: {
    marginTop: 2,
    alignItems: "center",
  },
  commonText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
  },
  commonAvatarsRow: {
    flexDirection: "row",
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  commonAvatarMini: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
  },

  // Fila de "Rails Trip" + Lottie al lado
  railsRow: {
    marginTop: 18,
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
    marginTop: 40,
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

  favoriteStarContainer: {
    marginTop: 14, // Ajusta este valor para más o menos espacio con los botones
    alignItems: "center",
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
