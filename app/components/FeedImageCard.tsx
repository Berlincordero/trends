import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  BASE,
  FeedPost,
  TextCaptionMeta,
  TextCaptionStyleMeta,
  toAbsolute,
  trackView,
  fetchCommentsStats,
  toggleFeedStar,
} from "../../lib/api";
import CommentsSheet from "./CommentsSheet";
import PostStarsSheet from "./PostStarsSheet";

const JADE = "#6FD9C5";
const BG = "#000";

const NEON_COLORS = ["#39FF14", "#FF6EC7", "#00FFFF", "#FFD700", "#FF00FF"];

const AVATAR_SIZE = 56;
const GUTTER = 12;
const BETWEEN = 6;

const SIDE_MARGIN_PORTRAIT = 12;
const SIDE_MARGIN_LANDSCAPE = 28;
const ICONS_GAP_BELOW = 52;
const ICONS_ROW_MAX_WIDTH = 210;
const CAPTION_MAX_WIDTH = "68%";

const CAPTION_FONT_SIZE = 12;
const CAPTION_LINE_HEIGHT = 20;
const CAPTION_VISIBLE_LINES = 3;
const MIDCAPTION_PAD_V = 6;

const CAPTION_GAP_OVER_BAR = 100;

// ---- Texto central tipo post de texto ----
const TEXT_POST_LINE_HEIGHT = 26;
const TEXT_POST_VISIBLE_LINES_416 = 3;

/* ------------------------------------------------------------------
   CARGA DE FUENTES (las mismas familias que se usan en captions)
------------------------------------------------------------------- */

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
// 8) Raleway
import {
  useFonts as useRaleway,
  Raleway_500Medium,
  Raleway_700Bold,
} from "@expo-google-fonts/raleway";
// 9) Playfair Display
import {
  useFonts as usePlayfair,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
// 10) Merriweather
import {
  useFonts as useMerriweather,
  Merriweather_400Regular,
  Merriweather_700Bold,
} from "@expo-google-fonts/merriweather";
// 11) DM Sans
import {
  useFonts as useDMSans,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
// 12) Manrope
import {
  useFonts as useManrope,
  Manrope_500Medium,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
// 13) Rubik
import {
  useFonts as useRubik,
  Rubik_500Medium,
  Rubik_700Bold,
} from "@expo-google-fonts/rubik";
// 14) Bebas Neue
import {
  useFonts as useBebas,
  BebasNeue_400Regular,
} from "@expo-google-fonts/bebas-neue";

// 15) Nunito Sans
import {
  useFonts as useNunitoSans,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
} from "@expo-google-fonts/nunito-sans";
// 16) DM Serif Display
import {
  useFonts as useDMSerifDisplay,
  DMSerifDisplay_400Regular,
} from "@expo-google-fonts/dm-serif-display";
// 17) Work Sans
import {
  useFonts as useWorkSans,
  WorkSans_500Medium,
  WorkSans_700Bold,
} from "@expo-google-fonts/work-sans";
// 18) Oswald
import {
  useFonts as useOswald,
  Oswald_400Regular,
  Oswald_500Medium,
} from "@expo-google-fonts/oswald";
// 19) Archivo
import {
  useFonts as useArchivo,
  Archivo_500Medium,
  Archivo_700Bold,
} from "@expo-google-fonts/archivo";
// 20) Quicksand
import {
  useFonts as useQuicksand,
  Quicksand_500Medium,
  Quicksand_700Bold,
} from "@expo-google-fonts/quicksand";
// 21) Urbanist
import {
  useFonts as useUrbanist,
  Urbanist_500Medium,
  Urbanist_700Bold,
} from "@expo-google-fonts/urbanist";
// 22) Fira Sans
import {
  useFonts as useFiraSans,
  FiraSans_500Medium,
  FiraSans_700Bold,
} from "@expo-google-fonts/fira-sans";
// 23) Anton
import {
  useFonts as useAnton,
  Anton_400Regular,
} from "@expo-google-fonts/anton";
// 24) Pacifico
import {
  useFonts as usePacifico,
  Pacifico_400Regular,
} from "@expo-google-fonts/pacifico";

/* ------------------------------------------------------------------ */
/* Mapa de variantes igual que en CommentsSheet (para manejar bold)   */
/* ------------------------------------------------------------------ */

const FONT_VARIANTS: Record<
  string,
  {
    normal: string;
    bold: string;
  }
> = {
  Poppins_400Regular: {
    normal: "Poppins_400Regular",
    bold: "Poppins_500Medium",
  },
  Poppins_500Medium: {
    normal: "Poppins_500Medium",
    bold: "Poppins_700Bold",
  },
  Montserrat_500Medium: {
    normal: "Montserrat_500Medium",
    bold: "Montserrat_600SemiBold",
  },
  Inter_500Medium: { normal: "Inter_500Medium", bold: "Inter_700Bold" },
  Roboto_400Regular: { normal: "Roboto_400Regular", bold: "Roboto_500Medium" },
  Roboto_500Medium: { normal: "Roboto_500Medium", bold: "Roboto_700Bold" },
  OpenSans_400Regular: {
    normal: "OpenSans_400Regular",
    bold: "OpenSans_700Bold",
  },
  Lato_400Regular: { normal: "Lato_400Regular", bold: "Lato_700Bold" },
  Nunito_600SemiBold: { normal: "Nunito_600SemiBold", bold: "Nunito_700Bold" },
  Raleway_500Medium: { normal: "Raleway_500Medium", bold: "Raleway_700Bold" },
  PlayfairDisplay_500Medium: {
    normal: "PlayfairDisplay_500Medium",
    bold: "PlayfairDisplay_700Bold",
  },
  Merriweather_400Regular: {
    normal: "Merriweather_400Regular",
    bold: "Merriweather_700Bold",
  },
  DMSans_500Medium: { normal: "DMSans_500Medium", bold: "DMSans_700Bold" },
  Manrope_500Medium: { normal: "Manrope_500Medium", bold: "Manrope_700Bold" },
  Rubik_500Medium: { normal: "Rubik_500Medium", bold: "Rubik_700Bold" },
  BebasNeue_400Regular: {
    normal: "BebasNeue_400Regular",
    bold: "BebasNeue_400Regular",
  },

  // Nuevas fuentes
  NunitoSans_600SemiBold: {
    normal: "NunitoSans_600SemiBold",
    bold: "NunitoSans_700Bold",
  },
  DMSerifDisplay_400Regular: {
    normal: "DMSerifDisplay_400Regular",
    bold: "DMSerifDisplay_400Regular",
  },
  WorkSans_500Medium: {
    normal: "WorkSans_500Medium",
    bold: "WorkSans_700Bold",
  },
  Oswald_400Regular: {
    normal: "Oswald_400Regular",
    bold: "Oswald_500Medium",
  },
  Archivo_500Medium: {
    normal: "Archivo_500Medium",
    bold: "Archivo_700Bold",
  },
  Quicksand_500Medium: {
    normal: "Quicksand_500Medium",
    bold: "Quicksand_700Bold",
  },
  Urbanist_500Medium: {
    normal: "Urbanist_500Medium",
    bold: "Urbanist_700Bold",
  },
  FiraSans_500Medium: {
    normal: "FiraSans_500Medium",
    bold: "FiraSans_700Bold",
  },
  Anton_400Regular: {
    normal: "Anton_400Regular",
    bold: "Anton_400Regular",
  },
  Pacifico_400Regular: {
    normal: "Pacifico_400Regular",
    bold: "Pacifico_400Regular",
  },
};

/* ------------------------------------------------------------------ */

function normalizeCommentStats(raw: any) {
  const commentsExplicit =
    raw?.total_count ?? raw?.comments_count ?? raw?.comments ?? 0;
  const repliesExplicit = raw?.replies_count ?? raw?.replies ?? 0;
  const total =
    typeof raw?.total_count === "number"
      ? raw.total_count
      : (Number(commentsExplicit) || 0) + (Number(repliesExplicit) || 0);
  const stars = raw?.stars_count ?? raw?.stars ?? 0;
  return {
    comments_count: Number(commentsExplicit) || 0,
    replies_count: Number(repliesExplicit) || 0,
    total_count: Number(total) || 0,
    stars_count: Number(stars) || 0,
  };
}

/** padding anti-clip de emojis en Android */
function padForAndroidEmojiClip(s: string): string {
  if (Platform.OS !== "android") return s;
  const txt = String(s ?? "");
  const GLYPH_PAD = "\u200A"; // hair space
  const WJ = "\u2060"; // word joiner
  const safe = `${GLYPH_PAD}${txt}${WJ}${GLYPH_PAD}`;
  return safe.length < 12 ? safe + GLYPH_PAD.repeat(2) : safe;
}

type Props = {
  item: FeedPost;
  isLandscape?: boolean;
};

/** Igual que en comments: resuelve fontFamily / fontWeight según el estilo */
function getFinalFontForStyle(
  style?: TextCaptionStyleMeta
): { fontFamily?: string; fontWeight?: "400" | "700" } {
  if (!style) style = {};
  const family = style.fontFamily;
  const weight = (style as any).weight as "normal" | "bold" | undefined;

  // System → usamos fontWeight
  if (!family || family === "System") {
    return {
      fontFamily: undefined,
      fontWeight: weight === "bold" ? "700" : undefined,
    };
  }

  // Custom → elegimos variante y no usamos fontWeight (para que RN no rompa)
  const variant = FONT_VARIANTS[family];
  if (variant) {
    return {
      fontFamily: weight === "bold" ? variant.bold : variant.normal,
      fontWeight: undefined,
    };
  }
  return {
    fontFamily: family,
    fontWeight: undefined,
  };
}

export default function FeedImageCard({ item, isLandscape = false }: Props) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [starsOpen, setStarsOpen] = useState(false);
  const [commentStats, setCommentStats] = useState({
    comments_count: 0,
    replies_count: 0,
    total_count: 0,
    stars_count: 0,
  });
  const [postStarsCount, setPostStarsCount] = useState<number>(
    typeof item.stars_count === "number" ? item.stars_count : 0
  );
  const [postStarred, setPostStarred] = useState<boolean>(!!item.starred);

  const [cardH, setCardH] = useState(0);
  const [fourSixteen, setFourSixteen] = useState(false);

  const [hashColorIndex, setHashColorIndex] = useState(0);
  const hashColor = NEON_COLORS[hashColorIndex];

  const mediaUrl = useMemo(
    () => toAbsolute(item.media) || item.media,
    [item.media]
  );

  const avatarUri = item.author.avatar
    ? item.author.avatar.startsWith("http")
      ? item.author.avatar
      : `${BASE}/media/${item.author.avatar.replace(/^\/+/, "")}`
    : undefined;

  const sideMargin = isLandscape ? SIDE_MARGIN_LANDSCAPE : SIDE_MARGIN_PORTRAIT;

  /* -------------------- CARGA DE FUENTES -------------------- */

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
  const [manropeLoaded] = useManrope({
    Manrope_500Medium,
    Manrope_700Bold,
  });
  const [rubikLoaded] = useRubik({
    Rubik_500Medium,
    Rubik_700Bold,
  });
  const [bebasLoaded] = useBebas({
    BebasNeue_400Regular,
  });

  const [nunitoSansLoaded] = useNunitoSans({
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });
  const [dmSerifLoaded] = useDMSerifDisplay({
    DMSerifDisplay_400Regular,
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
  const [antonLoaded] = useAnton({
    Anton_400Regular,
  });
  const [pacificoLoaded] = usePacifico({
    Pacifico_400Regular,
  });

  const fontsReady =
    poppinsLoaded &&
    montLoaded &&
    interLoaded &&
    robotoLoaded &&
    osLoaded &&
    latoLoaded &&
    nunitoLoaded &&
    ralewayLoaded &&
    playfairLoaded &&
    merriLoaded &&
    dmSansLoaded &&
    manropeLoaded &&
    rubikLoaded &&
    bebasLoaded &&
    nunitoSansLoaded &&
    dmSerifLoaded &&
    workSansLoaded &&
    oswaldLoaded &&
    archivoLoaded &&
    quicksandLoaded &&
    urbanistLoaded &&
    firaLoaded &&
    antonLoaded &&
    pacificoLoaded;

  /* -------------------- CAPTION: detectar post de texto -------------------- */

  const textCaptionMeta: TextCaptionMeta | null = useMemo(() => {
    // 1) caption_meta puede venir como objeto o como string JSON
    const rawMeta: any = (item as any).caption_meta;

    if (rawMeta) {
      if (typeof rawMeta === "object") {
        if (rawMeta.kind === "text" && typeof rawMeta.text === "string") {
          return rawMeta as TextCaptionMeta;
        }
      } else if (typeof rawMeta === "string") {
        try {
          const parsed = JSON.parse(rawMeta);
          if (parsed && parsed.kind === "text" && typeof parsed.text === "string") {
            return parsed as TextCaptionMeta;
          }
        } catch (e) {
          if (__DEV__) console.warn("caption_meta no parseable:", e);
        }
      }
    }

    // 2) Fallback: intentar parsear item.caption (posts antiguos)
    const rawCaption: any = item.caption;
    if (!rawCaption) return null;

    if (typeof rawCaption === "object") {
      if (
        rawCaption &&
        rawCaption.kind === "text" &&
        typeof rawCaption.text === "string"
      ) {
        return rawCaption as TextCaptionMeta;
      }
      return null;
    }

    if (typeof rawCaption === "string") {
      try {
        const parsed = JSON.parse(rawCaption);
        if (parsed && parsed.kind === "text" && typeof parsed.text === "string") {
          return parsed as TextCaptionMeta;
        }
      } catch {
        // no es JSON → caption normal
      }
    }

    return null;
  }, [item.caption, (item as any).caption_meta]);

  const isTextPost = !!textCaptionMeta;

  // contar vista
  useEffect(() => {
    trackView(item.id).catch(() => {});
  }, [item.id]);

  // colores neon del #
  useEffect(() => {
    const id = setInterval(
      () => setHashColorIndex((prev) => (prev + 1) % NEON_COLORS.length),
      10000
    );
    return () => clearInterval(id);
  }, []);

  const refreshCommentStats = useCallback(async () => {
    try {
      const raw = await fetchCommentsStats(item.id);
      setCommentStats(normalizeCommentStats(raw));
    } catch {
      setCommentStats({
        comments_count: 0,
        replies_count: 0,
        total_count: 0,
        stars_count: 0,
      });
    }
  }, [item.id]);

  useEffect(() => {
    refreshCommentStats();
  }, [refreshCommentStats]);

  const displayedCommentsCount =
    commentStats.total_count || commentStats.comments_count || 0;

  const handleTogglePostStar = useCallback(async () => {
    try {
      const res = await toggleFeedStar(item.id);
      setPostStarred(res.starred);
      setPostStarsCount(res.stars_count);
    } catch {}
  }, [item.id]);

  const handleToggleFourSixteen = useCallback(() => {
    if (isLandscape) return;
    setFourSixteen((prev) => !prev);
  }, [isLandscape]);

  // caption normal solo si NO es texto-json
  const nfcCaption = useMemo(() => {
    if (!item.caption || isTextPost) return "";
    const raw = item.caption ?? "";
    try {
      return typeof (raw as any).normalize === "function"
        ? (raw as string).normalize("NFC")
        : (raw as string);
    } catch {
      return raw as string;
    }
  }, [item.caption, isTextPost]);

  const safeCaption = useMemo(
    () => padForAndroidEmojiClip(nfcCaption),
    [nfcCaption]
  );

  const [captionLines, setCaptionLines] = useState(0);
  const needsScroll = captionLines > CAPTION_VISIBLE_LINES;
  const threeLineHeight =
    CAPTION_LINE_HEIGHT * CAPTION_VISIBLE_LINES + MIDCAPTION_PAD_V * 2;

  const onCaptionTextLayout = useCallback(
    (e: any) => {
      const l = Array.isArray(e?.nativeEvent?.lines)
        ? e.nativeEvent.lines.length
        : 0;
      if (l !== captionLines) setCaptionLines(l);
    },
    [captionLines]
  );

  /* -------------------- ESTILOS dinámicos del texto de post -------------------- */

  const centerTextColor =
    textCaptionMeta?.style?.color && textCaptionMeta.style.color.trim()
      ? textCaptionMeta.style.color
      : "#ffffff";

  const centerAlign = textCaptionMeta?.style?.align ?? "center";

  const baseFontSize = textCaptionMeta?.style?.fontSize ?? 18;
  const centerFontSize =
    fourSixteen && !isLandscape ? Math.max(11, baseFontSize - 6) : baseFontSize;

  const centerTextAlignStyle: "left" | "center" | "right" =
    centerAlign === "left"
      ? "left"
      : centerAlign === "right"
      ? "right"
      : "center";

  const centerShadowColor =
    textCaptionMeta?.style?.shadowColor ?? "#000000";

  const centerBubbleColor =
    textCaptionMeta?.style?.bubbleColor ?? "rgba(0,0,0,0.55)";

  // resuelve fontFamily/fontWeight (igual filosofía que CommentsSheet)
  const { fontFamily: centerFontFamily, fontWeight: centerFontWeight } =
    getFinalFontForStyle(textCaptionMeta?.style);

  const useScrollForText = fourSixteen && !isLandscape;

  // para posts de texto, esperamos a que las fuentes estén listas
  if (isTextPost && !fontsReady) {
    return <View style={styles.fill} />;
  }

  return (
    <View
      style={styles.fill}
      onLayout={(e) => setCardH(e.nativeEvent.layout.height)}
    >
      {/* Fondo de la imagen */}
      {fourSixteen && !isLandscape ? (
        <View style={styles.letterboxContainer}>
          <Image
            source={{ uri: mediaUrl }}
            style={styles.letterboxBlur}
            resizeMode="cover"
            blurRadius={Platform.OS === "ios" ? 30 : 15}
          />
          <View style={styles.letterboxScrim} />
          <View style={styles.letterboxCenter}>
            <Image
              source={{ uri: mediaUrl }}
              style={styles.letterboxImage}
              resizeMode="contain"
            />
          </View>
        </View>
      ) : (
        <View style={StyleSheet.absoluteFillObject}>
          <Image
            source={{ uri: mediaUrl }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Overlay */}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
        {/* TEXTO GRANDE CENTRADO para publicaciones tipo texto */}
        {isTextPost && (
          <View
            pointerEvents={useScrollForText ? "box-none" : "none"}
            style={[
              styles.textPostOverlay,
              {
                left: sideMargin,
                right: sideMargin,
                top: cardH
                  ? cardH * (isLandscape ? 0.12 : 0.18)
                  : isLandscape
                  ? 80
                  : 120,
                bottom:
                  GUTTER +
                  AVATAR_SIZE +
                  BETWEEN +
                  (!isLandscape ? CAPTION_GAP_OVER_BAR + 10 : 10),
              },
            ]}
          >
            {useScrollForText ? (
              <ScrollView
                style={styles.textPostScroll}
                contentContainerStyle={styles.textPostScrollContent}
                showsVerticalScrollIndicator={false}
                scrollEnabled={useScrollForText}
                nestedScrollEnabled
                scrollEventThrottle={16}
                bounces={false}
              >
                <View
                  style={[
                    styles.textPostBubble,
                    {
                      alignSelf:
                        centerTextAlignStyle === "left"
                          ? "flex-start"
                          : centerTextAlignStyle === "right"
                          ? "flex-end"
                          : "center",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.textPostText,
                      {
                        color: centerTextColor,
                        fontSize: centerFontSize,
                        textAlign: centerTextAlignStyle,
                        textShadowColor: centerShadowColor,
                        backgroundColor: centerBubbleColor,
                        fontFamily: centerFontFamily as any,
                        fontWeight: centerFontWeight,
                      },
                    ]}
                  >
                    {textCaptionMeta?.text ?? ""}
                  </Text>
                </View>
              </ScrollView>
            ) : (
              <View
                style={[
                  styles.textPostBubble,
                  {
                    alignSelf:
                      centerTextAlignStyle === "left"
                        ? "flex-start"
                        : centerTextAlignStyle === "right"
                        ? "flex-end"
                        : "center",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.textPostText,
                    {
                      color: centerTextColor,
                      fontSize: centerFontSize,
                      textAlign: centerTextAlignStyle,
                      textShadowColor: centerShadowColor,
                      backgroundColor: centerBubbleColor,
                      fontFamily: centerFontFamily as any,
                      fontWeight: centerFontWeight,
                    },
                  ]}
                >
                  {textCaptionMeta?.text ?? ""}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Botón 4:16 (solo vertical) */}
        {!isLandscape && (
          <View
            style={{
              position: "absolute",
              right: sideMargin,
              bottom: GUTTER + AVATAR_SIZE + BETWEEN + CAPTION_GAP_OVER_BAR,
              alignItems: "flex-end",
            }}
          >
            <TouchableOpacity
              onPress={handleToggleFourSixteen}
              style={styles.fullscreenBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.fullscreenBtnText}>4:16</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Caption NORMAL (no text-json, solo vertical) */}
        {!!safeCaption && !isLandscape && !isTextPost && (
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              left: sideMargin,
              right: sideMargin,
              bottom: GUTTER + AVATAR_SIZE + BETWEEN + CAPTION_GAP_OVER_BAR,
            }}
          >
            {needsScroll ? (
              <ScrollView
                style={{
                  height: threeLineHeight,
                  maxHeight: threeLineHeight,
                  alignSelf: "flex-start",
                }}
                contentContainerStyle={{
                  alignItems: "flex-start",
                  paddingVertical: 1,
                }}
                removeClippedSubviews={false}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
              >
                <View style={styles.captionBubble}>
                  <Text
                    style={[
                      styles.captionText,
                      Platform.OS === "android"
                        ? ({ textBreakStrategy: "simple" } as any)
                        : null,
                    ]}
                    allowFontScaling={false}
                    onTextLayout={onCaptionTextLayout}
                  >
                    {safeCaption}
                  </Text>
                </View>
              </ScrollView>
            ) : (
              <View style={{ alignSelf: "flex-start" }}>
                <View style={styles.captionBubble}>
                  <Text
                    style={[
                      styles.captionText,
                      Platform.OS === "android"
                        ? ({ textBreakStrategy: "simple" } as any)
                        : null,
                    ]}
                    allowFontScaling={false}
                    onTextLayout={onCaptionTextLayout}
                  >
                    {safeCaption}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Botonera derecha */}
        <View
          style={{
            position: "absolute",
            right: sideMargin,
            bottom: GUTTER + AVATAR_SIZE + BETWEEN - ICONS_GAP_BELOW,
            maxWidth: ICONS_ROW_MAX_WIDTH,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <View style={styles.iconCol}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleTogglePostStar}
              style={{ alignItems: "center" }}
            >
              <MaterialCommunityIcons
                name={postStarred ? "star" : "star-outline"}
                size={22}
                color={postStarred ? JADE : "#fff"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStarsOpen(true)}
              style={styles.countPill}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.countText}>{postStarsCount}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.iconCol, { marginLeft: 12 }]}
            activeOpacity={0.9}
            onPress={() => setCommentsOpen(true)}
          >
            <MaterialCommunityIcons
              name="comment-outline"
              size={22}
              color="#fff"
            />
            <View style={styles.countPill}>
              <Text style={styles.countText}>{displayedCommentsCount}</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.iconCol, { marginLeft: 12 }]}>
            <MaterialCommunityIcons
              name="share-variant"
              size={22}
              color="#fff"
            />
            <View style={styles.countPill}>
              <Text style={styles.countText}>0</Text>
            </View>
          </View>
        </View>

        {/* Pie con avatar, publicación, vistas */}
        <View
          style={{
            position: "absolute",
            left: sideMargin,
            right: sideMargin,
            bottom: GUTTER,
            flexDirection: "row",
            alignItems: "flex-end",
          }}
        >
          <View style={{ maxWidth: CAPTION_MAX_WIDTH, flexShrink: 1 }}>
            <View style={styles.bubble}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <Image
                  source={require("../../assets/images/avatar_neutral.png")}
                  style={styles.avatar}
                />
              )}
            </View>

            <Text style={styles.postLabel}>Publicación</Text>

            <View style={styles.sideBtnWrap}>
              <TouchableOpacity style={styles.sideBtn} activeOpacity={0.9}>
                <MaterialCommunityIcons
                  name="send-circle-outline"
                  size={18}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.authorName} numberOfLines={1}>
              <Text style={[styles.authorName, { color: hashColor }]}>#</Text>{" "}
              {item.author.username}
            </Text>

            <View style={styles.viewsRow}>
              <Text
                style={styles.views}
              >{`${item.views_count} vistas`}</Text>
              <MaterialCommunityIcons
                name="account-plus"
                size={16}
                color="#fff"
                style={{ opacity: 0.9 }}
              />
            </View>
          </View>

          <View style={{ flex: 1 }} />
        </View>
      </View>

      {/* Sheets de comentarios y estrellas */}
      {!isLandscape && (
        <>
          <CommentsSheet
            visible={commentsOpen}
            onClose={() => setCommentsOpen(false)}
            postId={item.id}
            accentColor={JADE}
          />
          <PostStarsSheet
            visible={starsOpen}
            onClose={() => setStarsOpen(false)}
            postId={item.id}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: BG },

  // 4:16 → contenedor del fondo blur + imagen
  letterboxContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  letterboxBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  letterboxScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  letterboxCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  letterboxImage: {
    width: "112%",
    aspectRatio: 16 / 9,
  },

  bubble: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatar: {
    width: AVATAR_SIZE - 8,
    height: AVATAR_SIZE - 8,
    borderRadius: (AVATAR_SIZE - 8) / 2,
  },

  postLabel: { color: "#fff", fontSize: 11, opacity: 0.9, marginBottom: 2 },
  authorName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },

  iconCol: { alignItems: "center", gap: 4 },
  countPill: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    minWidth: 30,
    height: 22,
    borderRadius: 999,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  viewsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  views: { color: "#fff", opacity: 0.9, textAlign: "left" },

  sideBtnWrap: {
    position: "absolute",
    left: AVATAR_SIZE - (28 - 6),
    top: AVATAR_SIZE - 28 / 2 + 6 - 10,
  },
  sideBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  fullscreenBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(0,0,0,0.55)",
    marginBottom: 4,
  },
  fullscreenBtnText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  captionBubble: {
    alignSelf: "flex-start",
    maxWidth: "82%",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: MIDCAPTION_PAD_V,
    paddingRight: 12,
    overflow: "visible",
    minHeight: CAPTION_LINE_HEIGHT + MIDCAPTION_PAD_V,
  },
  captionText: {
    fontSize: CAPTION_FONT_SIZE,
    lineHeight: CAPTION_LINE_HEIGHT,
    color: "#fff",
    fontWeight: Platform.OS === "android" ? "500" : "800",
    includeFontPadding: Platform.OS === "android",
    textShadowColor: Platform.OS === "android" ? "transparent" : "#000",
    textShadowRadius: Platform.OS === "android" ? 0 : 6,
    textShadowOffset: { width: 0, height: 0 },
  },

  // overlay del texto grande de publicaciones tipo texto
  textPostOverlay: {
    position: "absolute",
    justifyContent: "center",
  },
  textPostBubble: {
    maxWidth: "86%",
    borderRadius: 20,
    overflow: "hidden",
  },
  textPostScroll: {
    maxHeight: TEXT_POST_LINE_HEIGHT * TEXT_POST_VISIBLE_LINES_416,
    alignSelf: "stretch",
  },
  textPostScrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  textPostText: {
    // NO ponemos fontWeight aquí para no romper custom fonts
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
    lineHeight: TEXT_POST_LINE_HEIGHT,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
