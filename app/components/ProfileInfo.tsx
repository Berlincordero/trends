import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const JADE = "#6FD9C5";
type SexOpt = "male" | "female" | "other" | string | null | undefined;

type Props = { me: any; profile: any; avatarSize?: number; hPadding?: number; };

function formatLocalDate(d: string | null | undefined) {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !day) return d;
  const js = new Date(y, m - 1, day);
  return js.toLocaleDateString();
}

function sexPresentation(sex: SexOpt): { label: string; icon: keyof typeof Ionicons.glyphMap } {
  const s = String(sex || "").toLowerCase();
  if (s === "female") return { label: "Femenino", icon: "female" };
  if (s === "male") return { label: "Masculino", icon: "male" };
  if (s === "other") return { label: "Otro", icon: "person-outline" };
  return { label: "—", icon: "person-outline" };
}

export default function ProfileInfo({ me, profile, avatarSize = 120, hPadding = 16 }: Props) {
  const sexInfo = sexPresentation(profile?.sex);
  const birthText = formatLocalDate(profile?.birth_date);

  return (
    <View style={{ paddingTop: avatarSize / 2 + 12, paddingHorizontal: hPadding, paddingBottom: 8 }}>
      <Text style={styles.name} numberOfLines={1}>{me?.username}</Text>
      <Text style={styles.email} numberOfLines={1}>{me?.email}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}><Ionicons name={sexInfo.icon} size={14} color={JADE} style={{ marginRight: 6 }} /><Text style={styles.metaText}>{sexInfo.label}</Text></View>
        <View style={styles.metaPill}><Ionicons name="gift-outline" size={14} color={JADE} style={{ marginRight: 6 }} /><Text style={styles.metaText}>{birthText === "—" ? "Cumpleaños —" : `Cumpleaños ${birthText}`}</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  name:{ color:"#fff", fontSize:22, fontWeight:"900" },
  email:{ marginTop:4, color:"#cfd8dc" },
  metaRow:{ flexDirection:"row", gap:8, marginTop:10, flexWrap:"wrap" },
  metaPill:{ flexDirection:"row", alignItems:"center", paddingHorizontal:10, paddingVertical:6, backgroundColor:"rgba(255,255,255,0.06)", borderRadius:999, borderWidth: StyleSheet.hairlineWidth, borderColor:"rgba(111, 217, 197, 0.35)" },
  metaText:{ color: JADE, fontWeight:"800", fontSize:12 },
});
