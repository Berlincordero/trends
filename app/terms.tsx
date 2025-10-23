// app/terms.tsx — Condiciones con el mismo PNG del login (sin puzzle), estilo unificado
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { useFonts, Pacifico_400Regular } from "@expo-google-fonts/pacifico";

/* =========================
   Ajustes (match Login/Splash)
   ========================= */
const BRAND = "Trends";                 // renderizamos # aparte
const BG_COLOR = "#000000";
const TITLE_SIZE = 26;
const ICON_SIZE = 130;

// PNG igual al de login
const APP_ICON = require("../assets/images/trends.png");

export default function TermsScreen() {
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
            Condiciones de{" "}
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
          1. Uso del servicio{"\n\n"}
          El uso de Trends está sujeto a las siguientes condiciones.
          Todo usuario debe ser mayor de 18 años queda claro esta condicion si se viola la politica de la misma y un menor de edad se registra ya que la plataforma permite registrarse y la usa se debe abstener de cualquier responsabilidad de la plataforma ya que esto se tomara como violacion de politicas y condiciones excepto que al mismo se le otorgue el permiso por parte del tutor legal de su uso y contenido en dicho caso dicho tutor legal tendra las responsabilidades de dicho uso y supervision. Esta plataforma es
          exclusivamente Social, el contenido de la misma es regulado y
          no se aceptará otro tipo de contenido y al usuario se le sancionara con advertencias y finalmente con la desactivacion de la cuenta. Nuestra misión es conectar a
          la agropecuaria con todas las personas que aman la agricultura y la
          naturaleza, por ello, el usuario está obligado a usarla para dichos
          fines. Si el usuario no lo hace, será eliminado de la plataforma y
          se eliminará su contenido . Cualquier intento de estafa, de acoso sexual,
          contenido ilegal o pornografico, intento de delitos con menores o
          cualquier delito sera notificado a la policia y autoridades judiciales
          y se dara colaboracion absoluta como informacion requerida por las mismas
          para que procedan contra dicha persona o usuario{"\n\n"}
          2. Responsabilidades del usuario{"\n\n"}
          El usuario es responsable de la información que comparte en
          Trends. No se permite el uso de lenguaje ofensivo, contenido
          ilegal o cualquier actividad que pueda dañar la reputación de la
          plataforma. El contenido que el usuario sube es propiedad de la
          plataforma.{"\n\n"}
          3. Propiedad intelectual{"\n\n"}
          El usuario concede a Trends una licencia no exclusiva,
          mundial y libre de regalías para usar, reproducir y distribuir el
          contenido que sube a la plataforma. El usuario garantiza que tiene
          los derechos necesarios para otorgar esta licencia. El contenido,
          diseño y estructura de Trends son propiedad de la plataforma
          y están protegidos por derechos de autor y otras leyes de propiedad
          intelectual.{"\n\n"}
          4. Privacidad y protección de datos{"\n\n"}
          Trends se compromete a proteger la privacidad de sus
          usuarios. La información personal recopilada se utilizará de acuerdo
          con nuestra política de privacidad.{"\n\n"}
          5. Limitación de responsabilidad{"\n\n"}
          El usuario acepta que Trends no será responsable de ningún
          daño directo, indirecto o incidental que surja del uso de la
          plataforma. La plataforma no garantiza la disponibilidad continua
          del servicio y se reserva el derecho de suspenderlo temporalmente
          por mantenimiento o mejoras.{"\n\n"}
          6. Modificaciones de las condiciones{"\n\n"}
          Cuando Trends realice cambios en estas condiciones, se
          notificará a los usuarios a través de la plataforma. El uso
          continuado del servicio después de la modificación implica la
          aceptación de las nuevas condiciones.{"\n\n"}
          7. Ley aplicable y jurisdicción{"\n\n"}
          Trends se rige por las leyes del país en el que opera.
          Cualquier disputa relacionada con estas condiciones se resolverá en
          los tribunales competentes de dicho país.{"\n\n"}
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
