import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  ImageSourcePropType,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

/* ------------------------------------------------------------------ */
/* IMPORTS DE FUENTES (mismo patrón que CommentsSheet)                */
/* ------------------------------------------------------------------ */

// 1) Poppins
import {
  useFonts as usePoppins,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
// 2) Montserrat
import {
  useFonts as useMontserrat,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
// 3) Inter
import {
  useFonts as useInter,
  Inter_500Medium,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
// 4) Roboto
import {
  useFonts as useRoboto,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from "@expo-google-fonts/roboto";
// 5) Open Sans
import {
  useFonts as useOpenSans,
  OpenSans_400Regular,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
} from "@expo-google-fonts/open-sans";
// 6) Lato
import {
  useFonts as useLato,
  Lato_400Regular,
  Lato_700Bold,
} from "@expo-google-fonts/lato";
// 7) Nunito
import {
  useFonts as useNunito,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
// 8) Nunito Sans
import {
  useFonts as useNunitoSans,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
} from "@expo-google-fonts/nunito-sans";
// 9) Raleway
import {
  useFonts as useRaleway,
  Raleway_500Medium,
  Raleway_700Bold,
} from "@expo-google-fonts/raleway";
// 10) Playfair Display
import {
  useFonts as usePlayfair,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
// 11) Merriweather
import {
  useFonts as useMerriweather,
  Merriweather_400Regular,
  Merriweather_700Bold,
} from "@expo-google-fonts/merriweather";
// 12) DM Sans
import {
  useFonts as useDMSans,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
// 13) DM Serif Display
import {
  useFonts as useDMSerifDisplay,
  DMSerifDisplay_400Regular,
} from "@expo-google-fonts/dm-serif-display";
// 14) Manrope
import {
  useFonts as useManrope,
  Manrope_500Medium,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
// 15) Rubik
import {
  useFonts as useRubik,
  Rubik_500Medium,
  Rubik_700Bold,
} from "@expo-google-fonts/rubik";
// 16) Work Sans
import {
  useFonts as useWorkSans,
  WorkSans_500Medium,
  WorkSans_700Bold,
} from "@expo-google-fonts/work-sans";
// 17) Oswald
import {
  useFonts as useOswald,
  Oswald_400Regular,
  Oswald_500Medium,
} from "@expo-google-fonts/oswald";
// 18) Archivo
import {
  useFonts as useArchivo,
  Archivo_500Medium,
  Archivo_700Bold,
} from "@expo-google-fonts/archivo";
// 19) Quicksand
import {
  useFonts as useQuicksand,
  Quicksand_500Medium,
  Quicksand_700Bold,
} from "@expo-google-fonts/quicksand";
// 20) Urbanist
import {
  useFonts as useUrbanist,
  Urbanist_500Medium,
  Urbanist_700Bold,
} from "@expo-google-fonts/urbanist";
// 21) Fira Sans
import {
  useFonts as useFiraSans,
  FiraSans_500Medium,
  FiraSans_700Bold,
} from "@expo-google-fonts/fira-sans";
// 22) Bebas Neue
import {
  useFonts as useBebas,
  BebasNeue_400Regular,
} from "@expo-google-fonts/bebas-neue";
// 23) Anton
import {
  useFonts as useAnton,
  Anton_400Regular,
} from "@expo-google-fonts/anton";
// 24) Cabin
import {
  useFonts as useCabin,
  Cabin_500Medium,
  Cabin_700Bold,
} from "@expo-google-fonts/cabin";
// 25) Pacifico
import {
  useFonts as usePacifico,
  Pacifico_400Regular,
} from "@expo-google-fonts/pacifico";

// ------------------------------------------------------------------

export type BackgroundOption = {
  key: string;
  label: string;
  image: ImageSourcePropType;
};

export type TextStyleConfig = {
  color: string;
  fontFamily?: string;
  fontSize: number;
  letterSpacing?: number;
  shadowColor?: string;
  bubbleColor?: string;
};

export type AlignOption = "left" | "center" | "right";

export type StyledTextValue = {
  text: string;
  style: TextStyleConfig;
  bgKey: string;
  align: AlignOption;
};

export const DEFAULT_TEXT_STYLE: TextStyleConfig = {
  color: "#ffffff",
  fontSize: 24,
  letterSpacing: 0.5,
  shadowColor: "#000000",
  bubbleColor: "rgba(0,0,0,0.55)",
  // fuente base por defecto
  fontFamily: "Poppins_400Regular",
};

type Props = {
  value: StyledTextValue;
  onChange: (v: StyledTextValue) => void;
  backgrounds: BackgroundOption[];
  maxLength?: number;
};

/* ---------------- PALETA COLORES (incluye neones) --------------- */

const TEXT_COLORS: string[] = [
  "#FFFFFF",
  "#F5F5F5",
  "#E0E0E0",
  "#000000",
  "#FFCDD2",
  "#F8BBD0",
  "#E1BEE7",
  "#D1C4E9",
  "#BBDEFB",
  "#B3E5FC",
  "#B2EBF2",
  "#C8E6C9",
  "#DCEDC8",
  "#FFF9C4",
  "#FFE0B2",
  "#FFCCBC",
  "#FF8A80",
  "#FF5252",
  "#FF1744",
  "#E040FB",
  "#7C4DFF",
  "#2979FF",
  "#00B0FF",
  "#00E5FF",
  "#1DE9B6",
  "#00E676",
  "#FFEA00",
  "#FFC400",
  "#FF9100",
  "#39FF14",
  "#CCFF00",
  "#00FFFF",
  "#00F0FF",
  "#FF6EC7",
  "#FF00FF",
  "#F5FF00",
  "#FF4D00",
];

const SHADOW_COLORS: string[] = [
  "#000000",
  "#111111",
  "#212121",
  "#424242",
  "#616161",
  "#9E9E9E",
  "#FFFFFF",
  "#39FF14",
  "#FF6EC7",
  "#00FFFF",
  "#FFEA00",
  "#FF00FF",
];

const BUBBLE_COLORS: string[] = [
  "rgba(0,0,0,0)",
  "rgba(0,0,0,0.35)",
  "rgba(0,0,0,0.55)",
  "rgba(0,0,0,0.75)",
  "rgba(255,255,255,0.18)",
  "rgba(255,255,255,0.38)",
  "rgba(255,255,255,0.75)",
  "rgba(57,255,20,0.55)",
  "rgba(0,255,255,0.55)",
  "rgba(255,110,199,0.55)",
  "rgba(255,234,0,0.55)",
];

const TEXT_STYLE_PRESETS: {
  key: string;
  label: string;
  style: TextStyleConfig;
}[] = [
  {
    key: "simple",
    label: "Simple",
    style: {
      color: "#ffffff",
      fontSize: 24,
      letterSpacing: 0.5,
    },
  },
  {
    key: "big",
    label: "Grande",
    style: {
      color: "#ffffff",
      fontSize: 32,
      letterSpacing: 0.5,
    },
  },
  {
    key: "contrast",
    label: "Contraste",
    style: {
      color: "#000000",
      fontSize: 26,
      letterSpacing: 0.8,
    },
  },
];

const ALIGN_OPTIONS: { key: AlignOption; icon: string; label: string }[] = [
  { key: "left", icon: "format-align-left", label: "Izq." },
  { key: "center", icon: "format-align-center", label: "Centro" },
  { key: "right", icon: "format-align-right", label: "Der." },
];

/* ------------------- OPCIONES DE FUENTE (CARRUSEL) ------------------- */

const FONT_OPTIONS: { key: string; label: string }[] = [
  { key: "System", label: "Sistema" },
  { key: "Poppins_400Regular", label: "Poppins" },
  { key: "Montserrat_500Medium", label: "Montserrat" },
  { key: "Inter_500Medium", label: "Inter" },
  { key: "Roboto_400Regular", label: "Roboto" },
  { key: "OpenSans_400Regular", label: "Open Sans" },
  { key: "Lato_400Regular", label: "Lato" },
  { key: "Nunito_600SemiBold", label: "Nunito" },
  { key: "NunitoSans_600SemiBold", label: "Nunito Sans" },
  { key: "Raleway_500Medium", label: "Raleway" },
  { key: "PlayfairDisplay_500Medium", label: "Playfair" },
  { key: "Merriweather_400Regular", label: "Merriweather" },
  { key: "DMSans_500Medium", label: "DM Sans" },
  { key: "DMSerifDisplay_400Regular", label: "DM Serif" },
  { key: "Manrope_500Medium", label: "Manrope" },
  { key: "Rubik_500Medium", label: "Rubik" },
  { key: "WorkSans_500Medium", label: "Work Sans" },
  { key: "Oswald_400Regular", label: "Oswald" },
  { key: "Archivo_500Medium", label: "Archivo" },
  { key: "Quicksand_500Medium", label: "Quicksand" },
  { key: "Urbanist_500Medium", label: "Urbanist" },
  { key: "FiraSans_500Medium", label: "Fira Sans" },
  { key: "BebasNeue_400Regular", label: "Bebas" },
  { key: "Anton_400Regular", label: "Anton" },
  { key: "Cabin_500Medium", label: "Cabin" },
  { key: "Pacifico_400Regular", label: "Pacifico" },
];

type Tool = "bg" | "color" | "shadow" | "bubble" | "align" | "style" | "font";

export default function ComposeTextStyle({
  value,
  onChange,
  backgrounds,
  maxLength = 200,
}: Props) {
  const insets = useSafeAreaInsets();
  const [activeTool, setActiveTool] = useState<Tool>("bg");

  // estado LOCAL → escribir fluido, sin re-render del padre
  const [localValue, setLocalValue] = useState<StyledTextValue>(value);

  // ------------------------- CARGA DE FUENTES -------------------------
  const [poppinsLoaded] = usePoppins({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  });
  const [montLoaded] = useMontserrat({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });
  const [interLoaded] = useInter({
    Inter_500Medium,
    Inter_700Bold,
  });
  const [robotoLoaded] = useRoboto({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });
  const [osLoaded] = useOpenSans({
    OpenSans_400Regular,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
  });
  const [latoLoaded] = useLato({
    Lato_400Regular,
    Lato_700Bold,
  });
  const [nunitoLoaded] = useNunito({
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
  const [nunitoSansLoaded] = useNunitoSans({
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });
  const [ralewayLoaded] = useRaleway({
    Raleway_500Medium,
    Raleway_700Bold,
  });
  const [playfairLoaded] = usePlayfair({
    PlayfairDisplay_500Medium,
    PlayfairDisplay_700Bold,
  });
  const [merriLoaded] = useMerriweather({
    Merriweather_400Regular,
    Merriweather_700Bold,
  });
  const [dmSansLoaded] = useDMSans({
    DMSans_500Medium,
    DMSans_700Bold,
  });
  const [dmSerifLoaded] = useDMSerifDisplay({
    DMSerifDisplay_400Regular,
  });
  const [manropeLoaded] = useManrope({
    Manrope_500Medium,
    Manrope_700Bold,
  });
  const [rubikLoaded] = useRubik({
    Rubik_500Medium,
    Rubik_700Bold,
  });
  const [workSansLoaded] = useWorkSans({
    WorkSans_500Medium,
    WorkSans_700Bold,
  });
  const [oswaldLoaded] = useOswald({
    Oswald_400Regular,
    Oswald_500Medium,
  });
  const [archivoLoaded] = useArchivo({
    Archivo_500Medium,
    Archivo_700Bold,
  });
  const [quicksandLoaded] = useQuicksand({
    Quicksand_500Medium,
    Quicksand_700Bold,
  });
  const [urbanistLoaded] = useUrbanist({
    Urbanist_500Medium,
    Urbanist_700Bold,
  });
  const [firaLoaded] = useFiraSans({
    FiraSans_500Medium,
    FiraSans_700Bold,
  });
  const [bebasLoaded] = useBebas({
    BebasNeue_400Regular,
  });
  const [antonLoaded] = useAnton({
    Anton_400Regular,
  });
  const [cabinLoaded] = useCabin({
    Cabin_500Medium,
    Cabin_700Bold,
  });
  const [pacificLoaded] = usePacifico({
    Pacifico_400Regular,
  });

  const fontsReady = [
    poppinsLoaded,
    montLoaded,
    interLoaded,
    robotoLoaded,
    osLoaded,
    latoLoaded,
    nunitoLoaded,
    nunitoSansLoaded,
    ralewayLoaded,
    playfairLoaded,
    merriLoaded,
    dmSansLoaded,
    dmSerifLoaded,
    manropeLoaded,
    rubikLoaded,
    workSansLoaded,
    oswaldLoaded,
    archivoLoaded,
    quicksandLoaded,
    urbanistLoaded,
    firaLoaded,
    bebasLoaded,
    antonLoaded,
    cabinLoaded,
    pacificLoaded,
  ].every(Boolean);

  // si el padre cambia (por ejemplo, edición de un post), sincronizamos
  useEffect(() => {
    setLocalValue(value);
  }, [
    value.text,
    value.bgKey,
    value.align,
    value.style.color,
    value.style.fontSize,
    value.style.letterSpacing,
    value.style.shadowColor,
    value.style.bubbleColor,
    value.style.fontFamily,
  ]);

  const currentBackground = useMemo(
    () =>
      backgrounds.find((b) => b.key === localValue.bgKey) ||
      backgrounds[0] ||
      null,
    [backgrounds, localValue.bgKey]
  );

  const currentPresetKey = useMemo(() => {
    const found = TEXT_STYLE_PRESETS.find(
      (p) =>
        p.style.fontSize === localValue.style.fontSize &&
        (p.style.letterSpacing ?? 0) ===
          (localValue.style.letterSpacing ?? 0)
    );
    return found?.key ?? "custom";
  }, [localValue.style.fontSize, localValue.style.letterSpacing]);

  const remaining = maxLength - (localValue.text?.length ?? 0);

  const currentFontKey = localValue.style.fontFamily ?? "System";

  if (!currentBackground) {
    return (
      <View style={styles.noBgFallback}>
        <Text>No hay fondos configurados</Text>
      </View>
    );
  }

  if (!fontsReady) {
    return (
      <View style={styles.noBgFallback}>
        <Text style={{ color: "#fff" }}>Cargando tipografías…</Text>
      </View>
    );
  }

  const applyChange = (next: StyledTextValue) => {
    setLocalValue(next);
    onChange(next);
  };

  const shadowColor =
    localValue.style.shadowColor ?? DEFAULT_TEXT_STYLE.shadowColor;
  const bubbleColor =
    localValue.style.bubbleColor ?? DEFAULT_TEXT_STYLE.bubbleColor;

  // ⚙️ Fallback de fuente: primero local, si no, DEFAULT_TEXT_STYLE.fontFamily
  const rawFontKey =
    localValue.style.fontFamily ?? DEFAULT_TEXT_STYLE.fontFamily;

  const effectiveFontFamily =
    rawFontKey && rawFontKey !== "System"
      ? (rawFontKey as any)
      : undefined; // "System" => fuente por defecto del sistema

  return (
    <View style={styles.root}>
      <ImageBackground
        source={currentBackground.image}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <View
          style={[
            styles.overlay,
            {
              paddingTop: insets.top + 88,
              paddingBottom: insets.bottom + 24,
            },
          ]}
        >
          {/* Bloque de texto central con burbuja */}
          <View style={styles.textWrapper}>
            <View
              style={[
                styles.textBubble,
                {
                  alignSelf:
                    localValue.align === "left"
                      ? "flex-start"
                      : localValue.align === "right"
                      ? "flex-end"
                      : "center",
                  backgroundColor: bubbleColor,
                },
              ]}
            >
              <TextInput
                value={localValue.text}
                onChangeText={(t) => {
                  const limited = t.slice(0, maxLength);
                  applyChange({
                    ...localValue,
                    text: limited,
                  });
                }}
                placeholder="Escribe tu publicación…"
                placeholderTextColor="rgba(255,255,255,0.8)"
                style={[
                  styles.textInput,
                  {
                    color: localValue.style.color,
                    fontSize: localValue.style.fontSize,
                    letterSpacing: localValue.style.letterSpacing,
                    textAlign: localValue.align,
                    textShadowColor: shadowColor,
                    fontFamily: effectiveFontFamily,
                  } as any,
                ]}
                multiline
                maxLength={maxLength}
                textAlignVertical="top"   // 👈 ahora escribe desde arriba, sin saltos raros
                underlineColorAndroid="transparent"
                allowFontScaling={false}
              />
            </View>
          </View>

          {/* Panel inferior */}
          <View style={styles.bottomPanel}>
            <View style={styles.counterRow}>
              <Text style={styles.counterText}>{remaining} caracteres</Text>
            </View>

            {/* Barra de herramientas (scroll horizontal) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.toolsRow}
            >
              {/* Fondos */}
              <View style={styles.toolIconCol}>
                <TouchableOpacity
                  style={[
                    styles.toolIconBtn,
                    activeTool === "bg" && styles.toolIconBtnActive,
                  ]}
                  onPress={() => setActiveTool("bg")}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="image-filter-frames"
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
                <Text style={styles.toolIconLabel}>Fondos</Text>
              </View>

              {/* Color texto */}
              <View style={styles.toolIconCol}>
                <TouchableOpacity
                  style={[
                    styles.toolIconBtn,
                    activeTool === "color" && styles.toolIconBtnActive,
                  ]}
                  onPress={() => setActiveTool("color")}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="palette"
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
                <Text style={styles.toolIconLabel}>Color</Text>
              </View>

              {/* Sombra */}
              <View style={styles.toolIconCol}>
                <TouchableOpacity
                  style={[
                    styles.toolIconBtn,
                    activeTool === "shadow" && styles.toolIconBtnActive,
                  ]}
                  onPress={() => setActiveTool("shadow")}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="blur"
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
                <Text style={styles.toolIconLabel}>Sombra</Text>
              </View>

              {/* Burbuja */}
              <View style={styles.toolIconCol}>
                <TouchableOpacity
                  style={[
                    styles.toolIconBtn,
                    activeTool === "bubble" && styles.toolIconBtnActive,
                  ]}
                  onPress={() => setActiveTool("bubble")}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="checkbox-blank-circle-outline"
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
                <Text style={styles.toolIconLabel}>Burbuja</Text>
              </View>

              {/* Alineado */}
              <View style={styles.toolIconCol}>
                <TouchableOpacity
                  style={[
                    styles.toolIconBtn,
                    activeTool === "align" && styles.toolIconBtnActive,
                  ]}
                  onPress={() => setActiveTool("align")}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="format-align-center"
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
                <Text style={styles.toolIconLabel}>Alineado</Text>
              </View>

              {/* Tamaño / estilo */}
              <View style={styles.toolIconCol}>
                <TouchableOpacity
                  style={[
                    styles.toolIconBtn,
                    activeTool === "style" && styles.toolIconBtnActive,
                  ]}
                  onPress={() => setActiveTool("style")}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="format-size"
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
                <Text style={styles.toolIconLabel}>Tamaño</Text>
              </View>

              {/* 🔤 Tipo de fuente */}
              <View style={styles.toolIconCol}>
                <TouchableOpacity
                  style={[
                    styles.toolIconBtn,
                    activeTool === "font" && styles.toolIconBtnActive,
                  ]}
                  onPress={() => setActiveTool("font")}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="format-letter-case"
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
                <Text style={styles.toolIconLabel}>Fuente</Text>
              </View>
            </ScrollView>

            {/* Contenido de la herramienta seleccionada */}
            <View style={styles.toolContent}>
              {activeTool === "bg" && (
                <>
                  <Text style={styles.sectionTitle}>Fondos</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.row}
                  >
                    {backgrounds.map((bg) => {
                      const selected = bg.key === localValue.bgKey;
                      return (
                        <TouchableOpacity
                          key={bg.key}
                          style={[
                            styles.bgThumb,
                            selected && styles.bgThumbSelected,
                          ]}
                          onPress={() =>
                            applyChange({
                              ...localValue,
                              bgKey: bg.key,
                            })
                          }
                          activeOpacity={0.8}
                        >
                          <ImageBackground
                            source={bg.image}
                            style={styles.bgThumbImage}
                            resizeMode="cover"
                          >
                            <View style={styles.bgThumbOverlay} />
                          </ImageBackground>
                          <Text
                            style={[
                              styles.bgThumbLabel,
                              selected && styles.bgThumbLabelSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {bg.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {activeTool === "color" && (
                <>
                  <Text style={styles.sectionTitle}>Color de texto</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.colorRow}
                  >
                    {TEXT_COLORS.map((c) => {
                      const selected =
                        localValue.style.color.toLowerCase() ===
                        c.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={c}
                          onPress={() =>
                            applyChange({
                              ...localValue,
                              style: {
                                ...localValue.style,
                                color: c,
                              },
                            })
                          }
                          activeOpacity={0.8}
                          style={[
                            styles.colorDot,
                            {
                              backgroundColor: c,
                              borderColor: selected
                                ? "#ffffff"
                                : "rgba(255,255,255,0.35)",
                              borderWidth: selected ? 2 : 1,
                            },
                          ]}
                        />
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {activeTool === "shadow" && (
                <>
                  <Text style={styles.sectionTitle}>Color de sombra</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.colorRow}
                  >
                    {SHADOW_COLORS.map((c) => {
                      const currentShadow =
                        localValue.style.shadowColor ??
                        DEFAULT_TEXT_STYLE.shadowColor;
                      const selected =
                        currentShadow.toLowerCase() === c.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={c}
                          onPress={() =>
                            applyChange({
                              ...localValue,
                              style: {
                                ...localValue.style,
                                shadowColor: c,
                              },
                            })
                          }
                          activeOpacity={0.8}
                          style={[
                            styles.colorDot,
                            {
                              backgroundColor: c,
                              borderColor: selected
                                ? "#ffffff"
                                : "rgba(255,255,255,0.35)",
                              borderWidth: selected ? 2 : 1,
                            },
                          ]}
                        />
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {activeTool === "bubble" && (
                <>
                  <Text style={styles.sectionTitle}>Color de burbuja</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.colorRow}
                  >
                    {BUBBLE_COLORS.map((c) => {
                      const currentBubble =
                        localValue.style.bubbleColor ??
                        DEFAULT_TEXT_STYLE.bubbleColor!;
                      const selected =
                        currentBubble.toLowerCase() === c.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={c}
                          onPress={() =>
                            applyChange({
                              ...localValue,
                              style: {
                                ...localValue.style,
                                bubbleColor: c,
                              },
                            })
                          }
                          activeOpacity={0.8}
                          style={[
                            styles.colorDot,
                            {
                              backgroundColor: c,
                              borderColor: selected
                                ? "#ffffff"
                                : "rgba(255,255,255,0.35)",
                              borderWidth: selected ? 2 : 1,
                            },
                          ]}
                        />
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {activeTool === "align" && (
                <>
                  <Text style={styles.sectionTitle}>Alineado</Text>
                  <View style={styles.alignRow}>
                    {ALIGN_OPTIONS.map((opt) => {
                      const selected = localValue.align === opt.key;
                      return (
                        <TouchableOpacity
                          key={opt.key}
                          style={[
                            styles.alignBtn,
                            selected && styles.alignBtnActive,
                          ]}
                          onPress={() =>
                            applyChange({
                              ...localValue,
                              align: opt.key,
                            })
                          }
                          activeOpacity={0.9}
                        >
                          <MaterialCommunityIcons
                            name={opt.icon as any}
                            size={18}
                            color="#fff"
                          />
                          <Text style={styles.alignLabel}>{opt.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {activeTool === "style" && (
                <>
                  <Text style={styles.sectionTitle}>Estilo de texto</Text>
                  <View style={styles.row}>
                    {TEXT_STYLE_PRESETS.map((preset) => {
                      const selected = preset.key === currentPresetKey;
                      return (
                        <TouchableOpacity
                          key={preset.key}
                          style={[
                            styles.pill,
                            selected && styles.pillSelected,
                          ]}
                          onPress={() =>
                            applyChange({
                              ...localValue,
                              style: {
                                ...preset.style,
                                color: localValue.style.color, // conserva color actual
                                shadowColor:
                                  localValue.style.shadowColor ??
                                  DEFAULT_TEXT_STYLE.shadowColor,
                                bubbleColor:
                                  localValue.style.bubbleColor ??
                                  DEFAULT_TEXT_STYLE.bubbleColor,
                                // conserva la fuente actual
                                fontFamily:
                                  localValue.style.fontFamily ??
                                  DEFAULT_TEXT_STYLE.fontFamily,
                              },
                            })
                          }
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.pillText,
                              selected && styles.pillTextSelected,
                            ]}
                          >
                            {preset.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {activeTool === "font" && (
                <>
                  <Text style={styles.sectionTitle}>Tipo de letra</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.row}
                  >
                    {FONT_OPTIONS.map((f) => {
                      const selected = currentFontKey === f.key;
                      return (
                        <TouchableOpacity
                          key={f.key}
                          style={[
                            styles.pill,
                            selected && styles.pillSelected,
                          ]}
                          onPress={() =>
                            applyChange({
                              ...localValue,
                              style: {
                                ...localValue.style,
                                // siempre guardamos la key (incluye "System")
                                fontFamily: f.key,
                              },
                            })
                          }
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.pillText,
                              selected && styles.pillTextSelected,
                              f.key !== "System" && {
                                fontFamily: f.key as any,
                              },
                            ]}
                          >
                            {f.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bgImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  textWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  // burbuja de sombreado tipo FeedImageCard pero más redonda
  textBubble: {
    maxWidth: "86%",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,         // 👈 mucho más redonda
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  textInput: {
    textAlign: "center",
    color: "#fff",
    fontSize: 24,
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
    includeFontPadding: false,
  },
  bottomPanel: {
    paddingTop: 8,
  },
  counterRow: {
    alignItems: "flex-end",
    marginBottom: 4,
  },
  counterText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
  },

  /* -------- barra de herramientas -------- */
  toolsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 4,
    columnGap: 14,
  },
  toolIconCol: {
    alignItems: "center",
  },
  toolIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  toolIconBtnActive: {
    backgroundColor: "rgba(111,217,197,0.45)",
    borderColor: "#6FD9C5",
  },
  toolIconLabel: {
    color: "#fff",
    fontSize: 10,
    marginTop: 4,
    opacity: 0.9,
  },

  toolContent: {
    marginTop: 4,
  },

  sectionTitle: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 13,
    marginBottom: 4,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },

  bgThumb: {
    width: 80,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "transparent",
  },
  bgThumbSelected: {
    borderColor: "#ffffff",
  },
  bgThumbImage: {
    width: "100%",
    height: 46,
    justifyContent: "flex-end",
  },
  bgThumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  bgThumbLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  bgThumbLabelSelected: {
    color: "#fff",
    fontWeight: "600",
  },

  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },

  /* -------- alineado -------- */
  alignRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  alignBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  alignBtnActive: {
    backgroundColor: "rgba(111,217,197,0.45)",
    borderColor: "#6FD9C5",
  },
  alignLabel: {
    color: "#fff",
    fontSize: 11,
  },

  /* -------- presets tamaño / botones -------- */
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  pillSelected: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderColor: "rgba(255,255,255,1)",
  },
  pillText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
  },
  pillTextSelected: {
    color: "#111",
    fontWeight: "600",
  },

  noBgFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
});
