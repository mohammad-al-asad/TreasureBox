import { Platform } from "react-native";

export const fonts = {
  fraunces: Platform.select({
    web: "'Fraunces', Georgia, serif",
    ios: "Fraunces-Bold",
    android: "Fraunces_700Bold",
    default: "serif",
  }),
  frauncesRegular: Platform.select({
    web: "'Fraunces', Georgia, serif",
    ios: "Fraunces-Regular",
    android: "Fraunces_400Regular",
    default: "serif",
  }),
  frauncesSemiBold: Platform.select({
    web: "'Fraunces', Georgia, serif",
    ios: "Fraunces-SemiBold",
    android: "Fraunces_600SemiBold",
    default: "serif",
  }),
  frauncesBold: Platform.select({
    web: "'Fraunces', Georgia, serif",
    ios: "Fraunces-Bold",
    android: "Fraunces_700Bold",
    default: "serif",
  }),
  frauncesBlack: Platform.select({
    web: "'Fraunces', Georgia, serif",
    ios: "Fraunces-Black",
    android: "Fraunces_900Black",
    default: "serif",
  }),
};
