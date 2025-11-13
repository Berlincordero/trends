// app/components/CommentsSheet.tsx
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  FadeInDown,
  ZoomIn,
  BounceIn,
  SlideInLeft,
  SlideInRight,
  LightSpeedInLeft,
  LightSpeedInRight,
  RotateInDownLeft,
} from "react-native-reanimated";
import {
  BASE,
  authGetProfile,
  fetchComments,
  createComment,
  replyComment,
  uploadCommentMedia,
  fetchTrendingGifs,
  searchGifs,
  toggleCommentStar,
  CommentNode,
} from "../../lib/api";

/* ------------------------------------------------------------------ */
/* IMPORTS DE 26 FUENTES                                              */
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
// 26) la dejamos afuera

const { height, width } = Dimensions.get("window");
const SHEET_H = Math.round(height * 0.72);
const JADE = "#6FD9C5";
const TOOLS_BAR_H = 50;
const INPUT_BAR_H = 62;
const EMOJIS = ["🔥", "👏", "😍", "😂", "❤️", "🙏", "💯", "🥳"];
const SIZE_OPTIONS = [12, 14, 16, 18, 20];

const COLORS = [
  "#ffffff",
  "#6FD9C5",
  "#FFB347",
  "#FF6B6B",
  "#8C7CF0",
  "#A5B4FC",
  "rgba(255,255,255,0.6)",
  "#FFE4A8",
  "#C5F6FA",
  "#F8B4FF",
  "rgba(0,0,0,0.35)",
  "#1DE9B6",
  "#FFCDD2",
  "#BBDEFB",
  "#E1BEE7",
  "#FFF59D",
  // fosfo
  "#39FF14",
  "#00F7FF",
  "#FF00FF",
  "#F7FF00",
  "#FF5F1F",
  "#B026FF",
  "#00FFC6",
  "#FF1493",
  "#AFFC41",
  "#7DF9FF",
];

const SHADOW_COLORS = [
  { key: "none", label: "Ninguna", color: "transparent" },
  { key: "black", label: "Negro", color: "#000000" },
  { key: "white", label: "Blanco", color: "#ffffff" },
  { key: "jade", label: "Jade", color: "#6FD9C5" },
  { key: "red", label: "Rojo", color: "#FF6B6B" },
  { key: "violet", label: "Violeta", color: "#8C7CF0" },
  { key: "black-soft", label: "Negro 40%", color: "rgba(0,0,0,0.4)" },
  { key: "white-soft", label: "Blanco 40%", color: "rgba(255,255,255,0.4)" },
  { key: "jade-soft", label: "Jade 40%", color: "rgba(111,217,197,0.4)" },
  { key: "red-soft", label: "Rojo 45%", color: "rgba(255,107,107,0.45)" },
  { key: "violet-soft", label: "Violeta 40%", color: "rgba(140,124,240,0.4)" },
  // fosfo
  { key: "neon-green", label: "Neon Vd", color: "#39FF14" },
  { key: "neon-cyan", label: "Neon Cyan", color: "#00F7FF" },
  { key: "neon-magenta", label: "Neon Mag", color: "#FF00FF" },
  { key: "neon-yellow", label: "Neon Am", color: "#F7FF00" },
  { key: "neon-orange", label: "Neon Nar", color: "#FF5F1F" },
  { key: "neon-purple", label: "Neon Mor", color: "#B026FF" },
  { key: "neon-aqua", label: "Neon Aqua", color: "#00FFC6" },
  { key: "neon-pink", label: "Neon Rosa", color: "#FF1493" },
  { key: "neon-lime", label: "Neon Lima", color: "#AFFC41" },
  { key: "neon-blue", label: "Neon Azul", color: "#7DF9FF" },
];

const ANIM_OPTIONS = [
  { key: "none", label: "Ninguna" },
  { key: "fade", label: "Fade" },
  { key: "zoom", label: "Zoom" },
  { key: "bounce", label: "Bounce" },
  { key: "slideLeft", label: "Slide L" },
  { key: "slideRight", label: "Slide R" },
  { key: "lightLeft", label: "Light L" },
  { key: "lightRight", label: "Light R" },
  { key: "rotateIn", label: "Rotate" },
];

const FONT_OPTIONS = [
  { key: "System", label: "System" },
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
  NunitoSans_600SemiBold: {
    normal: "NunitoSans_600SemiBold",
    bold: "NunitoSans_700Bold",
  },
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
  DMSerifDisplay_400Regular: {
    normal: "DMSerifDisplay_400Regular",
    bold: "DMSerifDisplay_400Regular",
  },
  Manrope_500Medium: { normal: "Manrope_500Medium", bold: "Manrope_700Bold" },
  Rubik_500Medium: { normal: "Rubik_500Medium", bold: "Rubik_700Bold" },
  WorkSans_500Medium: {
    normal: "WorkSans_500Medium",
    bold: "WorkSans_700Bold",
  },
  Oswald_400Regular: { normal: "Oswald_400Regular", bold: "Oswald_500Medium" },
  Archivo_500Medium: { normal: "Archivo_500Medium", bold: "Archivo_700Bold" },
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
  BebasNeue_400Regular: {
    normal: "BebasNeue_400Regular",
    bold: "BebasNeue_400Regular",
  },
  Anton_400Regular: { normal: "Anton_400Regular", bold: "Anton_400Regular" },
  Cabin_500Medium: { normal: "Cabin_500Medium", bold: "Cabin_700Bold" },
  Pacifico_400Regular: {
    normal: "Pacifico_400Regular",
    bold: "Pacifico_400Regular",
  },
};

type Props = {
  visible: boolean;
  onClose: () => void;
  postId: number;
  accentColor?: string;
};

function resolveAvatar(uri?: string | null) {
  if (!uri) return null;
  if (uri.startsWith("http")) return uri;
  const clean = uri.replace(/^\/+/, "");
  return `${BASE}/media/${clean}`;
}

function resolveCommentMedia(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("/media/")) {
    return `${BASE}${path}`;
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${BASE}/media/${path.replace(/^\/+/, "")}`;
}

// 🔁 helper para actualizar el árbol después de dar estrella
function updateCommentTree(
  list: CommentNode[],
  commentId: number,
  patch: Partial<CommentNode>
): CommentNode[] {
  return list.map((c) => {
    if (c.id === commentId) {
      return { ...c, ...patch };
    }
    if (c.replies && c.replies.length) {
      return {
        ...c,
        replies: updateCommentTree(c.replies, commentId, patch),
      };
    }
    return c;
  });
}

export default function CommentsSheet({
  visible,
  onClose,
  postId,
  accentColor = JADE,
}: Props) {
  // cargar TODAS las fuentes
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

  const inputRef = useRef<TextInput>(null);
  const [myAvatar, setMyAvatar] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<CommentNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] =
    useState<"image" | "emoji" | "gif" | "style" | null>(null);
  const [gifResults, setGifResults] = useState<
    { id: string; url: string; title?: string }[]
  >([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifSearch, setGifSearch] = useState("");

  // 👉 para ver la imagen en grande
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [commentStyle, setCommentStyle] = useState<any>({
    color: "#ffffff",
    shadowColor: "transparent",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    anim: "none",
  });

  const getFinalFontForStyle = (st: any) => {
    const family = st?.fontFamily;
    const weight = st?.weight;
    if (!family || family === "System") {
      return {
        fontFamily: undefined,
        fontWeight: weight ? (weight === "bold" ? "700" : "400") : undefined,
      };
    }
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
  };

  const getShadowStyle = (shadowColor: string) => {
    if (!shadowColor || shadowColor === "transparent") return {};
    return {
      textShadowColor: shadowColor,
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 7,
    };
  };

  // helper: estilo de texto que viene del backend
  const buildTextStyleFromComment = (style: any) => {
    if (!style) style = {};
    const color = style.color || "#fff";
    const fontSize = style.fontSize || 14;

    const family = style.fontFamily;
    let fontFamily: any = undefined;
    let fontWeight: any = undefined;

    if (!family || family === "System") {
      if (style.weight === "bold") {
        fontWeight = "700";
      }
    } else {
      const variant = FONT_VARIANTS[family];
      if (variant) {
        fontFamily = style.weight === "bold" ? variant.bold : variant.normal;
      } else {
        fontFamily = family;
      }
    }

    let shadow: any = {};
    if (style.shadowColor && style.shadowColor !== "transparent") {
      shadow = {
        textShadowColor: style.shadowColor,
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 7,
      };
    }

    return {
      color,
      fontSize,
      fontFamily,
      fontWeight,
      ...shadow,
    };
  };

  // helper: pinta el texto con la animación que venga en el estilo del comentario
  const renderCommentTextWithAnim = (
    content: string,
    style: any,
    key: string
  ) => {
    const textStyle = buildTextStyleFromComment(style);
    const anim = style?.anim ?? "none";

    switch (anim) {
      case "fade":
        return (
          <Animated.Text
            key={key}
            entering={FadeInDown.duration(200)}
            style={textStyle}
          >
            {content}
          </Animated.Text>
        );
      case "zoom":
        return (
          <Animated.Text
            key={key}
            entering={ZoomIn.duration(200)}
            style={textStyle}
          >
            {content}
          </Animated.Text>
        );
      case "bounce":
        return (
          <Animated.Text
            key={key}
            entering={BounceIn.duration(220)}
            style={textStyle}
          >
            {content}
          </Animated.Text>
        );
      case "slideLeft":
        return (
          <Animated.Text
            key={key}
            entering={SlideInLeft.duration(200)}
            style={textStyle}
          >
            {content}
          </Animated.Text>
        );
      case "slideRight":
        return (
          <Animated.Text
            key={key}
            entering={SlideInRight.duration(200)}
            style={textStyle}
          >
            {content}
          </Animated.Text>
        );
      case "lightLeft":
        return (
          <Animated.Text
            key={key}
            entering={LightSpeedInLeft.duration(230)}
            style={textStyle}
          >
            {content}
          </Animated.Text>
        );
      case "lightRight":
        return (
          <Animated.Text
            key={key}
            entering={LightSpeedInRight.duration(230)}
            style={textStyle}
          >
            {content}
          </Animated.Text>
        );
      case "rotateIn":
        return (
          <Animated.Text
            key={key}
            entering={RotateInDownLeft.duration(240)}
            style={textStyle}
          >
            {content}
          </Animated.Text>
        );
      default:
        return (
          <Text key={key} style={textStyle}>
            {content}
          </Text>
        );
    }
  };

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const prof = await authGetProfile();
        setMyAvatar(resolveAvatar(prof?.avatar ?? null));
      } catch {
        setMyAvatar(null);
      }

      try {
        setLoading(true);
        const data = await fetchComments(postId);
        setComments(data);
      } catch {
        setComments([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, postId]);

  useEffect(() => {
    if (!visible) return;
    if (activeTool !== "gif") return;
    (async () => {
      setGifLoading(true);
      try {
        const res = await fetchTrendingGifs(18);
        setGifResults(res as any);
      } catch {
        setGifResults([]);
      } finally {
        setGifLoading(false);
      }
    })();
  }, [visible, activeTool]);

  const handleSend = async () => {
    const t = text.trim();
    if (!t && !replyTo) return;
    try {
      if (replyTo) {
        const res = await replyComment(replyTo.id, {
          text: t,
          style: commentStyle,
        });
        // como es reply, la agregamos en el árbol
        setComments((prev) =>
          updateCommentTree(prev, replyTo.id, {
            // no pisamos replies existentes, los agregamos
            replies: [...(replyTo.replies || []), res],
          })
        );
        setReplyTo(null);
      } else {
        const res = await createComment(postId, {
          text: t,
          style: commentStyle,
        });
        setComments((prev) => [...prev, res]);
      }
      setText("");
      setActiveTool(null);
    } catch {}
  };

  const handlePickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) return;

      const baseComment = await createComment(postId, {
        text: text.trim() || "",
        style: commentStyle,
      });

      const updated = await uploadCommentMedia(baseComment.id, {
        uri: asset.uri,
        name: (asset as any).fileName ?? "comment.jpg",
        type: asset.mimeType ?? "image/jpeg",
      } as any);

      setComments((prev) => [...prev, updated]);
      setText("");
      setActiveTool(null);
    } catch {}
  };

  const handleEmojiPress = (emoji: string) => {
    setText((prev) => (prev ? prev + " " + emoji : emoji));
    inputRef.current?.focus();
  };

  const handleGifSearch = async (q: string) => {
    setGifSearch(q);
    if (!q.trim()) {
      setGifLoading(true);
      try {
        const res = await fetchTrendingGifs(18);
        setGifResults(res as any);
      } catch {
        setGifResults([]);
      } finally {
        setGifLoading(false);
      }
      return;
    }
    setGifLoading(true);
    try {
      const res = await searchGifs(q.trim(), 18);
      setGifResults(res as any);
    } catch {
      setGifResults([]);
    } finally {
      setGifLoading(false);
    }
  };

  const handleSendGif = async (gifUrl: string) => {
    try {
      const res = await createComment(postId, {
        text: "",
        gift: gifUrl,
        style: commentStyle,
      });
      setComments((prev) => [...prev, res]);
      setActiveTool(null);
    } catch {}
  };

  const renderTextPreview = () => {
    const content = text.trim() || "Vista previa";
    const { fontFamily, fontWeight } = getFinalFontForStyle(commentStyle);
    const shadowColor = commentStyle.shadowColor || "transparent";
    const previewStyle: any = {
      color: commentStyle.color || "#fff",
      fontFamily,
      fontWeight,
      fontSize: commentStyle.fontSize || 14,
      ...getShadowStyle(shadowColor),
    };
    const aniKey = `${commentStyle.anim}-${content}-${fontFamily}-${commentStyle.color}-${commentStyle.fontSize}-${shadowColor}`;

    switch (commentStyle.anim) {
      case "fade":
        return (
          <Animated.Text
            key={aniKey}
            entering={FadeInDown.duration(220)}
            style={previewStyle}
          >
            {content}
          </Animated.Text>
        );
      case "zoom":
        return (
          <Animated.Text
            key={aniKey}
            entering={ZoomIn.duration(200)}
            style={previewStyle}
          >
            {content}
          </Animated.Text>
        );
      case "bounce":
        return (
          <Animated.Text
            key={aniKey}
            entering={BounceIn.duration(240)}
            style={previewStyle}
          >
            {content}
          </Animated.Text>
        );
      case "slideLeft":
        return (
          <Animated.Text
            key={aniKey}
            entering={SlideInLeft.duration(200)}
            style={previewStyle}
          >
            {content}
          </Animated.Text>
        );
      case "slideRight":
        return (
          <Animated.Text
            key={aniKey}
            entering={SlideInRight.duration(200)}
            style={previewStyle}
          >
            {content}
          </Animated.Text>
        );
      case "lightLeft":
        return (
          <Animated.Text
            key={aniKey}
            entering={LightSpeedInLeft.duration(260)}
            style={previewStyle}
          >
            {content}
          </Animated.Text>
        );
      case "lightRight":
        return (
          <Animated.Text
            key={aniKey}
            entering={LightSpeedInRight.duration(260)}
            style={previewStyle}
          >
            {content}
          </Animated.Text>
        );
      case "rotateIn":
        return (
          <Animated.Text
            key={aniKey}
            entering={RotateInDownLeft.duration(260)}
            style={previewStyle}
          >
            {content}
          </Animated.Text>
        );
      default:
        return (
          <Text key={aniKey} style={previewStyle}>
            {content}
          </Text>
        );
    }
  };

  // 🔥 RENDER DE CADA COMENTARIO
  const renderItem = ({ item }: { item: CommentNode }) => {
    const avatarSrc = resolveAvatar(item.author?.avatar) || undefined;
    const mediaUri = resolveCommentMedia(item.media);

    const onStarPress = async () => {
      try {
        const res = await toggleCommentStar(item.id);
        setComments((prev) =>
          updateCommentTree(prev, item.id, {
            stars_count: res.stars_count,
            starred: res.starred,
          })
        );
      } catch {}
    };

    return (
      <View style={styles.commentBlock}>
        <View style={styles.commentRow}>
          <Image
            source={
              avatarSrc
                ? { uri: avatarSrc }
                : require("../../assets/images/avatar_neutral.png")
            }
            style={styles.avatar}
          />

          <View style={{ flex: 1 }}>
            {item.gift ? (
              // --- comentario con GIF ---
              <View>
                <Text style={styles.username}>
                  {item.author?.username ?? "user"}
                </Text>
                <TouchableOpacity onPress={() => setPreviewImage(item.gift!)}>
                  <Image
                    source={{ uri: item.gift }}
                    style={styles.mainImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </View>
            ) : mediaUri ? (
              // --- comentario con imagen ---
              <View>
                <Text style={styles.username}>
                  {item.author?.username ?? "user"}
                </Text>
                {/* si tiene texto + imagen → texto con animación */}
                {item.text
                  ? renderCommentTextWithAnim(
                      item.text,
                      item.style || {},
                      `c-${item.id}`
                    )
                  : null}
                <TouchableOpacity onPress={() => setPreviewImage(mediaUri!)}>
                  <Image
                    source={{ uri: mediaUri }}
                    style={styles.mainImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </View>
            ) : (
              // --- solo texto ---
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                <Text style={styles.username}>
                  {item.author?.username ?? "user"}{" "}
                </Text>
                {renderCommentTextWithAnim(
                  item.text,
                  item.style || {},
                  `c-${item.id}`
                )}
              </View>
            )}

            <View style={styles.metaRow}>
              <TouchableOpacity onPress={() => setReplyTo(item)}>
                <Text style={styles.meta}>Responder</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ⭐ botón estrella */}
          <TouchableOpacity
            onPress={onStarPress}
            style={{ alignItems: "center", gap: 2, paddingHorizontal: 2 }}
          >
            <MaterialCommunityIcons
              name={item.starred ? "star" : "star-outline"}
              size={18}
              color={item.starred ? "#FFD700" : "#fff"}
            />
            <Text style={{ color: "#fff", fontSize: 10, opacity: 0.8 }}>
              {item.stars_count ?? 0}
            </Text>
          </TouchableOpacity>
        </View>

        {/* REPLIES */}
        {item.replies?.length ? (
          <View style={styles.repliesWrap}>
            {item.replies.map((r) => {
              const rAvatar = resolveAvatar(r.author?.avatar) || undefined;
              const rMediaUri = resolveCommentMedia(r.media);

              const onStarReply = async () => {
                try {
                  const res = await toggleCommentStar(r.id);
                  setComments((prev) =>
                    updateCommentTree(prev, r.id, {
                      stars_count: res.stars_count,
                      starred: res.starred,
                    })
                  );
                } catch {}
              };

              return (
                <View key={r.id} style={styles.replyRow}>
                  <Image
                    source={
                      rAvatar
                        ? { uri: rAvatar }
                        : require("../../assets/images/avatar_neutral.png")
                    }
                    style={styles.replyAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    {r.gift ? (
                      <View>
                        <Text style={styles.username}>
                          {r.author?.username ?? "user"}
                        </Text>
                        <TouchableOpacity onPress={() => setPreviewImage(r.gift!)}>
                          <Image
                            source={{ uri: r.gift }}
                            style={styles.replyImage}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      </View>
                    ) : rMediaUri ? (
                      <View>
                        <Text style={styles.username}>
                          {r.author?.username ?? "user"}
                        </Text>
                        {r.text
                          ? renderCommentTextWithAnim(
                              r.text,
                              r.style || {},
                              `r-${r.id}`
                            )
                          : null}
                        <TouchableOpacity
                          onPress={() => setPreviewImage(rMediaUri!)}
                        >
                          <Image
                            source={{ uri: rMediaUri }}
                            style={styles.replyImage}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        <Text style={styles.username}>
                          {r.author?.username ?? "user"}{" "}
                        </Text>
                        {renderCommentTextWithAnim(
                          r.text,
                          r.style || {},
                          `r-${r.id}`
                        )}
                      </View>
                    )}

                    <View style={styles.metaRow}>
                      <TouchableOpacity onPress={() => setReplyTo(r)}>
                        <Text style={styles.meta}>Responder</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* ⭐ en reply */}
                  <TouchableOpacity
                    onPress={onStarReply}
                    style={{ alignItems: "center", gap: 2, paddingHorizontal: 2 }}
                  >
                    <MaterialCommunityIcons
                      name={r.starred ? "star" : "star-outline"}
                      size={16}
                      color={r.starred ? "#FFD700" : "#fff"}
                    />
                    <Text style={{ color: "#fff", fontSize: 9, opacity: 0.8 }}>
                      {r.stars_count ?? 0}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    );
  };

  if (!fontsReady && visible) {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.backdrop} />
        <View
          style={[
            styles.sheet,
            { height: SHEET_H, justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text style={{ color: "#fff" }}>Cargando tipografías…</Text>
        </View>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <KeyboardAvoidingView
          style={StyleSheet.absoluteFill}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.sheet, { height: SHEET_H }]}>
            <View style={styles.pull} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>
                {replyTo
                  ? `Responder a ${replyTo.author?.username}`
                  : "Comentarios"}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={comments}
              keyExtractor={(it) => String(it.id)}
              renderItem={renderItem}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 14,
                paddingBottom: INPUT_BAR_H + TOOLS_BAR_H + 180,
              }}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                !loading ? (
                  <Text style={styles.empty}>Sé el primero en comentar 💬</Text>
                ) : null
              }
            />

            {/* INPUT */}
            <View style={styles.inputWrap}>
              <Image
                source={
                  myAvatar
                    ? { uri: myAvatar }
                    : require("../../assets/images/avatar_neutral.png")
                }
                style={styles.inputAvatar}
              />
              <View style={styles.inputBox}>
                {(() => {
                  const { fontFamily, fontWeight } =
                    getFinalFontForStyle(commentStyle);
                  const shadowColor =
                    commentStyle.shadowColor || "transparent";
                  return (
                    <TextInput
                      ref={inputRef}
                      placeholder="Añade un comentario..."
                      placeholderTextColor="#cfd8dc"
                      value={text}
                      onChangeText={setText}
                      style={[
                        styles.input,
                        {
                          color: commentStyle.color || "#fff",
                          fontFamily,
                          fontWeight,
                          fontSize: commentStyle.fontSize || 14,
                          ...getShadowStyle(shadowColor),
                        },
                      ]}
                      multiline
                    />
                  );
                })()}
              </View>
              <TouchableOpacity
                onPress={handleSend}
                disabled={!text.trim() && !replyTo}
                style={{
                  opacity: text.trim() || replyTo ? 1 : 0.4,
                  paddingHorizontal: 6,
                  paddingVertical: 4,
                }}
              >
                <Text style={[styles.sendText, { color: accentColor }]}>
                  Enviar
                </Text>
              </TouchableOpacity>
            </View>

            {/* PANEL EMOJI */}
            {activeTool === "emoji" ? (
              <View style={styles.emojiPanel}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {EMOJIS.map((em) => (
                    <TouchableOpacity
                      key={em}
                      style={styles.emojiBtn}
                      onPress={() => handleEmojiPress(em)}
                    >
                      <Text style={{ fontSize: 22 }}>{em}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* PANEL GIF */}
            {activeTool === "gif" ? (
              <View style={styles.gifPanel}>
                <View style={styles.gifSearchRow}>
                  <MaterialCommunityIcons
                    name="magnify"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 6 }}
                  />
                  <TextInput
                    placeholder="Buscar GIF..."
                    placeholderTextColor="#cfd8dc"
                    value={gifSearch}
                    onChangeText={handleGifSearch}
                    style={styles.gifSearchInput}
                  />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {gifLoading ? (
                    <Text style={{ color: "#fff" }}>Cargando GIFs…</Text>
                  ) : gifResults.length ? (
                    gifResults.map((g) => (
                      <TouchableOpacity
                        key={g.id}
                        onPress={() => handleSendGif(g.url)}
                        style={styles.gifThumb}
                      >
                        <Image
                          source={{ uri: g.url }}
                          style={{ width: 90, height: 90, borderRadius: 12 }}
                        />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={{ color: "#fff" }}>Sin resultados</Text>
                  )}
                </ScrollView>
              </View>
            ) : null}

            {/* PANEL STYLE */}
            {activeTool === "style" ? (
              <View style={styles.stylePanel}>
                <View style={styles.previewBox}>{renderTextPreview()}</View>

                {/* fuente */}
                <View style={styles.styleRow}>
                  <Text style={styles.styleLabel}>Fuente:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {FONT_OPTIONS.map((f) => (
                      <TouchableOpacity
                        key={f.key}
                        onPress={() =>
                          setCommentStyle((s: any) => ({
                            ...s,
                            fontFamily: f.key,
                          }))
                        }
                        style={[
                          styles.styleChip,
                          commentStyle.fontFamily === f.key &&
                            styles.styleChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.styleChipText,
                            f.key !== "System" && { fontFamily: f.key as any },
                          ]}
                        >
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* tamaño */}
                <View style={styles.styleRow}>
                  <Text style={styles.styleLabel}>Tamaño:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {SIZE_OPTIONS.map((sz) => (
                      <TouchableOpacity
                        key={sz}
                        onPress={() =>
                          setCommentStyle((s: any) => ({
                            ...s,
                            fontSize: sz,
                          }))
                        }
                        style={[
                          styles.styleChip,
                          commentStyle.fontSize === sz &&
                            styles.styleChipActive,
                        ]}
                      >
                        <Text style={styles.styleChipText}>{sz}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* color */}
                <View style={styles.styleRow}>
                  <Text style={styles.styleLabel}>Color:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {COLORS.map((c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() =>
                          setCommentStyle((s: any) => ({
                            ...s,
                            color: c,
                          }))
                        }
                        style={[
                          styles.colorDot,
                          { backgroundColor: c },
                          commentStyle.color === c && styles.colorDotActive,
                        ]}
                      />
                    ))}
                  </ScrollView>
                </View>

                {/* sombra */}
                <View style={styles.styleRow}>
                  <Text style={styles.styleLabel}>Sombra:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {SHADOW_COLORS.map((scol) => (
                      <TouchableOpacity
                        key={scol.key}
                        onPress={() =>
                          setCommentStyle((s: any) => ({
                            ...s,
                            shadowColor: scol.color,
                          }))
                        }
                        style={[
                          styles.shadowChip,
                          commentStyle.shadowColor === scol.color &&
                            styles.shadowChipActive,
                        ]}
                      >
                        <View
                          style={[styles.shadowDot, { backgroundColor: scol.color }]}
                        />
                        <Text style={styles.shadowChipText}>{scol.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* anim */}
                <View style={styles.styleRow}>
                  <Text style={styles.styleLabel}>Anim:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {ANIM_OPTIONS.map((a) => (
                      <TouchableOpacity
                        key={a.key}
                        onPress={() =>
                          setCommentStyle((s: any) => ({
                            ...s,
                            anim: a.key,
                          }))
                        }
                        style={[
                          styles.styleChip,
                          commentStyle.anim === a.key && styles.styleChipActive,
                        ]}
                      >
                        <Text style={styles.styleChipText}>{a.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            ) : null}

            {/* barra inferior */}
            <View style={styles.toolsBar}>
              <TouchableOpacity style={styles.toolBtn} onPress={handlePickImage}>
                <MaterialCommunityIcons
                  name="image-outline"
                  size={18}
                  color={accentColor}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toolBtn}
                onPress={() =>
                  setActiveTool((p) => (p === "emoji" ? null : "emoji"))
                }
              >
                <MaterialCommunityIcons
                  name="emoticon-outline"
                  size={18}
                  color={accentColor}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toolBtn}
                onPress={() => setActiveTool((p) => (p === "gif" ? null : "gif"))}
              >
                <MaterialCommunityIcons
                  name="gift-outline"
                  size={18}
                  color={accentColor}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toolBtn}
                onPress={() =>
                  setActiveTool((p) => (p === "style" ? null : "style"))
                }
              >
                <MaterialCommunityIcons
                  name="format-letter-case"
                  size={18}
                  color={accentColor}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL DE PREVIEW DE IMAGEN */}
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <Pressable
          style={styles.previewBackdrop}
          onPress={() => setPreviewImage(null)}
        >
          <View style={styles.previewContent}>
            {previewImage ? (
              <Image
                source={{ uri: previewImage }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : null}
            <TouchableOpacity
              onPress={() => setPreviewImage(null)}
              style={styles.previewCloseBtn}
            >
              <MaterialCommunityIcons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#111",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
  },
  pull: {
    alignSelf: "center",
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginTop: 8,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  title: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  commentBlock: {
    marginBottom: 10,
  },
  commentRow: {
    flexDirection: "row",
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  username: {
    color: "#fff",
    fontWeight: "900",
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  meta: {
    color: "#90a4ae",
    fontSize: 12,
  },
  repliesWrap: {
    marginLeft: 42,
    marginTop: 6,
    gap: 6,
  },
  replyRow: {
    flexDirection: "row",
    gap: 10,
  },
  replyAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  empty: {
    color: "#90a4ae",
    textAlign: "center",
    marginTop: 20,
  },
  inputWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: TOOLS_BAR_H,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    backgroundColor: "#111",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
    minHeight: INPUT_BAR_H,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  inputBox: {
    flex: 1,
    minHeight: 34,
    maxHeight: 120,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  input: {
    fontSize: 14,
    lineHeight: 18,
    padding: 0,
  },
  sendText: {
    fontWeight: "800",
    fontSize: 14,
  },
  toolsBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0f1112",
    height: TOOLS_BAR_H,
  },
  toolBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: TOOLS_BAR_H + INPUT_BAR_H,
    backgroundColor: "#151515",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  emojiBtn: {
    width: 38,
    height: 38,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  gifPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: TOOLS_BAR_H + INPUT_BAR_H,
    backgroundColor: "#121212",
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  gifSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  gifSearchInput: {
    flex: 1,
    color: "#fff",
    padding: 0,
    fontSize: 13,
  },
  gifThumb: {
    marginRight: 10,
  },
  stylePanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: TOOLS_BAR_H + INPUT_BAR_H,
    backgroundColor: "#121212",
    padding: 10,
    gap: 10,
  },
  previewBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: 8,
    marginBottom: 2,
  },
  styleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  styleLabel: {
    color: "#fff",
    fontWeight: "700",
    width: 62,
  },
  styleChip: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  styleChipActive: {
    backgroundColor: "rgba(111,217,197,0.26)",
  },
  styleChipText: {
    color: "#fff",
    fontWeight: "600",
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  colorDotActive: {
    borderColor: "#fff",
    borderWidth: 2,
  },
  shadowChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  shadowChipActive: {
    backgroundColor: "rgba(111,217,197,0.28)",
  },
  shadowDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
  },
  shadowChipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  // imágenes de comentarios
  mainImage: {
    width: 160,
    height: 160,
    borderRadius: 12,
    marginTop: 6,
  },
  replyImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
    marginTop: 4,
  },

  // preview grande
  previewBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: width,
    height: height,
  },
  previewCloseBtn: {
    position: "absolute",
    top: 50,
    right: 26,
    backgroundColor: "rgba(0,0,0,0.4)",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
