import React from "react";
import { View, Image, TouchableOpacity, StyleSheet, ActivityIndicator, ImageSourcePropType } from "react-native";

type Props = {
  avatarUri?: string;
  placeholder: ImageSourcePropType; // require("../assets/images/avatar_neutral.png")
  uploading?: boolean;
  onPress?: () => void;
  size?: number;
  leftPadding?: number;
};

export default function ProfileAvatar({ avatarUri, placeholder, uploading = false, onPress, size = 120, leftPadding = 16 }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.avatarTap, { left: leftPadding, bottom: -size / 2 }]}>
      <Image source={avatarUri ? { uri: avatarUri } : placeholder} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />
      {uploading && (
        <View style={[styles.avatarLoading, { borderRadius: size / 2 }]}><ActivityIndicator /></View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  avatarTap:{ position:"absolute" },
  avatar:{ borderWidth:3, borderColor:"#000", backgroundColor:"#111" },
  avatarLoading:{ position:"absolute", top:0, left:0, right:0, bottom:0, alignItems:"center", justifyContent:"center", backgroundColor:"rgba(0,0,0,0.35)" },
});
