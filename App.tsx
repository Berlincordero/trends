// App.tsx
import "react-native-gesture-handler";
// 👇 ESTE PRIMERO SIEMPRE
import "react-native-reanimated";


import React from "react";
import { View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

// 1) Poppins
import {
  useFonts as usePoppins,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
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
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";

// 4) Roboto
import {
  useFonts as useRoboto,
  Roboto_400Regular,
  Roboto_500Medium,
} from "@expo-google-fonts/roboto";

// 5) Open Sans
import {
  useFonts as useOpenSans,
  OpenSans_400Regular,
  OpenSans_600SemiBold,
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
} from "@expo-google-fonts/playfair-display";

// 11) Merriweather
import {
  useFonts as useMerriweather,
  Merriweather_400Regular,
} from "@expo-google-fonts/merriweather";

// 12) DM Sans
import {
  useFonts as useDMSans,
  DMSans_500Medium,
} from "@expo-google-fonts/dm-sans";

// 13) DM Serif Display
import {
  useFonts as useDMSerif,
  DMSerifDisplay_400Regular,
} from "@expo-google-fonts/dm-serif-display";

// 14) Manrope
import {
  useFonts as useManrope,
  Manrope_500Medium,
} from "@expo-google-fonts/manrope";

// 15) Rubik
import {
  useFonts as useRubik,
  Rubik_500Medium,
} from "@expo-google-fonts/rubik";

// 16) Work Sans
import {
  useFonts as useWorkSans,
  WorkSans_500Medium,
} from "@expo-google-fonts/work-sans";

// 17) Oswald
import {
  useFonts as useOswald,
  Oswald_400Regular,
} from "@expo-google-fonts/oswald";

// 18) Archivo
import {
  useFonts as useArchivo,
  Archivo_500Medium,
} from "@expo-google-fonts/archivo";

// 19) Quicksand
import {
  useFonts as useQuicksand,
  Quicksand_500Medium,
} from "@expo-google-fonts/quicksand";

// 20) Urbanist
import {
  useFonts as useUrbanist,
  Urbanist_500Medium,
} from "@expo-google-fonts/urbanist";

// 21) Fira Sans
import {
  useFonts as useFira,
  FiraSans_500Medium,
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
} from "@expo-google-fonts/cabin";

// 25) Source Sans Pro
import {
  useFonts as useSourceSans,
  SourceSansPro_400Regular,
} from "@expo-google-fonts/source-sans-pro";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  // cargamos TODAS; si una te da error, la comentas aquí
  const [poppinsLoaded] = usePoppins({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [montLoaded] = useMontserrat({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });
  const [interLoaded] = useInter({
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const [robotoLoaded] = useRoboto({
    Roboto_400Regular,
    Roboto_500Medium,
  });
  const [openSansLoaded] = useOpenSans({
    OpenSans_400Regular,
    OpenSans_600SemiBold,
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
  });
  const [ralewayLoaded] = useRaleway({
    Raleway_500Medium,
    Raleway_700Bold,
  });
  const [playfairLoaded] = usePlayfair({
    PlayfairDisplay_500Medium,
  });
  const [merriLoaded] = useMerriweather({
    Merriweather_400Regular,
  });
  const [dmSansLoaded] = useDMSans({
    DMSans_500Medium,
  });
  const [dmSerifLoaded] = useDMSerif({
    DMSerifDisplay_400Regular,
  });
  const [manropeLoaded] = useManrope({
    Manrope_500Medium,
  });
  const [rubikLoaded] = useRubik({
    Rubik_500Medium,
  });
  const [workSansLoaded] = useWorkSans({
    WorkSans_500Medium,
  });
  const [oswaldLoaded] = useOswald({
    Oswald_400Regular,
  });
  const [archivoLoaded] = useArchivo({
    Archivo_500Medium,
  });
  const [quicksandLoaded] = useQuicksand({
    Quicksand_500Medium,
  });
  const [urbanistLoaded] = useUrbanist({
    Urbanist_500Medium,
  });
  const [firaLoaded] = useFira({
    FiraSans_500Medium,
  });
  const [bebasLoaded] = useBebas({
    BebasNeue_400Regular,
  });
  const [antonLoaded] = useAnton({
    Anton_400Regular,
  });
  const [cabinLoaded] = useCabin({
    Cabin_500Medium,
  });
  const [sourceLoaded] = useSourceSans({
    SourceSansPro_400Regular,
  });

  const allLoaded =
    poppinsLoaded &&
    montLoaded &&
    interLoaded &&
    robotoLoaded &&
    openSansLoaded &&
    latoLoaded &&
    nunitoLoaded &&
    nunitoSansLoaded &&
    ralewayLoaded &&
    playfairLoaded &&
    merriLoaded &&
    dmSansLoaded &&
    dmSerifLoaded &&
    manropeLoaded &&
    rubikLoaded &&
    workSansLoaded &&
    oswaldLoaded &&
    archivoLoaded &&
    quicksandLoaded &&
    urbanistLoaded &&
    firaLoaded &&
    bebasLoaded &&
    antonLoaded &&
    cabinLoaded &&
    sourceLoaded;

  React.useEffect(() => {
    if (allLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [allLoaded]);

  if (!allLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#6FD9C5" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Slot />
    </GestureHandlerRootView>
  );
}
