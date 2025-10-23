// app/index.tsx — Splash (#Trends) con tipeo (sin PNG) + HEADER_TOP_SPACING
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts, Pacifico_400Regular } from "@expo-google-fonts/pacifico";

/* ====== Ajuste rápido para bajar/subir logo+eslogan ====== */
const HEADER_TOP_SPACING = 70; // ⬅️ igual que en register/login
/* ========================================================= */

const BRAND = "Trends";
const SUBTITLE = "has tendencias tus historias";
const TYPE_SPEED_MS = 220;
const TYPE_SPEED_SUB_MS = 200;
const VIEW_TOTAL_MS = 10000;
const BRAND_SIZE = 44;
const SUB_SIZE = 22;
const BG_COLOR = "#000";

export default function Splash() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Pacifico_400Regular });

  const [typedTitle, setTypedTitle] = useState("");
  const [typedSub, setTypedSub] = useState("");
  const [cursorOn, setCursorOn] = useState(true);
  const [titleDone, setTitleDone] = useState(false);

  useEffect(() => {
    const blink = setInterval(() => setCursorOn((v) => !v), 450);

    let i = 0;
    const t1 = setInterval(() => {
      i++; setTypedTitle(BRAND.slice(0, i));
      if (i >= BRAND.length) {
        clearInterval(t1); setTitleDone(true);
        setTimeout(() => {
          let j = 0;
          const t2 = setInterval(() => {
            j++; setTypedSub(SUBTITLE.slice(0, j));
            if (j >= SUBTITLE.length) clearInterval(t2);
          }, TYPE_SPEED_SUB_MS);
        }, 200);
      }
    }, TYPE_SPEED_MS);

    const typingDuration = BRAND.length * TYPE_SPEED_MS + 200 + SUBTITLE.length * TYPE_SPEED_SUB_MS;
    const totalMs = Math.max(VIEW_TOTAL_MS, typingDuration);

    const nav = setTimeout(async () => {
      const token = await AsyncStorage.getItem("userToken");
      router.replace(token ? "/feed" : "/login");
    }, totalMs);

    return () => { clearInterval(blink); clearTimeout(nav); };
  }, []);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BG_COLOR }} />;

  return (
    <View style={[styles.container, { backgroundColor: BG_COLOR }]}>
      {/* Header agrupando marca+eslogan con margen superior ajustable */}
      <View style={[styles.header, { marginTop: HEADER_TOP_SPACING }]}>
        <View style={styles.brandWrap}>
          <Text style={[styles.brandText, { fontSize: BRAND_SIZE, lineHeight: BRAND_SIZE * 1.25 }]}>
            <Text style={{ marginRight: 40 }}>#</Text>
            <Text>{typedTitle}</Text>
            {!titleDone ? <Text style={{ opacity: cursorOn ? 1 : 0 }}>|</Text> : null}
          </Text>
        </View>

        <View style={styles.subWrap}>
          <Text style={[styles.subText, { fontSize: SUB_SIZE, lineHeight: SUB_SIZE * 1.3 }]}>
            {typedSub}
            {titleDone && typedSub.length < SUBTITLE.length ? (
              <Text style={{ opacity: cursorOn ? 1 : 0 }}>|</Text>
            ) : null}
          </Text>
        </View>
      </View>

      <Text style={styles.footer}>
        from <Text style={styles.footerBold}>Prodigy Studios</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  header: { alignItems: "center", width: "100%" },

  brandWrap: { width: "92%", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  brandText: { fontFamily: "Pacifico_400Regular", color: "#fff", letterSpacing: 0, textAlign: "center" },

  subWrap: { width: "92%", alignItems: "center", justifyContent: "center", marginTop: 4 },
  subText: { fontFamily: "Pacifico_400Regular", color: "#fff", letterSpacing: 0, textAlign: "center" },

  footer: { position: "absolute", bottom: 28, left: 0, right: 0, textAlign: "center", color: "#C7CFD9", fontSize: 13 },
  footerBold: { fontWeight: "900", color: "#FFFFFF" },
});
