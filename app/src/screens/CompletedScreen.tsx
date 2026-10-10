import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Header } from "../components/Header";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { useLanguage } from "../i18n/LanguageContext";
import { Hunt } from "../types/hunt";

const victoryHeroImage = require("../../assets/treasure-found-hero.jpg");

interface CompletedScreenProps {
  hunt: Hunt;
  hunterName: string;
  onReturnToCatalog: () => void;
  onPressProfile?: () => void;
}

const { width } = Dimensions.get("window");
const HERO_SIZE = Math.min(width - 80, 260);

export const CompletedScreen: React.FC<CompletedScreenProps> = ({
  hunt,
  hunterName,
  onReturnToCatalog,
  onPressProfile,
}) => {
  const { t, isRTL, language } = useLanguage();

  const localizedHuntTitle = language === "ar" ? hunt.titleAr || hunt.title : hunt.title;
  const explorerName = hunterName || (language === "ar" ? "المستكشف" : "Explorer");

  return (
    <View style={styles.screen}>
      <Header showBack onBack={onReturnToCatalog} onPressProfile={onPressProfile} />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtle Ambient Gold Radiance in Background */}
        <View style={styles.radianceCircle} pointerEvents="none" />

        {/* 1. Hero Artwork Badge: Glowing Golden Treasure Chest Emblem */}
        <View style={styles.heroBadgeWrapper}>
          <View style={styles.heroGlowRing}>
            <Image
              source={victoryHeroImage}
              style={styles.heroArtwork}
              resizeMode="cover"
            />
          </View>
          <View style={styles.sparkleFloatingLeft}>
            <Ionicons name="sparkles" size={18} color="#F6D268" />
          </View>
          <View style={styles.sparkleFloatingRight}>
            <Ionicons name="sparkles" size={22} color="#D4AF37" />
          </View>
        </View>

        {/* 2. Official Field Record Banner */}
        <View style={styles.statusPillWrapper}>
          <LinearGradient
            colors={["#0F382E", "#09241D"]}
            style={styles.statusPill}
          >
            <MaterialCommunityIcons name="shield-check" size={14} color="#F6D268" />
            <Text style={styles.statusPillText}>
              {language === "ar" ? "سجل ميداني موثق ومختوم" : "OFFICIAL FIELD RECORD SEALED"}
            </Text>
          </LinearGradient>
        </View>

        {/* 3. Grand Congratulations Title */}
        <Text style={[styles.title, isRTL && styles.textRight]}>
          {language === "ar" ? "تم العثور على الكنز!" : "Treasure\nDiscovered!"}
        </Text>

        {/* 4. Hunter Honor Plaque Card */}
        <View style={styles.honorCard}>
          <LinearGradient
            colors={["#FFFFFF", "#FBF9F3"]}
            style={styles.honorCardInner}
          >
            <View style={styles.honorCardTopRow}>
              <View style={styles.laurelIconBox}>
                <MaterialCommunityIcons name="crown" size={20} color="#C99A24" />
              </View>
              <View style={styles.honorHeaderCol}>
                <Text style={styles.honorHeaderLabel}>
                  {language === "ar" ? "شهادة الإنجاز الميداني" : "EXPEDITION HONOR ROLL"}
                </Text>
                <Text style={styles.hunterNameTitle} numberOfLines={1}>
                  {explorerName}
                </Text>
              </View>
            </View>

            <View style={styles.honorDivider} />

            <View style={styles.honorDetailsRow}>
              <View style={styles.honorDetailCol}>
                <Text style={styles.honorDetailKey}>
                  {language === "ar" ? "الرحلة الاستكشافية" : "EXPEDITION"}
                </Text>
                <Text style={styles.honorDetailValue} numberOfLines={1}>
                  {localizedHuntTitle}
                </Text>
              </View>

              {Boolean(hunt.capitalWorth) && (
                <View style={[styles.honorDetailCol, { alignItems: "flex-end" }]}>
                  <Text style={styles.honorDetailKey}>
                    {language === "ar" ? "قيمة الجائزة" : "TREASURE WORTH"}
                  </Text>
                  <Text style={[styles.honorDetailValue, { color: "#B45309" }]}>
                    {hunt.capitalWorth}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.honorFooterRow}>
              <Feather name="check-circle" size={14} color="#15803D" />
              <Text style={styles.honorFooterText}>
                {language === "ar"
                  ? "تم تسجيل اسمك بشكل دائم في سجلات الشرف الخاصة بهذا الكنز"
                  : "Your name is permanently written into the story of this expedition."}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* 5. Primary Action Button */}
        <TouchableOpacity
          onPress={onReturnToCatalog}
          activeOpacity={0.88}
          style={styles.returnButtonContainer}
        >
          <LinearGradient
            colors={["#134E43", "#0D2823"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.returnButtonGradient}
          >
            <Ionicons name="compass-outline" size={18} color="#F6D268" />
            <Text style={styles.returnButtonText}>
              {t("returnToField")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.parchmentLight,
    overflow: "hidden",
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 60,
    alignItems: "center",
  },
  radianceCircle: {
    position: "absolute",
    top: 30,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(246, 210, 104, 0.15)",
    transform: [{ scale: 1.2 }],
  },
  heroBadgeWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 8,
    position: "relative",
  },
  heroGlowRing: {
    width: HERO_SIZE,
    height: HERO_SIZE,
    borderRadius: HERO_SIZE / 2,
    borderWidth: 2,
    borderColor: "#E1BF62",
    overflow: "hidden",
    shadowColor: "#C99A24",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    backgroundColor: "#0D2823",
  },
  heroArtwork: {
    width: "100%",
    height: "100%",
  },
  sparkleFloatingLeft: {
    position: "absolute",
    left: -10,
    top: 20,
  },
  sparkleFloatingRight: {
    position: "absolute",
    right: -12,
    bottom: 30,
  },
  statusPillWrapper: {
    marginBottom: 12,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(225, 191, 98, 0.5)",
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#F6D268",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    fontFamily: fonts.frauncesBold,
    color: "#0F382E",
    letterSpacing: -0.6,
    marginBottom: 22,
    textAlign: "center",
  },
  textRight: {
    textAlign: "right",
  },

  // Honor Card
  honorCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5D8B8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 28,
    overflow: "hidden",
  },
  honorCardInner: {
    padding: 20,
  },
  honorCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  laurelIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FEF9E7",
    borderWidth: 1,
    borderColor: "#E1BF62",
    alignItems: "center",
    justifyContent: "center",
  },
  honorHeaderCol: {
    flex: 1,
  },
  honorHeaderLabel: {
    fontSize: 9.5,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#8C7A5B",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  hunterNameTitle: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: fonts.frauncesBold,
    color: colors.primaryGreen,
  },
  honorDivider: {
    height: 1,
    backgroundColor: "#EDE4CE",
    marginVertical: 14,
  },
  honorDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  honorDetailCol: {
    flex: 1,
  },
  honorDetailKey: {
    fontSize: 9,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 1,
    color: "#8C7A5B",
    marginBottom: 3,
  },
  honorDetailValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primaryGreen,
  },
  honorFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(22, 163, 74, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  honorFooterText: {
    fontSize: 11.5,
    lineHeight: 16,
    color: "#166534",
    flex: 1,
    fontWeight: "600",
  },

  // Primary Action Button
  returnButtonContainer: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#0D2823",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  returnButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  returnButtonText: {
    color: colors.surfaceWhite,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
