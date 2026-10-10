import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Header } from "../components/Header";
import { CipherWheel } from "../components/CipherWheel";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { useLanguage } from "../i18n/LanguageContext";
import { Hunt } from "../types/hunt";
import { hunterApi } from "../services/api";

interface HuntDetailScreenProps {
  hunt: Hunt;
  onBack: () => void;
  onBuyNow: () => void;
  onPressProfile?: () => void;
}

export const HuntDetailScreen: React.FC<HuntDetailScreenProps> = ({
  hunt: initialHunt,
  onBack,
  onBuyNow,
  onPressProfile,
}) => {
  const { t, isRTL, language } = useLanguage();
  const { width } = useWindowDimensions();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState<number>(0);
  
  const [hunt, setHunt] = useState<Hunt>(initialHunt);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(true);

  React.useEffect(() => {
    let mounted = true;
    const loadDetails = async () => {
      try {
        const fullDetails = await hunterApi.fetchHuntDetails(initialHunt.id);
        if (mounted && fullDetails) {
          setHunt(fullDetails);
        }
      } catch (err) {
        // Ignore error and stick with initialHunt
      } finally {
        if (mounted) setLoadingDetails(false);
      }
    };
    loadDetails();
    return () => { mounted = false; };
  }, [initialHunt.id]);

  const images =
    hunt.galleryImages.length > 0 ? hunt.galleryImages : [hunt.coverImage];
  const localizedTitle = (isRTL && hunt.titleAr?.trim()) ? hunt.titleAr.trim() : hunt.title;
  const localizedBrief = (isRTL && hunt.briefAr?.trim()) ? hunt.briefAr.trim() : hunt.brief;

  const diffKey =
    hunt.difficulty === "EASY"
      ? "difficultyEasy"
      : hunt.difficulty === "MEDIUM"
      ? "difficultyMedium"
      : "difficultyHard";

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "EASY": return "#16A34A";
      case "MEDIUM": return "#D97706";
      case "HARD": return "#DC2626";
      default: return "#16A34A";
    }
  };

  const totalColumns = hunt.cipherColumns || 5;
  const extraDials = Math.max(0, totalColumns - 5);

  return (
    <View style={styles.screen}>
      <Header showBack onBack={onBack} onPressProfile={onPressProfile} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Carousel Image Container */}
        <View
          style={styles.carouselContainer}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0) setCarouselWidth(w);
          }}
        >
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const currentWidth = carouselWidth || e.nativeEvent.layoutMeasurement.width;
              if (currentWidth > 0) {
                const slide = Math.round(
                  e.nativeEvent.contentOffset.x / currentWidth,
                );
                setActiveImageIndex(slide);
              }
            }}
            scrollEventThrottle={16}
          >
            {images.map((imgUrl, i) => (
              <Image
                key={`gallery-${i}`}
                source={{ uri: imgUrl }}
                style={[
                  styles.heroImage,
                  { width: carouselWidth || Math.min(width - (width < 360 ? 32 : 48), 432) },
                ]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Dots Indicator */}
          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, i) => (
                <View
                  key={`dot-${i}`}
                  style={[
                    styles.dot,
                    activeImageIndex === i
                      ? styles.dotActive
                      : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Field Brief Header & Worth */}
        <View style={[styles.briefRow, isRTL && styles.rowReverse]}>
          <Text style={styles.fieldBriefLabel}>{t("fieldBrief")}</Text>
          <View style={[styles.priceAndWorthRow, isRTL && styles.rowReverse]}>
            {hunt.capitalWorth ? (
              <View style={[styles.detailWorthBadge, isRTL && styles.rowReverse]}>
                <Text style={styles.detailWorthIcon}>💎</Text>
                <Text style={styles.detailWorthText}>{hunt.capitalWorth}</Text>
              </View>
            ) : null}
            <Text style={styles.priceLabel}>
              {hunt.isFree ? t("free") : hunt.price}
            </Text>
          </View>
        </View>

        {/* Hunt Title */}
        <Text style={[styles.title, isRTL && [styles.textRight, styles.titleRTL]]}>
          {localizedTitle}
        </Text>

        {/* Difficulty Pill & Location Tag */}
        <View style={[styles.metaInfoRow, isRTL && styles.rowReverse]}>
          <View style={[styles.diffRow, isRTL && styles.rowReverse]}>
            <View style={[styles.diffDot, { backgroundColor: getDifficultyColor(hunt.difficulty) }]} />
            <Text style={[styles.diffText, { color: getDifficultyColor(hunt.difficulty) }]}>
              {t(diffKey)}
            </Text>
          </View>

          <View style={[styles.locationBadge, isRTL && styles.rowReverse]}>
            <Feather name="map-pin" size={12} color={colors.brassDark} />
            <Text style={styles.locationBadgeText}>
              {hunt.locationName || (hunt.stage1Pin ? "Historic Ruins" : "Expedition Point")}
            </Text>
          </View>
        </View>

        {/* Solved Status Banner if claimed */}
        {hunt.status === "FOUND" && (
          <View style={[styles.detailSolvedBanner, isRTL && styles.rowReverse]}>
            <Ionicons name="trophy" size={16} color="#B39345" />
            <Text style={styles.detailSolvedText}>
              {language === "ar" ? "تم حل هذا الكنز والعثور عليه" : "This treasure has been solved & claimed"}
              {hunt.claimedBy ? ` (${hunt.claimedBy})` : ""}
            </Text>
          </View>
        )}

        {/* Story Text */}
        <Text style={[styles.briefText, isRTL && styles.textRight]}>
          {localizedBrief}
        </Text>

        <View style={styles.divider} />

        {/* The Instrument Awaits */}
        <View style={[styles.instrumentHeader, isRTL && styles.alignRight]}>
          <Text style={[styles.instrumentLabel, isRTL && styles.textRight]}>
            {t("theInstrumentAwaits")}
          </Text>
        </View>

        {/* Brass Cipher Preview Mechanism (Fixed 5 dials in portrait) */}
        <CipherWheel columns={5} isPreview />

        {/* Extra Dials Badge when hunt has > 5 cipher columns */}
        {extraDials > 0 && (
          <View style={styles.extraDialsBadgeContainer}>
            <View style={[styles.extraDialsBadge, isRTL && styles.rowReverse]}>
              <Feather name="lock" size={13} color={colors.brassDark} />
              <Text style={styles.extraDialsText}>
                {t("moreDialsBadge").replace("{count}", extraDials.toString())}
              </Text>
            </View>
          </View>
        )}

        {/* Unlock hint */}
        <Text style={[styles.cipherHintText, isRTL && styles.textRight]}>
          {t("unlockBrassCipher")}
        </Text>

        {/* Buy Now / Claimed Action Button */}
        {hunt.status === "FOUND" ? (
          <View style={[styles.claimedButton, isRTL && styles.rowReverse]}>
            <Ionicons name="trophy" size={16} color="#0D2823" />
            <Text style={styles.claimedButtonText}>
              {language === "ar" ? "تم حل هذا الكنز بالكامل" : "EXPEDITION CLAIMED"}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={onBuyNow}
            activeOpacity={0.88}
            style={[styles.buyButton, isRTL && styles.rowReverse]}
          >
            <Text style={styles.buyButtonText}>
              {hunt.isFree || hunt.price === "Free" || hunt.price === "0" || hunt.price === "0 KWD" || hunt.price === "0 AED"
                ? t("startFreeExpedition")
                : t("buyNow")}
            </Text>
            {hunt.isFree || hunt.price === "Free" || hunt.price === "0" || hunt.price === "0 KWD" || hunt.price === "0 AED" ? (
              <Ionicons name="flash-outline" size={17} color={colors.surfaceWhite} />
            ) : (
              <Feather name="shopping-bag" size={16} color={colors.surfaceWhite} />
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.parchmentLight,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  carouselContainer: {
    width: "100%",
    height: 320,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#1B1C1D",
    marginBottom: 20,
  },
  heroImage: {
    height: 320,
  },
  dotsRow: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: colors.brassGold,
    width: 14,
  },
  dotInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  briefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  fieldBriefLabel: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.brassDark,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.brassDark,
    fontFamily: fonts.frauncesBold,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
    color: colors.primaryGreen,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  titleRTL: {
    fontFamily: undefined,
    letterSpacing: 0,
    writingDirection: "rtl",
  },
  textRight: {
    textAlign: "right",
  },
  alignRight: {
    alignItems: "flex-end",
  },
  metaInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  diffRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  diffDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#DD6B20",
  },
  diffText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#DD6B20",
    fontFamily: "monospace",
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(180, 140, 60, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(180, 140, 60, 0.25)",
  },
  locationBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.brassDark,
  },
  briefText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginBottom: 20,
  },
  instrumentHeader: {
    marginBottom: 10,
  },
  instrumentLabel: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.brassDark,
  },
  extraDialsBadgeContainer: {
    marginTop: 14,
    alignItems: "center",
  },
  extraDialsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "rgba(213, 180, 98, 0.16)",
    borderWidth: 1,
    borderColor: colors.brassGold,
  },
  extraDialsText: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier-Bold" : "monospace",
    fontWeight: "700",
    letterSpacing: 1.2,
    color: colors.brassDark,
  },
  cipherHintText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
  buyButton: {
    backgroundColor: colors.buttonGreen,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#0D2823",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 24,
    marginBottom: 20,
    width: "100%",
  },
  buyButtonText: {
    color: colors.surfaceWhite,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
  priceAndWorthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailWorthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(13, 40, 35, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
  },
  detailWorthIcon: {
    fontSize: 11,
  },
  detailWorthText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
    color: colors.primaryGreen,
  },
  detailSolvedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FDF6E2",
    borderWidth: 1,
    borderColor: "#E1BF62",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  detailSolvedText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B6F1E",
    flex: 1,
  },
  claimedButton: {
    backgroundColor: "#E1BF62",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 24,
    marginBottom: 20,
    width: "100%",
  },
  claimedButtonText: {
    color: "#0D2823",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
});

