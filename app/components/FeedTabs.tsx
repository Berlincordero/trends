// app/components/FeedTabs.tsx
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type TabKey = "likes" | "audio" | "shop" | "notifications";

type Props = {
  value: TabKey;
  onChange: (tab: TabKey) => void;
  jade?: string;
  onPressHeart?: () => void;   // 👈 NUEVO
};

const DEFAULT_JADE = "#e9e9e9ff";

export default function FeedTabs({
  value,
  onChange,
  jade = DEFAULT_JADE,
  onPressHeart,
}: Props) {
  const HeartIcon = value === "likes" ? "heart" : "heart-outline";
  const MicIcon = value === "audio" ? "mic" : "mic-outline";
  const ShopIcon = value === "shop" ? "bag-handle" : "bag-handle-outline";
  const BellIcon =
    value === "notifications" ? "notifications" : "notifications-outline";

  return (
    <View style={styles.tabsWrap}>
      {([
        ["likes", HeartIcon],
        ["audio", MicIcon],
        ["shop", ShopIcon],
        ["notifications", BellIcon],
      ] as const).map(([k, icon]) => (
        <TouchableOpacity
          key={k}
          style={[
            styles.tabBtn,
            value === k && [styles.tabBtnActive, { borderColor: jade }],
          ]}
          onPress={() => {
            onChange(k);
            if (k === "likes" && onPressHeart) {
              onPressHeart();      // 👈 abre la pantalla feelings
            }
          }}
          activeOpacity={0.9}
        >
          <Ionicons name={icon as any} size={18} color={jade} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabsWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  tabBtn: {
    width: 24,
    height: 20,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: {
    backgroundColor: "rgba(111,217,197,0.12)",
  },
});
