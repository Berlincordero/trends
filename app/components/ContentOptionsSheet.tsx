import React, { useMemo } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const BG = "rgba(0,0,0,0.55)";
const PANEL = "#05090E";
const BORDER = "rgba(255,255,255,0.08)";
const JADE = "#6FD9C5";
const JADE_SOFT = "rgba(111,217,197,0.18)";

type OptionKey =
  | "edit"
  | "delete"
  | "report"
  | "hide_user"
  | "more_user"
  | "share_external"
  | "download"
  | "info";

type Props = {
  visible: boolean;
  onClose: () => void;
  isAuthor?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
};

const BASE_OPTIONS: { key: OptionKey; label: string; icon: string; desc: string }[] = [
  { key: "report", label: "Reportar", icon: "alert-circle-outline", desc: "Informa sobre contenido inapropiado o sospechoso." },
  { key: "hide_user", label: "Ocultar todo contenido de este usuario", icon: "eye-off-outline", desc: "Deja de ver publicaciones futuras de este usuario." },
  { key: "more_user", label: "Ver más contenido de este usuario", icon: "account-search-outline", desc: "Explora más publicaciones y actividad de este usuario." },
  { key: "share_external", label: "Compartir por otros medios", icon: "share-variant", desc: "Envía este contenido a otras apps o contactos." },
  { key: "download", label: "Descargar", icon: "download-outline", desc: "Guarda este contenido en tu dispositivo." },
  { key: "info", label: "Información del contenido", icon: "information-outline", desc: "Ver detalles adicionales y metadatos de esta publicación." },
];

const AUTHOR_OPTIONS: typeof BASE_OPTIONS = [
  { key: "edit", label: "Editar", icon: "pencil-outline", desc: "Modifica el texto o los elementos de este contenido." },
  { key: "delete", label: "Eliminar", icon: "trash-can-outline", desc: "Quita este contenido de forma permanente." },
];

export default function ContentOptionsSheet({
  visible,
  onClose,
  isAuthor = false,
  onEdit,
  onDelete,
  onDownload,
}: Props) {
  const options = useMemo(() => (isAuthor ? [...AUTHOR_OPTIONS, ...BASE_OPTIONS] : BASE_OPTIONS), [isAuthor]);

  const handlePress = (key: OptionKey) => {
    switch (key) {
      case "edit": onEdit?.(); break;
      case "delete": onDelete?.(); break;
      case "download": onDownload?.(); break;
      default: onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.pull} />
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerIconCircle}>
                  <MaterialCommunityIcons name="brush" size={18} color={JADE} />
                </View>
                <View>
                  <Text style={styles.title}>Opciones del contenido</Text>
                  <Text style={styles.subtitle}>Ajusta, descarga u oculta esta publicación</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {options.map((opt, i) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.card, i === 0 && { marginTop: 4 }]}
                activeOpacity={0.9}
                onPress={() => handlePress(opt.key)}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.cardIconBg}>
                    <MaterialCommunityIcons name={opt.icon as any} size={20} color={JADE} />
                  </View>
                </View>
                <View style={styles.cardCenter}>
                  <Text style={styles.cardTitle}>{opt.label}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{opt.desc}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.45)" />
              </TouchableOpacity>
            ))}
            <View style={{ height: 6 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: BG, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    backgroundColor: PANEL,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: BORDER,
    height: "30%",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 18,
  },
  pull: { alignSelf: "center", width: 40, height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.20)", marginBottom: 6 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 8 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10, paddingVertical: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.10)" },
  headerTitleRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  headerIconCircle: { width: 34, height: 34, borderRadius: 17, marginRight: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(111,217,197,0.16)", borderWidth: 1, borderColor: JADE_SOFT },
  title: { color: "#fff", fontSize: 15, fontWeight: "800" },
  subtitle: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 1 },
  closeBtn: { padding: 4, marginLeft: 4 },
  card: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10, paddingHorizontal: 10, marginBottom: 8,
    borderRadius: 14, backgroundColor: "rgba(10,18,28,0.96)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 }, elevation: 6,
  },
  cardLeft: { marginRight: 10 },
  cardIconBg: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(111,217,197,0.12)", borderWidth: 1, borderColor: "rgba(111,217,197,0.55)"
  },
  cardCenter: { flex: 1 },
  cardTitle: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 2 },
  cardDesc: { color: "rgba(255,255,255,0.65)", fontSize: 11.5 },
});
