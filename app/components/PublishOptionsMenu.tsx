// app/components/PublishOptionsMenu.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";

const JADE = "#6FD9C5";

type Props = {
  onPickMedia: () => void;
  onCamera: () => void;
  onTextPlusFile: () => void;
  onCollage: () => void;        // ← NUEVO
  menuBg?: ImageSourcePropType; // imagen de fondo opcional
};

export default function PublishOptionsMenu({
  onPickMedia,
  onCamera,
  onTextPlusFile,
  onCollage,
  menuBg,
}: Props) {
  return (
    <View style={styles.wrap}>
      {/* Fondo a pantalla completa (sin cortes) */}
      {menuBg && (
        <View style={styles.bgWrap} pointerEvents="none">
          <Image source={menuBg} style={styles.bgImg} resizeMode="cover" />
          <View style={styles.scrim} />
        </View>
      )}

      <View style={styles.center}>
        <TouchableOpacity style={styles.option} onPress={onPickMedia}>
          <Feather name="upload-cloud" size={20} color={JADE} />
          <Text style={styles.optionTxt}>Subir video/imagen</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={onCamera}>
          <Feather name="camera" size={20} color={JADE} />
          <Text style={styles.optionTxt}>Grabación/Foto</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={onTextPlusFile}>
          <Feather name="file-plus" size={20} color={JADE} />
          <Text style={styles.optionTxt}>Texto + archivo</Text>
        </TouchableOpacity>

        {/* NUEVA opción: Collage */}
        <TouchableOpacity style={styles.option} onPress={onCollage}>
          <Feather name="grid" size={20} color={JADE} />
          <Text style={styles.optionTxt}>Collage</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  // Contenedor de fondo absoluto para que no quede a la mitad
  bgWrap: {
    position: "absolute",
    top: 0, right: 0, bottom: 0, left: 0,
  },
  bgImg: {
    width: "100%",
    height: "100%",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
  },
  option: {
    width: Dimensions.get("window").width * 0.84,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 10,
  },
  // ← Cambio: usar la misma fuente Pacifico
  optionTxt: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Pacifico_400Regular",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
  