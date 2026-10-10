import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  useWindowDimensions,
  RefreshControl,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Header } from "../components/Header";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { useLanguage } from "../i18n/LanguageContext";
import { resolveMediaUrl, hunterApi } from "../services/api";
import { Hunt } from "../types/hunt";
import { Ionicons } from "@expo/vector-icons";

interface CatalogScreenProps {
  hunts: Hunt[];
  onSelectHunt: (hunt: Hunt) => void;
  onOpenMenu: () => void;
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
  onPressProfile?: () => void;
}

const AnimatedCard = ({ hunt, index, onPress, width, height, t, language, isRTL }: any) => {
  const [imageError, setImageError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100, // Stagger effect
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "EASY": return "#16A34A"; // Exact green requested
      case "MEDIUM": return "#D97706"; // Exact yellow/gold requested
      case "HARD": return "#DC2626"; // Exact red requested
      default: return "#16A34A";
    }
  };

  const isFound = hunt.status === "FOUND";
  const localizedTitle = language === "ar" ? hunt.titleAr || hunt.title : hunt.title;
  const diffKey =
    hunt.difficulty === "EASY" ? "difficultyEasy" :
    hunt.difficulty === "MEDIUM" ? "difficultyMedium" : "difficultyHard";

  const priceText = hunt.isFree
    ? t("free")
    : typeof hunt.price === "string" && hunt.price.includes("KWD")
    ? hunt.price
    : typeof hunt.price === "string" && (hunt.price.startsWith("$") || hunt.price.includes("AED"))
    ? `${hunt.price.replace("$", "").replace("AED", "").trim()} KWD`
    : `${hunt.price} KWD`;

  const resolvedCover = resolveMediaUrl(hunt.coverImage);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress(hunt)}
        style={[styles.card, { width, height }]}
      >
        {resolvedCover && !imageError ? (
          <Image
            source={{ uri: resolvedCover }}
            style={styles.cardImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.cardImage, styles.cardImageFallback]}>
            <LinearGradient
              colors={["#2C3E50", "#1A252F", "#111827"]}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="compass-outline" size={36} color={colors.brassGold} />
          </View>
        )}

        <LinearGradient
          colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.85)"]}
          style={styles.gradientOverlay}
        />

        {/* Top Badges: Worth Badge & Solved Status */}
        <View style={[styles.cardTopBadges, isRTL && styles.rowReverse]}>
          {hunt.capitalWorth ? (
            <View style={styles.worthBadge}>
              <Text style={styles.worthBadgeIcon}>💎</Text>
              <Text numberOfLines={1} style={styles.worthBadgeText}>
                {hunt.capitalWorth}
              </Text>
            </View>
          ) : (
            <View />
          )}

          {isFound ? (
            <View style={[styles.foundBadge, { backgroundColor: "#B45309", paddingHorizontal: 9 }]}>
              <Text style={[styles.foundBadgeText, { fontWeight: "800", color: "#FEF3C7" }]}>
                🏆 {hunt.claimedBy ? `★ ${hunt.claimedBy}` : (language === "ar" ? "تم التحقق والمطالبة" : "VERIFIED & CLAIMED")}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardBottom}>
          <View style={[styles.metaRow, isRTL && styles.rowReverse]}>
            <View style={styles.difficultyBadge}>
              <View style={[styles.diffDot, { backgroundColor: getDifficultyColor(hunt.difficulty) }]} />
              <Text style={styles.difficultyText}>{t(diffKey)}</Text>
            </View>

            <Text style={styles.priceText}>{priceText}</Text>
          </View>

          <Text numberOfLines={2} style={[styles.cardTitle, isRTL && styles.textRight]}>
            {localizedTitle}
          </Text>

          {/* Location / Area Tag */}
          <View style={[styles.locationRow, isRTL && styles.rowReverse]}>
            <Ionicons name="location-sharp" size={11} color={colors.brassGold} />
            <Text numberOfLines={1} style={[styles.locationText, isRTL && styles.textRight]}>
              {hunt.locationName || (hunt.stage1Pin ? "Historic District" : "Ancient Site")}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const CatalogScreen: React.FC<CatalogScreenProps> = ({
  hunts,
  onSelectHunt,
  onOpenMenu,
  onRefresh,
  isRefreshing,
  onPressProfile,
}) => {
  const { width } = useWindowDimensions();
  const { t, isRTL, language } = useLanguage();

  const paddingHorizontal = 24;
  const gap = 16;
  const availableWidth = width - paddingHorizontal * 2;
  const cardWidth = Math.floor((availableWidth - gap) / 2) - 1;
  const cardHeight = cardWidth * 1.35;

  const [filterTab, setFilterTab] = useState<"ALL" | "PURCHASED" | "EASY" | "MEDIUM" | "HARD" | "SOLVED">("ALL");
  const [purchasedHunts, setPurchasedHunts] = useState<Hunt[]>([]);
  const [loadingPurchased, setLoadingPurchased] = useState(false);
  const [priceSort, setPriceSort] = useState<"NONE" | "ASC" | "DESC">("NONE");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (filterTab === "PURCHASED") {
      setLoadingPurchased(true);
      hunterApi
        .fetchMyPurchasedExpeditions()
        .then((res: { hunts: Hunt[]; total: number }) => {
          if (Array.isArray(res.hunts)) {
            setPurchasedHunts(res.hunts);
          }
        })
        .catch((e: unknown) => console.warn("Failed to load purchased expeditions:", e))
        .finally(() => setLoadingPurchased(false));
    }
  }, [filterTab]);

  const filterOptions = [
    {
      key: "ALL" as const,
      label: language === "ar" ? "جميع المغامرات" : "All Expeditions",
      icon: <Ionicons name="sparkles" size={14} color={colors.primaryGreen} />,
    },
    {
      key: "PURCHASED" as const,
      label: t("myExpeditionsTab") || "My Expeditions",
      icon: <Ionicons name="compass" size={14} color="#0E829E" />,
    },
    {
      key: "SOLVED" as const,
      label: language === "ar" ? "الكنوز المحلولة" : "Solved Treasures",
      icon: <Ionicons name="trophy" size={14} color="#B39345" />,
    },
    {
      key: "EASY" as const,
      label: t("difficultyEasy") || "Easy",
      dotColor: "#16A34A",
    },
    {
      key: "MEDIUM" as const,
      label: t("difficultyMedium") || "Medium",
      dotColor: "#D97706",
    },
    {
      key: "HARD" as const,
      label: t("difficultyHard") || "Hard",
      dotColor: "#DC2626",
    },
  ];

  const currentOption = filterOptions.find((o) => o.key === filterTab) || filterOptions[0];

  const filteredAndSortedHunts = useMemo(() => {
    if (filterTab === "PURCHASED") {
      return purchasedHunts;
    }

    let result = [...hunts];
    
    if (filterTab === "SOLVED") {
      result = result.filter(h => h.status === "FOUND");
    } else if (filterTab === "ALL") {
      result = result.filter(h => h.status !== "FOUND");
    } else {
      result = result.filter(h => h.difficulty === filterTab && h.status !== "FOUND");
    }
    
    if (priceSort !== "NONE") {
      result.sort((a, b) => {
        const pA = a.isFree ? 0 : parseFloat(a.price?.toString().replace(/[^0-9.]/g, '') || "0");
        const pB = b.isFree ? 0 : parseFloat(b.price?.toString().replace(/[^0-9.]/g, '') || "0");
        return priceSort === "ASC" ? pA - pB : pB - pA;
      });
    }
    return result;
  }, [hunts, filterTab, priceSort, purchasedHunts]);

  const togglePriceSort = () => {
    setPriceSort(prev => prev === "NONE" ? "ASC" : prev === "ASC" ? "DESC" : "NONE");
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  };

  return (
    <View style={styles.screen}>
      <Header showMenuButton onOpenMenu={onOpenMenu} onPressProfile={onPressProfile} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={Boolean(isRefreshing)}
              onRefresh={onRefresh}
              colors={[colors.primaryGreen, colors.brassGold]}
              tintColor={colors.primaryGreen}
            />
          ) : undefined
        }
      >
        <View style={[styles.titleSection, isRTL && styles.alignRight]}>
          <View style={[styles.topRow, isRTL && styles.rowReverse]}>
            <Text style={[styles.subheading, isRTL && styles.textRight]}>
              {t("discoverFieldExpeditions")}
            </Text>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>
                {String(hunts.length).padStart(2, "0")} {language === "ar" ? "مباشر" : "LIVE"}
              </Text>
            </View>
          </View>

          <View style={[isRTL && styles.rowReverse, { width: "100%", marginBottom: 16 }]}>
            <Text style={[styles.mainTitle, isRTL && [styles.textRight, styles.mainTitleRTL]]}>
              {t("chooseYourNextStory")}
            </Text>
          </View>

          {/* Single Filter Dropdown Bar */}
          <View style={styles.filterBarContainer}>
            <View style={[styles.filterBarRow, isRTL && styles.rowReverse]}>
              {/* Single Dropdown Trigger Button */}
              <TouchableOpacity
                onPress={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                }}
                activeOpacity={0.7}
                style={[
                  styles.filterDropdownButton,
                  isDropdownOpen && styles.filterDropdownButtonActive,
                  isRTL && styles.rowReverse,
                ]}
              >
                <View style={[styles.dropdownLabelGroup, isRTL && styles.rowReverse]}>
                  {currentOption.dotColor ? (
                    <View style={[styles.dropdownDot, { backgroundColor: currentOption.dotColor }]} />
                  ) : (
                    currentOption.icon
                  )}
                  <Text style={[styles.dropdownSelectedText, isRTL && styles.textRight, isRTL && { writingDirection: "rtl" }]}>
                    {currentOption.label}
                  </Text>
                </View>
                <Ionicons
                  name={isDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={15}
                  color={colors.primaryGreen}
                />
              </TouchableOpacity>

              {/* Price Sort Action Button */}
              <TouchableOpacity
                onPress={togglePriceSort}
                style={[styles.priceSortButton, priceSort !== "NONE" && styles.priceSortButtonActive, isRTL && styles.rowReverse]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={priceSort === "NONE" ? "swap-vertical" : priceSort === "ASC" ? "trending-up" : "trending-down"}
                  size={15}
                  color={priceSort !== "NONE" ? colors.primaryGreen : colors.textSecondary}
                />
                <Text style={[styles.priceSortText, priceSort !== "NONE" && styles.priceSortTextActive, isRTL && { writingDirection: "rtl" }]}>
                  {priceSort === "NONE" ? (language === "ar" ? "السعر" : "Price") : priceSort === "ASC" ? "KWD Low" : "KWD High"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Dropdown Menu Popover */}
            {isDropdownOpen && (
              <View style={[styles.dropdownMenu, isRTL && styles.dropdownMenuRTL]}>
                {filterOptions.map((opt, idx) => {
                  const isSelected = opt.key === filterTab;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => {
                        setFilterTab(opt.key);
                        setIsDropdownOpen(false);
                        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                      }}
                      activeOpacity={0.7}
                      style={[
                        styles.dropdownMenuItem,
                        isSelected && styles.dropdownMenuItemSelected,
                        idx < filterOptions.length - 1 && styles.dropdownMenuItemBorder,
                        isRTL && styles.rowReverse,
                      ]}
                    >
                      <View style={[styles.dropdownMenuItemLeft, isRTL && styles.rowReverse]}>
                        {opt.dotColor ? (
                          <View style={[styles.dropdownDot, { backgroundColor: opt.dotColor }]} />
                        ) : (
                          opt.icon
                        )}
                        <Text
                          style={[
                            styles.dropdownMenuItemText,
                            isSelected && styles.dropdownMenuItemTextSelected,
                            isRTL && styles.textRight,
                            isRTL && { writingDirection: "rtl" },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </View>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={16} color={colors.primaryGreen} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {hunts.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="compass-outline" size={32} color={colors.primaryGreen} />
            </View>
            <Text style={styles.emptyTitle}>
              {language === "ar" ? "لا توجد بعثات حالياً" : "No Expeditions Live Yet"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === "ar"
                ? "تأكد من تشغيل الخادم وإنشاء رحلات استكشافية من لوحة التحكم."
                : "New treasure hunts created in the operations dashboard will automatically appear here."}
            </Text>
          </View>
        ) : filteredAndSortedHunts.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name={filterTab === "SOLVED" ? "trophy-outline" : "search-outline"}
                size={32}
                color={colors.primaryGreen}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {filterTab === "SOLVED"
                ? (language === "ar" ? "لا توجد كنوز محلولة بعد" : "No Solved Treasures Yet")
                : (language === "ar" ? "لا توجد بعثات تطابق هذا التصنيف" : "No Expeditions Found")}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filterTab === "SOLVED"
                ? (language === "ar"
                    ? "الكنوز التي يحلها الصيادون ستظهر هنا."
                    : "Expeditions completed and claimed by hunters will appear here.")
                : (language === "ar"
                    ? "جرب تحديد تصنيف آخر من قائمة التصفية."
                    : "Try selecting a different filter option from the dropdown.")}
            </Text>
          </View>
        ) : (
          <View style={[styles.grid, isRTL && styles.gridRTL]}>
            {filteredAndSortedHunts.map((hunt, idx) => (
              <AnimatedCard 
                key={`${hunt.id}-${filterTab}-${priceSort}`} 
                hunt={hunt} 
                index={idx}
                onPress={onSelectHunt}
                width={cardWidth}
                height={cardHeight}
                t={t}
                language={language}
                isRTL={isRTL}
              />
            ))}
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
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  titleSection: {
    marginTop: 8,
    marginBottom: 16,
    zIndex: 100,
  },
  alignRight: {
    alignItems: "flex-end",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  subheading: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  textRight: {
    textAlign: "right",
  },
  liveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#E6F4EA",
    borderRadius: 12,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#137333",
    letterSpacing: 0.5,
  },
  titleAndNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  mainTitle: {
    flex: 1,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
    color: colors.primaryGreen,
    letterSpacing: -0.5,
  },
  mainTitleRTL: {
    fontFamily: undefined,
    letterSpacing: 0,
    writingDirection: "rtl",
  },
  filterBarContainer: {
    width: "100%",
    position: "relative",
    zIndex: 50,
  },
  filterBarRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  filterDropdownButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceWhite,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  filterDropdownButtonActive: {
    borderColor: colors.primaryGreen,
    backgroundColor: "#F9FAF8",
  },
  dropdownLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dropdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dropdownSelectedText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryGreen,
    letterSpacing: 0.2,
  },
  priceSortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceWhite,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  priceSortButtonActive: {
    borderColor: colors.primaryGreen,
    backgroundColor: "rgba(19, 115, 51, 0.06)",
  },
  priceSortText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  priceSortTextActive: {
    color: colors.primaryGreen,
    fontWeight: "700",
  },
  dropdownMenu: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    width: "100%",
    backgroundColor: colors.surfaceWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
    zIndex: 100,
  },
  dropdownMenuRTL: {},
  dropdownMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dropdownMenuItemSelected: {
    backgroundColor: "rgba(19, 115, 51, 0.05)",
  },
  dropdownMenuItemBorder: {
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dropdownMenuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  dropdownMenuItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  dropdownMenuItemTextSelected: {
    color: colors.primaryGreen,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },
  gridRTL: {
    flexDirection: "row-reverse",
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#1C1D1E",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardImageFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E252B",
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  cardTopBadges: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  worthBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(13, 40, 35, 0.88)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
  },
  worthBadgeIcon: {
    fontSize: 10,
  },
  worthBadgeText: {
    color: "#FDFBF7",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
  },
  foundBadge: {
    backgroundColor: "rgba(179, 147, 69, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E1BF62",
  },
  foundBadgeText: {
    color: "#0D2823",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  difficultyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  diffDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  priceText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
    lineHeight: 19,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    color: "#E2D9C8",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  emptyStateContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E9E5DA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 18,
    color: colors.primaryGreen,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
