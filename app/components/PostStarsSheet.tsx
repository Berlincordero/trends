// app/components/PostStarsSheet.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import {
  fetchFeedStars,
  toAbsolute,
  FeedStarUser,
  BASE,
} from "../../lib/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const BG = "rgba(0,0,0,0.55)";
const PANEL = "#0B131A";
const BORDER = "rgba(255,255,255,0.04)";
const JADE = "#6FD9C5";

// 👇 misma lógica que en FeedVideoCard
function buildAvatarUri(raw?: string | null): string | null {
  if (!raw) return null;
  // ya es absoluta
  if (/^https?:\/\//i.test(raw)) return raw;
  // ya viene con /media/...
  if (raw.startsWith("/media/")) return `${BASE}${raw}`; 
  // viene como "avatars/xxxx.jpg" → le pegamos /media/
  return `${BASE}/media/${raw.replace(/^\/+/, "")}`;
}

export default function PostStarsSheet({
  visible,
  onClose,
  postId,
}: {
  visible: boolean;
  onClose: () => void;
  postId: number;
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FeedStarUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!visible) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFeedStars(postId, 200, 0);
      setItems(res);
    } catch (e: any) {
      setError("No se pudo cargar la lista.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [postId, visible]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Reacciones ⭐</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.empty}>Aún no hay reacciones.</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(it) => String(it.id)}
              contentContainerStyle={{ paddingVertical: 4 }}
              renderItem={({ item }) => {
                // 👇 aquí usamos la función nueva
                const avatarUri = buildAvatarUri(item.avatar);
                return (
                  <View style={styles.row}>
                    <View style={styles.avatarWrap}>
                      {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.avatarFallback]}>
                          <MaterialCommunityIcons name="account" size={20} color="#fff" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.username}>{item.username}</Text>
                    <MaterialCommunityIcons
                      name="star"
                      size={18}
                      color={JADE}
                      style={{ marginLeft: "auto" }}
                    />
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: PANEL,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    maxHeight: "60%",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  center: {
    paddingVertical: 26,
    alignItems: "center",
  },
  error: {
    color: "#ffb4b4",
  },
  empty: {
    color: "#fff",
    opacity: 0.65,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  avatarWrap: {
    width: 40,
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
  },
  avatarFallback: {
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
 