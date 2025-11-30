// app/vibesplayer.tsx
import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

import { isLikelyImageUrl } from "../lib/api";

const BG = "#000";

export default function VibesPlayerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ media?: string }>();

  const mediaUri = useMemo(() => {
    if (!params?.media) return "";
    if (Array.isArray(params.media)) return params.media[0] ?? "";
    return String(params.media);
  }, [params]);

  const isImage = isLikelyImageUrl(mediaUri);

  return (
    <View style={styles.fill}>
      <StatusBar hidden />

      <TouchableOpacity
        style={[styles.closeBtn, { top: insets.top + 8 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={26} color="#fff" />
      </TouchableOpacity>

      {!mediaUri ? (
        <View style={styles.center}>
          <Text style={{ color: "#fff" }}>No se encontró el clip.</Text>
        </View>
      ) : isImage ? (
        <Image
          source={{ uri: mediaUri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : (
        <Video
          source={{ uri: mediaUri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping
          isMuted={false}
          useNativeControls={false}
        />
      )}

      <View style={[styles.bottomHint, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.bottomTxt}>Toque ✕ para cerrar</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: BG,
  },
  closeBtn: {
    position: "absolute",
    right: 12,
    zIndex: 20,
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomHint: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  bottomTxt: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
  },
});
