import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { useLanguage } from "../i18n/LanguageContext";
import { TreasureBoxLogo } from "./TreasureBoxLogo";
import { useHunter } from "../context/HunterContext";

interface HeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  showMenuButton?: boolean;
  onOpenMenu?: () => void;
  onPressProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  showBack = false,
  onBack,
  showMenuButton = false,
  onOpenMenu,
  onPressProfile,
}) => {
  const { isRTL, t } = useLanguage();
  const { currentUser } = useHunter();

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      {/* Left Action: Back button or Hamburger Menu button */}
      {showBack ? (
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.circleButton}
        >
          <Ionicons
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={20}
            color={colors.primaryGreen}
          />
        </TouchableOpacity>
      ) : showMenuButton ? (
        <TouchableOpacity
          onPress={onOpenMenu}
          activeOpacity={0.7}
          style={styles.menuSquareButton}
        >
          {/* 2 horizontal bars matching the screenshot */}
          <View style={styles.menuBarTop} />
          <View style={styles.menuBarBottom} />
        </TouchableOpacity>
      ) : (
        <View style={styles.leftPlaceholder} />
      )}

      {/* Center Title (Brand Title in serif + Logo) */}
      <View style={[styles.centerTitleContainer, isRTL && styles.rowReverse]}>
        <TreasureBoxLogo size={22} />
        <Text style={[styles.brandTitle, isRTL && styles.brandTitleRTL]}>
          {t("brandName")}
        </Text>
      </View>

      {/* Right Spacer or Profile Avatar */}
      <View style={styles.rightPlaceholder}>
        <TouchableOpacity
          onPress={onPressProfile}
          activeOpacity={onPressProfile ? 0.7 : 1}
          style={styles.headerAvatarBadge}
        >
          {currentUser?.avatar ? (
            <Image source={{ uri: currentUser.avatar }} style={styles.headerAvatarImage} />
          ) : currentUser ? (
            <Text style={styles.headerAvatarInitial}>
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
            </Text>
          ) : (
            <Ionicons name="person" size={17} color="#E1BF62" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.parchmentLight,
    position: "relative",
  },
  containerRTL: {
    flexDirection: "row-reverse",
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  menuSquareButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: colors.borderMedium,
    backgroundColor: colors.surfaceWhite,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  menuBarTop: {
    width: 18,
    height: 2,
    backgroundColor: colors.primaryGreen,
    borderRadius: 1,
  },
  menuBarBottom: {
    width: 18,
    height: 2,
    backgroundColor: colors.primaryGreen,
    borderRadius: 1,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  diamondIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  leftPlaceholder: {
    width: 38,
    height: 38,
  },
  centerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primaryGreen,
    letterSpacing: -0.3,
    fontFamily: fonts.frauncesBold,
  },
  brandTitleRTL: {
    textAlign: "right",
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rightPlaceholder: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#103B30",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarInitial: {
    color: "#E1BF62",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
  },
  headerAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
