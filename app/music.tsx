// app/music.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 👉 tipo de pista y lista de canciones (usa los mismos ids que en vibescompose)
export type MusicTrack = {
  id: string;
  title: string;
  file: any;   // require("../assets/audio/*.mp3")
  cover: any;  // require("../assets/images/music/*.png")
};

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "song1",
    title: "Phantom Planet – California",
    file: require("../assets/audio/song1.mp3"),
    // 🔴 pon aquí la ruta a tu imagen redonda
    cover: require("../assets/images/music/song1.png"),
  },
  {
    id: "song2",
    title: "Oasis – wonderwall",
    file: require("../assets/audio/song2.mp3"),
    cover: require("../assets/images/music/song2.png"),
  },
  {
    id: "song3",
    title: "Farruko ft Natti Natasha – Crazy in Love",
    file: require("../assets/audio/song3.mp3"),
    cover: require("../assets/images/music/song3.png"),
  },
    {
    id: "song4",
    title: "Shirfine – ILLUSIONARY DAYTIME",
    file: require("../assets/audio/song4.mp3"),
    cover: require("../assets/images/music/song4.png"),
  },
    {
    id: "song5",
    title: "Kafu Banton Ft Almirante – Ella",
    file: require("../assets/audio/song5.mp3"),
    cover: require("../assets/images/music/song5.png"),
  },
  {
    id: "song6",
    title: "Toledo – El Sarpe",
    file: require("../assets/audio/song6.mp3"),
    cover: require("../assets/images/music/song6.png"),
  }
  ,{
    id: "song7",
    title: "Five for Fighting – chance",
    file: require("../assets/audio/song7.mp3"),
    cover: require("../assets/images/music/song7.png"),
  }
  , {
    id: "song8",
    title: "Five for Fighting – ITS NOT EASY", 
    file: require("../assets/audio/song8.mp3"),
    cover: require("../assets/images/music/song8.png"),
  }
];

const BG = "#000";

export default function MusicScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSelect = async (track: MusicTrack | null) => {
    if (track) {
      await AsyncStorage.setItem("selectedMusicTrackId", track.id);
    } else {
      await AsyncStorage.removeItem("selectedMusicTrackId");
    }
    router.back();
  };

  return (
    <View
      style={[
        styles.fill,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Elige una canción 🎵</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sin música */}
        <TouchableOpacity
          style={styles.trackRow}
          onPress={() => handleSelect(null)}
        >
          <View style={styles.avatarWrap}>
            <Ionicons name="close-circle" size={22} color="#fff" />
          </View>
          <Text style={styles.trackTitle}>Sin música</Text>
        </TouchableOpacity>

        {MUSIC_TRACKS.map((track) => (
          <TouchableOpacity
            key={track.id}
            style={styles.trackRow}
            onPress={() => handleSelect(track)}
          >
            {/* 🔴 Avatar redondo de la canción */}
            <Image source={track.cover} style={styles.trackAvatar} />
            <Text style={styles.trackTitle}>{track.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
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
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 16,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  trackAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20, // 👉 redondo
    marginRight: 12,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  trackTitle: {
    color: "#fff",
    fontSize: 14,
  },
});
