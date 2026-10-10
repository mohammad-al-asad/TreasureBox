import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Alert,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Header } from "../components/Header";
import { CipherWheel } from "../components/CipherWheel";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { useLanguage } from "../i18n/LanguageContext";
import { Hunt } from "../types/hunt";

interface ExpeditionScreenProps {
  hunt: Hunt;
  remainingAttempts?: number;
  onBack: () => void;
  onCipherSolved: (sequence: string) => void;
  onPressProfile?: () => void;
}

type TabType = "cipher" | "hints" | "map";

const generateRandomSequence = (length: number) => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
};

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

function buildStage1StaticMapUrl(lat: number, lng: number, mapWidth: number): string {
  const zoom = 15;
  const size = `${Math.min(mapWidth, 420) * 2}x${260 * 2}`;
  if (GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
    const marker = `color:0xC59B27|label:S|${lat},${lng}`;
    return (
      `https://maps.googleapis.com/maps/api/staticmap` +
      `?center=${lat},${lng}&zoom=${zoom}&size=${size}&maptype=roadmap` +
      `&markers=${encodeURIComponent(marker)}&key=${GOOGLE_MAPS_API_KEY}`
    );
  }
  return (
    `https://staticmap.openstreetmap.de/staticmap.php` +
    `?center=${lat},${lng}&zoom=${zoom}&size=${size}&maptype=mapnik&markers=${lat},${lng},red-pushpin`
  );
}

export const ExpeditionScreen: React.FC<ExpeditionScreenProps> = ({
  hunt,
  remainingAttempts = 3,
  onBack,
  onCipherSolved,
  onPressProfile,
}) => {
  const { t, isRTL, language } = useLanguage();
  const { width } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<TabType>("cipher");

  // Initial sequence scramble
  const backendInitial = hunt.initialSequence || "";
  const isAccidentalSolve =
    backendInitial.trim().toUpperCase() === (hunt.cipherSequence || "").trim().toUpperCase();

  const [currentSeq, setCurrentSeq] = useState(() => {
    if (backendInitial && !isAccidentalSolve) return backendInitial;
    return generateRandomSequence(hunt.cipherColumns || 5);
  });

  const hintCardWidth = (width - 48 - 12) / 2;

  const localizedTitle = (isRTL && hunt.titleAr?.trim()) ? hunt.titleAr.trim() : hunt.title;
  const stage1LocationName =
    (language === "ar" ? hunt.locationNameAr : hunt.locationName) ||
    (language === "ar" ? "منطقة البحث الأولى" : "Stage 1 Search Area");

  const targetLat = hunt.coordinates?.latitude ?? 25.2644;
  const targetLng = hunt.coordinates?.longitude ?? 55.2982;
  const coordinatesString =
    hunt.stage1Pin || `${targetLat.toFixed(4)}° N, ${targetLng.toFixed(4)}° E`;

  const stage1StaticMapUrl = buildStage1StaticMapUrl(targetLat, targetLng, width - 48);

  const stage1OsmEmbedUrl =
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${targetLng - 0.008},${targetLat - 0.007},${targetLng + 0.008},${targetLat + 0.007}` +
    `&layer=mapnik&marker=${targetLat},${targetLng}`;

  const handleOpenMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(stage1LocationName)}&ll=${targetLat},${targetLng}`,
      android: `geo:0,0?q=${targetLat},${targetLng}(${encodeURIComponent(stage1LocationName)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${targetLat},${targetLng}`,
    });
    if (url) Linking.openURL(url).catch(() => {});
  };

  const handleVerifyCipher = () => {
    const confirmTitle = t("cipherAttemptConfirmTitle");
    const confirmMessage = t("cipherAttemptConfirmMsg").replace(
      "{remaining}",
      remainingAttempts.toString()
    );

    if (Platform.OS === "web") {
      const confirmed = typeof window !== "undefined" && window.confirm
        ? window.confirm(`${confirmTitle}\n\n${confirmMessage}\n\n[ ${currentSeq} ]`)
        : true;
      if (confirmed) {
        onCipherSolved(currentSeq);
      }
    } else {
      Alert.alert(
        confirmTitle,
        `${confirmMessage}\n\n${currentSeq}`,
        [
          {
            text: t("cancelVerifyBtn"),
            style: "cancel",
          },
          {
            text: t("confirmVerifyBtn"),
            onPress: () => onCipherSolved(currentSeq),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.screen}>
      <Header showBack onBack={onBack} onPressProfile={onPressProfile} />

      <View style={styles.headerWrapper}>
        {/* Stage 1 Label & Expedition Title */}
        <View style={[styles.headerSection, isRTL && styles.alignRight]}>
          <Text style={[styles.stageLabel, isRTL && styles.textRight]}>
            {t("stageOne")}
          </Text>
          <Text style={[styles.huntTitle, isRTL && [styles.textRight, { writingDirection: "rtl" }]]} numberOfLines={1}>
            {localizedTitle}
          </Text>
        </View>

        {/* 3-Tab Navigator Bar (Portrait-first: Cipher, Hints, Area Map) */}
        <View style={[styles.tabBar, isRTL && styles.rowReverse]}>
          {/* Tab 1: Cipher */}
          <TouchableOpacity
            onPress={() => setActiveTab("cipher")}
            style={[styles.tabItem, activeTab === "cipher" && styles.tabItemActive]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color={activeTab === "cipher" ? colors.primaryGreen : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "cipher" && styles.tabTextActive,
              ]}
            >
              {t("cipherTab")}
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Hints */}
          <TouchableOpacity
            onPress={() => setActiveTab("hints")}
            style={[styles.tabItem, activeTab === "hints" && styles.tabItemActive]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="search-outline"
              size={16}
              color={activeTab === "hints" ? colors.primaryGreen : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "hints" && styles.tabTextActive,
              ]}
            >
              {t("hintsTab")}
            </Text>
          </TouchableOpacity>

          {/* Tab 3: Area Map (Map 1 before treasure) */}
          <TouchableOpacity
            onPress={() => setActiveTab("map")}
            style={[styles.tabItem, activeTab === "map" && styles.tabItemActive]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="map-outline"
              size={16}
              color={activeTab === "map" ? colors.primaryGreen : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "map" && styles.tabTextActive,
              ]}
            >
              {language === "ar" ? "خريطة المنطقة" : "Area Map"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab 1: Cipher Content */}
        {activeTab === "cipher" && (
          <View style={styles.tabContent}>
            <View style={styles.cipherInstructionsBox}>
              <Text style={[styles.instructions, isRTL && styles.textRight]}>
                {t("cipherInstructions")}
              </Text>
            </View>

            {/* Attempt Counter Banner */}
            <View style={styles.attemptsBadgeWrapper}>
              <View style={styles.attemptsBadge}>
                <Feather name="shield" size={13} color="#D4AF37" />
                <Text style={styles.attemptsBadgeText}>
                  {language === "ar"
                    ? `المحاولات المتبقية: ${remainingAttempts} من 3`
                    : `Attempts Remaining: ${remainingAttempts} / 3`}
                </Text>
              </View>
            </View>

            {/* Responsive Portrait Cryptex Tumbler Assembly */}
            <CipherWheel
              columns={hunt.cipherColumns}
              initialSequence={currentSeq}
              onSequenceChange={setCurrentSeq}
              isLandscape={false}
            />

            {/* Large Luxury Shiny Gold "Verify Cipher" Action Button */}
            <View style={styles.verifyButtonWrapper}>
              <TouchableOpacity
                onPress={handleVerifyCipher}
                activeOpacity={0.88}
                style={styles.verifyGoldButtonContainer}
              >
                <LinearGradient
                  colors={["#FFFBEA", "#F7D878", "#D4A82F", "#8C6810"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.verifyGoldButtonGradient}
                >
                  <View style={styles.verifyIconCircle}>
                    <Ionicons name="key" size={20} color="#2A1B04" />
                  </View>
                  <Text style={styles.verifyGoldButtonText}>
                    {language === "ar" ? "تحقق من الشفرة" : "VERIFY CIPHER"}
                  </Text>
                  <View style={styles.sparkleIconBox}>
                    <Ionicons name="sparkles" size={16} color="#FFF2BE" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.verifySubtext}>
                {language === "ar"
                  ? "سيتم خصم محاولة واحدة عند الضغط على التحقق"
                  : "Deducts 1 attempt per verification test"}
              </Text>
            </View>
          </View>
        )}

        {/* Tab 2: Stage 1 Hints Content */}
        {activeTab === "hints" && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionHeading, isRTL && styles.textRight]}>
              {t("lookClosely")}
            </Text>

            <View style={[styles.hintsGrid, isRTL && styles.rowReverse]}>
              {hunt.hints.map((hint) => (
                <View
                  key={hint.id}
                  style={[styles.hintCard, { width: hintCardWidth }]}
                >
                  <Image
                    source={{ uri: hint.image }}
                    style={styles.hintImage}
                    resizeMode="cover"
                  />
                  <Text
                    style={[styles.hintCaption, isRTL && styles.textRight]}
                    numberOfLines={2}
                  >
                    {language === "ar" ? hint.captionAr : hint.caption}
                  </Text>
                </View>
              ))}
            </View>

            {Boolean(hunt.cipherHintImage) && (
              <View style={styles.cipherClueImageCard}>
                <Image
                  source={{ uri: hunt.cipherHintImage }}
                  style={styles.cipherClueImage}
                  resizeMode="cover"
                />
              </View>
            )}

            <Text style={[styles.hintsGuidanceText, isRTL && styles.textRight]}>
              {language === "ar"
                ? hunt.hintInstructionsAr || hunt.hintInstructions
                : hunt.hintInstructions}
            </Text>
          </View>
        )}

        {/* Tab 3: Stage 1 Search Area Map (Map 1 before treasure) */}
        {activeTab === "map" && (
          <View style={styles.tabContent}>
            <View style={styles.mapHeaderBox}>
              <View style={styles.stageOnePill}>
                <Text style={styles.stageOnePillText}>
                  {language === "ar"
                    ? "المرحلة الأولى: منطقة البحث الأولية"
                    : "STAGE 1: INITIAL SEARCH PERIMETER"}
                </Text>
              </View>
              <Text style={[styles.mapLocationTitle, isRTL && styles.textRight]}>
                {stage1LocationName}
              </Text>
              <Text style={[styles.mapCoordinatesSub, isRTL && styles.textRight]}>
                📍 {coordinatesString}
              </Text>
              <Text style={[styles.mapGuidanceText, isRTL && styles.textRight]}>
                {language === "ar"
                  ? "هذه هي منطقة البحث الميدانية الأولى حيث يتم إخفاء الرموز والعلامات المادية لحل الشفرة. توجه إلى هذا الموقع الميداني للبحث عن الأحرف."
                  : "This is your starting search perimeter where the physical cipher markers are placed. Visit this area to discover the letters needed to align the brass tumblers."}
              </Text>
            </View>

            {/* Map Preview Card */}
            <TouchableOpacity
              activeOpacity={Platform.OS === "web" ? 1 : 0.9}
              onPress={Platform.OS === "web" ? undefined : handleOpenMaps}
              style={styles.stage1MapCard}
            >
              {Platform.OS === "web" ? (
                <View style={styles.webMapWrapper}>
                  {/* @ts-ignore */}
                  <iframe
                    src={stage1OsmEmbedUrl}
                    style={{
                      width: "100%",
                      height: 240,
                      border: "none",
                      borderRadius: 14,
                    }}
                    loading="lazy"
                  />
                </View>
              ) : (
                <Image
                  source={{ uri: stage1StaticMapUrl }}
                  style={styles.stage1MapImage}
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>

            {/* Open In Maps CTA Button */}
            <TouchableOpacity
              onPress={handleOpenMaps}
              activeOpacity={0.88}
              style={styles.openInMapsButton}
            >
              <Ionicons name="navigate" size={17} color="#FFFDF7" />
              <Text style={styles.openInMapsButtonText}>
                {t("openInMaps")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  headerWrapper: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  headerSection: {
    marginBottom: 10,
  },
  alignRight: {
    alignItems: "flex-end",
  },
  textRight: {
    textAlign: "right",
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  stageLabel: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.brassDark,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  huntTitle: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: fonts.frauncesBold,
    color: colors.primaryGreen,
    letterSpacing: -0.3,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
    marginTop: 4,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: colors.brassGold,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primaryGreen,
    fontWeight: "800",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  tabContent: {
    paddingTop: 4,
  },
  cipherInstructionsBox: {
    marginBottom: 8,
  },
  instructions: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: "center",
  },
  attemptsBadgeWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  attemptsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#162823",
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D4AF37",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  attemptsBadgeText: {
    color: "#F4E0A5",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
    letterSpacing: 0.5,
  },

  // Grand Shiny Gold "Verify Cipher" Action Button
  verifyButtonWrapper: {
    alignItems: "center",
    marginTop: 18,
    marginBottom: 10,
  },
  verifyGoldButtonContainer: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#C99A24",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#FFF3CD",
  },
  verifyGoldButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  verifyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF8E1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  verifyGoldButtonText: {
    fontSize: 15,
    fontWeight: "900",
    fontFamily: fonts.frauncesBold,
    color: "#251803",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sparkleIconBox: {
    marginLeft: 2,
  },
  verifySubtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: "center",
  },

  // Tab 2: Hints styles
  sectionHeading: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.brassDark,
    marginBottom: 14,
  },
  hintsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  hintCard: {},
  hintImage: {
    width: "100%",
    height: 130,
    borderRadius: 14,
    marginBottom: 6,
  },
  hintCaption: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  hintsGuidanceText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: 6,
  },
  cipherClueImageCard: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.parchmentDark,
    marginBottom: 14,
  },
  cipherClueImage: {
    width: "100%",
    height: 180,
    borderRadius: 14,
  },

  // Tab 3: Stage 1 Search Area Map styles
  mapHeaderBox: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  stageOnePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(197, 155, 39, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  stageOnePillText: {
    fontSize: 9.5,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 1.5,
    color: colors.brassDark,
  },
  mapLocationTitle: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: fonts.frauncesBold,
    color: colors.primaryGreen,
    marginBottom: 4,
  },
  mapCoordinatesSub: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#6B7280",
    marginBottom: 10,
  },
  mapGuidanceText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  stage1MapCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.parchmentDark,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  stage1MapImage: {
    width: "100%",
    height: 240,
  },
  webMapWrapper: {
    width: "100%",
    height: 240,
  },
  openInMapsButton: {
    backgroundColor: colors.buttonGreen,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#0D2823",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 10,
  },
  openInMapsButtonText: {
    color: colors.surfaceWhite,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
