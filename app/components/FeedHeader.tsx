// app/components/FeedHeader.tsx
import React from "react";
import { View, Image, TouchableOpacity, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const DEFAULT_JADE = "#fdfdfdff";

type Props = {
  /** ← ESTA es la prop que usas en feed.tsx */
  avatarUri?: string;
  onPressProfile?: () => void;
  onPressThink?: () => void;
  onPressMore?: () => void;
  /** requerido */
  paddingTop: number;
  jade?: string;
};

export default function FeedHeader({
  avatarUri,
  onPressProfile,
  onPressThink,
  onPressMore,
  paddingTop,
  jade = DEFAULT_JADE,
}: Props) {
  const headerHeight = paddingTop + 56;

  return (
    <View style={[styles.header, { paddingTop, height: headerHeight }]}>
      {/* Avatar */}
      <TouchableOpacity
        style={styles.avatarWrap}
        onPress={onPressProfile ?? (() => {})}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Ir al perfil"
      >
        <Image
          source={
            avatarUri
              ? { uri: avatarUri }
              : require("../../assets/images/avatar_neutral.png")
          }
          style={styles.avatar}
        />
      </TouchableOpacity>

      {/* Pill "¿Qué estás pensando?" */}
      <TouchableOpacity
        style={[styles.thinkPill, { borderColor: jade }]}
        onPress={onPressThink ?? (() => {})}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Crear publicación"
      >
        <Text style={[styles.thinkText, { color: jade }]} numberOfLines={1}>
          ¿Qué estás pensando?
        </Text>
        <Ionicons name="earth-outline" size={18} color={jade} />
      </TouchableOpacity>

      {/* Tres puntos */}
      <TouchableOpacity
        style={styles.moreBtn}
        onPress={onPressMore ?? (() => {})}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Más opciones"
      >
        <Ionicons name="ellipsis-horizontal" size={22} color={jade} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatar: { width: "100%", height: "100%" },
  thinkPill: {
    flex: 1,
    height: 28,
    marginLeft: 10,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  thinkText: { fontWeight: "800", fontSize: 13, opacity: 0.95 },
  moreBtn: { marginLeft: 10, height: 44, width: 36, alignItems: "center", justifyContent: "center" },
});
