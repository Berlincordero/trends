 // app/register.tsx — Registro compacto (#Trends) con radios jade + links legales
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFonts, Pacifico_400Regular } from "@expo-google-fonts/pacifico";
// 👉 Usamos la función correcta del API
import { registerWithProfile } from "../lib/api";
// 👉 Instala el datepicker (Expo):  npx expo install @react-native-community/datetimepicker
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

/* ====== Ajustes rápidos ====== */
const HEADER_TOP_SPACING = 70; // baja/sube logo+eslogan
const BRAND_SIZE = 44;
const SUB_SIZE = 18;
/* ============================= */

const BRAND = "Trends";
const SUBTITLE = "has tendencias tus historias";

const BG_COLOR = "#000";
const PLACEHOLDER = "#DDE2E8";
const INPUT_BORDER = "rgba(255,255,255,0.42)";
const INPUT_BG = "rgba(255,255,255,0.07)";
const JADE = "#6FD9C5";

/* Tamaños refinados del formulario */
const INPUT_HEIGHT = 40;
const GAP_BLOCK = 12;

// Backend espera sex: "male" | "female" | "other"
type Gender = "male" | "female" | "other";

/* Helpers de fecha */
const toApiDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const toDisplayDate = (d: Date) =>
  new Intl.DateTimeFormat("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);

/* Radio (bolita + label) más pequeño */
function Radio({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.radio} onPress={onPress} activeOpacity={0.85}>
      <View
        style={[
          styles.radioDot,
          { borderColor: selected ? JADE : PLACEHOLDER },
        ]}
      >
        {selected ? <View style={styles.radioDotInner} /> : null}
      </View>
      <Text
        style={[
          styles.radioLabel,
          { color: selected ? JADE : PLACEHOLDER },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 🔽 ahora la fecha es un Date, no string
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [gender, setGender] = useState<Gender>("male");
  const [loading, setLoading] = useState(false);

  // iOS: control del modal
  const [showDateIOS, setShowDateIOS] = useState(false);

  const router = useRouter();
  const [fontsLoaded] = useFonts({ Pacifico_400Regular });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BG_COLOR }} />;

  const validate = () => {
    if (!username.trim()) return "Ingresa un usuario";
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()))
      return "Ingresa un correo válido";
    if (!password) return "Ingresa una contraseña";
    if (!birthdate) return "Elige tu fecha de nacimiento";
    return null;
  };

  const openDatePicker = () => {
    const initial = birthdate ?? new Date(2000, 0, 1);
    const maximum = new Date(); // no permitir fechas futuras
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: initial,
        mode: "date",
        maximumDate: maximum,
        onChange: (_, d) => {
          if (d) setBirthdate(d);
        },
      });
    } else {
      setShowDateIOS(true);
    }
  };

  const handleRegister = async () => {
    const err = validate();
    if (err) return Alert.alert("Faltan datos", err);
    try {
      setLoading(true);

      // ✅ Usamos el endpoint correcto del backend (JSON)
      //   - birth_date: "YYYY-MM-DD"
      //   - sex: "male" | "female" | "other"
      await registerWithProfile({
        username: username.trim(),
        email: email.trim(),
        password,
        birth_date: birthdate ? toApiDate(birthdate) : undefined,
        sex: gender,
      });

      // registerWithProfile guarda el token en AsyncStorage
      Alert.alert("¡Bienvenido/a!", "Tu cuenta fue creada.");
      // Llévalo a la raíz o a tus tabs principales, ya con sesión iniciada:
      router.replace("/");
    } catch (e: any) {
      // El helper ya trae el texto de error del backend si se puede
      Alert.alert("Error al registrarse", e?.message || "No se pudo registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG_COLOR }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.screen, { backgroundColor: BG_COLOR }]}>
        {/* Header centrado — puedes bajar/subir con HEADER_TOP_SPACING */}
        <View style={[styles.header, { marginTop: HEADER_TOP_SPACING }]}>
          <Text
            style={[
              styles.brandText,
              { fontSize: BRAND_SIZE, lineHeight: BRAND_SIZE * 1.18 },
            ]}
          >
            <Text style={{ marginRight: 24 }}>#</Text>
            <Text>{BRAND}</Text>
          </Text>
          <Text
            style={[styles.subText, { fontSize: SUB_SIZE, lineHeight: SUB_SIZE * 1.25 }]}
          >
            {SUBTITLE}
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.formTitle}>Crear cuenta</Text>

          {/* Usuario */}
          <View style={{ marginTop: GAP_BLOCK }}>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={16} color={PLACEHOLDER} style={styles.inputIcon} />
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
          </View>

          {/* Correo */}
          <View style={{ marginTop: GAP_BLOCK }}>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={16} color={PLACEHOLDER} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Correo"
                placeholderTextColor={PLACEHOLDER}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                editable={!loading}
              />
            </View>
          </View>

          {/* Contraseña */}
          <View style={{ marginTop: GAP_BLOCK }}>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={16} color={PLACEHOLDER} style={styles.inputIcon} />
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
                returnKeyType="next"
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color={PLACEHOLDER} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Fecha de nacimiento (picker) */}
          <View style={{ marginTop: GAP_BLOCK }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openDatePicker}
              disabled={loading}
            >
              <View style={styles.inputRow}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={PLACEHOLDER}
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.input,
                    {
                      color: birthdate ? "#fff" : PLACEHOLDER,
                      fontWeight: birthdate ? "800" : "700",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {birthdate
                    ? toDisplayDate(birthdate) // dd/MM/yyyy
                    : "Fecha de nacimiento"}
                </Text>
                <Ionicons name="chevron-down" size={16} color={PLACEHOLDER} />
              </View>
            </TouchableOpacity>
          </View>

          {/* iOS modal del picker */}
          <Modal transparent visible={showDateIOS} animationType="fade" onRequestClose={() => setShowDateIOS(false)}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Elige tu fecha</Text>
                <DateTimePicker
                  value={birthdate ?? new Date(2000, 0, 1)}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={(_, d) => d && setBirthdate(d)}
                  style={{ alignSelf: "stretch" }}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "rgba(255,255,255,0.08)" }]} onPress={() => setShowDateIOS(false)}>
                    <Text style={[styles.modalBtnText, { color: "#E5E7EA" }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: JADE }]} onPress={() => setShowDateIOS(false)}>
                    <Text style={[styles.modalBtnText, { color: "#000" }]}>Listo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Género (una sola línea) */}
          <View style={{ marginTop: GAP_BLOCK }}>
            <Text style={styles.groupLabel}>Género</Text>
            <View style={styles.radiosRowOneLine}>
              <Radio label="Masculino" selected={gender === "male"} onPress={() => setGender("male")} />
              <Radio label="Femenino" selected={gender === "female"} onPress={() => setGender("female")} />
              <Radio label="Personalizado" selected={gender === "other"} onPress={() => setGender("other")} />
            </View>
          </View>

          {/* Botón */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleRegister}
            style={[styles.btnOuter, loading && { opacity: 0.7 }]}
            disabled={loading}
          >
            <View style={styles.btn}>
              <Text style={styles.btnText}>REGISTRARTE</Text>
            </View>
          </TouchableOpacity>

          {/* Legal (links en negrita + subrayado) */}
          <Text style={styles.legalText}>
            Al hacer clic en <Text style={styles.legalStrong}>"Registrarte"</Text>, aceptas nuestras{" "}
            <Text style={styles.legalLink} onPress={() => router.push("/terms")}>Condiciones</Text>, la{" "}
            <Text style={styles.legalLink} onPress={() => router.push("/privacy")}>Política de privacidad</Text> y la{" "}
            <Text style={styles.legalLink} onPress={() => router.push("/cookies")}>Política de cookies</Text>.
          </Text>

          {/* Link login (por si quiere ir manualmente) */}
          <TouchableOpacity style={styles.linkBtn} onPress={() => router.replace("/login")} disabled={loading}>
            <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          from <Text style={styles.footerBold}>Prodigy Studios</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ---------- ESTILOS ---------- */
const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 22, paddingVertical: 18, justifyContent: "space-between" },

  header: { alignItems: "center", marginBottom: 6 },
  brandText: { fontFamily: "Pacifico_400Regular", color: "#fff", textAlign: "center" },
  subText: { fontFamily: "Pacifico_400Regular", color: "#fff", textAlign: "center", opacity: 0.96 },

  card: {
    backgroundColor: INPUT_BG,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  formTitle: { fontSize: 17, fontWeight: "900", color: "#fff", alignSelf: "center" },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: INPUT_HEIGHT,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: INPUT_BORDER,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
  },
  inputIcon: { marginRight: 8, opacity: 0.95 },
  input: { flex: 1, color: "#fff", fontSize: 13, fontWeight: "700", paddingVertical: 0 },
  eyeBtn: { padding: 4, marginLeft: 6 },

  groupLabel: { color: "#E5E7EA", fontWeight: "900", fontSize: 12, marginBottom: 8, letterSpacing: 0.2 },

  // Radios en una sola línea
  radiosRowOneLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  radio: { flexDirection: "row", alignItems: "center" },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  radioDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: JADE },
  radioLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 0.2 },

  btnOuter: { marginTop: 16 },
  btn: { height: 42, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  btnText: { color: "#000", fontWeight: "900", letterSpacing: 1, fontSize: 13.5 },

  legalText: { color: "#C7CFD9", fontSize: 11.5, lineHeight: 16.5, marginTop: 14 },
  legalStrong: { fontWeight: "900", color: "#FFFFFF" },
  legalLink: { fontWeight: "900", textDecorationLine: "underline", color: "#FFFFFF" },

  linkBtn: { marginTop: 12, alignItems: "center" },
  linkText: { color: "#E5E7EA", fontWeight: "800", textDecorationLine: "underline", letterSpacing: 0.2, fontSize: 13 },

  footer: { textAlign: "center", color: "#C7CFD9", fontSize: 12, marginTop: 6 },
  footerBold: { fontWeight: "900", color: "#FFFFFF" },

  // Modal iOS
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#0D0F12",
    padding: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  modalTitle: { color: "#fff", fontWeight: "900", fontSize: 14, marginBottom: 8, alignSelf: "center" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 10 },
  modalBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: { fontWeight: "900", fontSize: 13 },
});
