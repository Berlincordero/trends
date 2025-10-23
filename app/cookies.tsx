// app/cookies.tsx — Política de Cookies (estilo unificado con Login/Splash/Terms/Privacy)
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { useFonts, Pacifico_400Regular } from "@expo-google-fonts/pacifico";

/* =========================
   Ajustes (match Login/Splash/Terms/Privacy)
   ========================= */
const BRAND = "Trends";                 // renderizamos # aparte
const BG_COLOR = "#000000";
const TITLE_SIZE = 26;
const ICON_SIZE = 130;

// PNG igual al de login
const APP_ICON = require("../assets/images/trends.png");

export default function CookiesScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Pacifico_400Regular });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BG_COLOR }} />;

  return (
    <View style={[styles.container, { backgroundColor: BG_COLOR }]}>
      {/* HEADER: PNG + título */}
      <View style={styles.header}>
        <Image
          source={APP_ICON}
          style={{ width: ICON_SIZE, height: ICON_SIZE, marginBottom: 20 }}
          resizeMode="contain"
        />

        <View style={styles.titleWrap}>
          <Text style={[styles.titleText, { fontSize: TITLE_SIZE }]}>
            Política de cookies de{" "}
            <Text style={styles.brandInline}>
              <Text style={{ marginRight: 36 }}>#</Text>
              <Text>{BRAND}</Text>
            </Text>
          </Text>
        </View>
      </View>

      {/* CUERPO */}
      <ScrollView style={styles.card} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <Text style={styles.text}>
          1. ¿Qué son las cookies?{"\n\n"}
          Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo para recordar tus preferencias…{"\n\n"}
          2. ¿Por qué usamos cookies?{"\n\n"}
          Trends utiliza cookies para mejorar tu experiencia, medir el rendimiento y proteger la plataforma…{"\n\n"}
          3. Tipos de cookies que utilizamos{"\n\n"}
          • Cookies esenciales{"\n"}
          • Cookies de rendimiento{"\n"}
          • Cookies de funcionalidad…{"\n\n"}
          4. Gestión de cookies{"\n\n"}
          Puedes deshabilitar las cookies en la configuración de tu navegador, pero la plataforma podría no funcionar correctamente…{"\n\n"}
          5. Cambios en esta política{"\n\n"}
          Podemos actualizar esta política ocasionalmente. Te notificaremos cualquier cambio importante…{"\n\n"}
          ────────────────────────────{"\n\n"}
        </Text>
      </ScrollView>

      {/* BOTÓN VOLVER (blanco) */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.replace("/register")}
        style={styles.btn}
      >
        <Text style={styles.btnText}>REGRESAR A REGISTRO</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------- ESTILOS ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 22,
    justifyContent: "space-between",
  },

  header: { alignItems: "center", marginTop: 6 },

  titleWrap: { width: "92%", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  titleText: {
    color: "#FFFFFF",
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.3,
    lineHeight: 32,
  },
  brandInline: {
    fontFamily: "Pacifico_400Regular",
    letterSpacing: 0,
    color: "#FFFFFF",
  },

  // Tarjeta con scroll
  card: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  text: {
    color: "#E5E7EA",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
  },

  // Botón blanco
  btn: {
    alignSelf: "center",
    width: "80%",
    height: 48,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    elevation: 3,
    marginTop: 12,
  },
  btnText: {
    color: "#000000",
    fontWeight: "900",
    letterSpacing: 1,
    fontSize: 15,
  },
});
