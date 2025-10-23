import React from "react";
import { View, Image, StyleSheet, TouchableOpacity, Text, Dimensions, ImageSourcePropType } from "react-native";

const { width } = Dimensions.get("window");
export const COVER_HEIGHT = 320;

type Props = { coverUri?: string; onBack?: () => void; fallback?: ImageSourcePropType; };

export default function ProfileCover({ coverUri, onBack, fallback }: Props) {
  return (
    <View style={styles.coverWrap}>
      {coverUri ? <Image source={{ uri: coverUri }} style={styles.cover} resizeMode="cover" />
        : fallback ? <Image source={fallback} style={styles.cover} resizeMode="cover" />
        : <View style={[styles.cover, { backgroundColor: "#111" }]} />}
      <View style={styles.coverOverlay} />
      {!!onBack && (
        <TouchableOpacity onPress={onBack} style={styles.back}><Text style={{ color: "#fff", fontWeight: "800" }}>← Volver</Text></TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  coverWrap:{ width, height: COVER_HEIGHT, position:"relative" },
  cover:{ width, height: COVER_HEIGHT },
  coverOverlay:{ position:"absolute", top:0, left:0, width, height: COVER_HEIGHT, backgroundColor:"rgba(0,0,0,0.25)" },
  back:{ position:"absolute", top:16, left:16, paddingHorizontal:12, paddingVertical:8, backgroundColor:"rgba(0,0,0,0.45)", borderRadius:999 },
});
