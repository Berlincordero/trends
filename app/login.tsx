// app/login.tsx — LOGIN estilo splash (#Trends) con form-urlencoded (sin PNG) + HEADER_TOP_SPACING
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts, Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import { endpoints, postForm } from "../lib/api";

/* ====== Ajuste rápido para bajar/subir logo+eslogan ====== */
const HEADER_TOP_SPACING = 70; // ⬅️ súbelo/bájalo como en register
/* ========================================================= */

const BRAND = "Trends";
const SUBTITLE = "has tendencias tus historias";
const BRAND_SIZE = 44;
const SUB_SIZE = 20;
const INPUT_HEIGHT = 50;

const BG_COLOR = "#000";
const PLACEHOLDER = "#DDE2E8";
const INPUT_BORDER = "rgba(255,255,255,0.55)";
const INPUT_BG = "rgba(255,255,255,0.08)";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Pacifico_400Regular });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BG_COLOR }} />;

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert("Faltan datos", "Ingresa usuario y contraseña");
      return;
    }
    try {
      setLoading(true);
      const res = await postForm(endpoints.login(), {
        username: username.trim(),
        password,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const msg =
          (typeof err?.detail === "string" && err.detail) ||
          (Array.isArray(err?.detail) && err.detail[0]?.msg) ||
          "Credenciales inválidas o servidor no disponible";
        throw new Error(msg);
      }

      const data = await res.json();
      const token: string | undefined =
        data?.access_token ?? data?.token ?? data?.accessToken;

      if (!token) throw new Error("Respuesta inválida del servidor (sin token)");

      await AsyncStorage.setItem("userToken", String(token));
      router.replace("/feed");
    } catch (e: any) {
      Alert.alert("Error al iniciar sesión", e?.message || "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG_COLOR }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { backgroundColor: BG_COLOR }]}>
        {/* Header (sin PNG, sólo marca y eslogan) */}
        <View style={[styles.header, { marginTop: HEADER_TOP_SPACING }]}>
          <View style={styles.brandWrap}>
            <Text
              style={[styles.brandText, { fontSize: BRAND_SIZE, lineHeight: BRAND_SIZE * 1.25 }]}
            >
              <Text style={{ marginRight: 40 }}>#</Text>
              <Text>{BRAND}</Text>
            </Text>
          </View>

          <View style={styles.subWrap}>
            <Text
              style={[styles.subText, { fontSize: SUB_SIZE, lineHeight: SUB_SIZE * 1.3 }]}
            >
              {SUBTITLE}
            </Text>
          </View>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.formTitle}>Iniciar Sesión</Text>

          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={20} color={PLACEHOLDER} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              placeholderTextColor={PLACEHOLDER}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              editable={!loading}
            />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color={PLACEHOLDER} style={styles.inputIcon} />
            <TextInput
              key={showPassword ? "text" : "password"}
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={PLACEHOLDER}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={() => !loading && handleLogin()}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={PLACEHOLDER} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleLogin}
            style={[styles.btnOuter, loading && { opacity: 0.7 }]}
            disabled={loading}
          >
            <View style={styles.btn}>
              {loading ? <ActivityIndicator /> : <Text style={styles.btnText}>ENTRAR</Text>}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkBtn} onPress={() => router.replace("/register")} disabled={loading}>
            <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          from <Text style={styles.footerBold}>Prodigy Studios</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ---------- ESTILOS ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 28, justifyContent: "space-between" },
  header: { alignItems: "center" },

  brandWrap: { width: "92%", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  brandText: { fontFamily: "Pacifico_400Regular", color: "#fff", letterSpacing: 0, textAlign: "center" },

  subWrap: { width: "92%", alignItems: "center", justifyContent: "center", marginTop: 4 },
  subText: { fontFamily: "Pacifico_400Regular", color: "#fff", letterSpacing: 0, textAlign: "center" },

  card: {
    backgroundColor: INPUT_BG,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  formTitle: { fontSize: 20, fontWeight: "800", color: "#fff", alignSelf: "center", marginBottom: 12, letterSpacing: 0.4 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 6,
    paddingHorizontal: 10,
  },
  inputIcon: { marginRight: 6 },
  input: { flex: 1, color: "#fff", fontSize: 16, fontWeight: "700", paddingVertical: 0 },
  eyeBtn: { padding: 4, marginLeft: 6 },

  btnOuter: { marginTop: 10 },
  btn: { height: 48, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", elevation: 3 },
  btnText: { color: "#000", fontWeight: "900", letterSpacing: 1, fontSize: 16 },

  linkBtn: { marginTop: 12, alignItems: "center" },
  linkText: { color: "#E5E7EA", fontWeight: "700", textDecorationLine: "underline", letterSpacing: 0.2 },

  footer: { textAlign: "center", color: "#C7CFD9", fontSize: 13 },
  footerBold: { fontWeight: "900", color: "#FFFFFF" },
});
