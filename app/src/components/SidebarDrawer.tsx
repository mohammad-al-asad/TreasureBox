import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Pressable,
  Platform,
  Image,
  Modal,
  Linking,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { useLanguage } from "../i18n/LanguageContext";
import { UserProfile } from "../types/hunt";
import { hunterApi } from "../services/api";

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (screen: "about-us" | "terms" | "privacy" | "profile" | "contact-us") => void;
  currentUser?: UserProfile | null;
  onSignOut?: () => void;
  onSignIn?: () => void;
}

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(width * 0.8, 320);

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentUser,
  onSignOut,
  onSignIn,
}) => {
  const { language, toggleLanguage, isRTL, t } = useLanguage();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactSettings, setContactSettings] = useState<any>(null);

  useEffect(() => {
    if (isContactModalOpen) {
      hunterApi.getContactSettings().then((res) => {
        if (res) setContactSettings(res);
      }).catch(() => {});
    }
  }, [isContactModalOpen]);

  const handleOpenLink = (url?: string) => {
    if (!url) return;
    try {
      Linking.openURL(url);
    } catch (e) {
      console.warn("Failed to open URL:", e);
    }
  };
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const isNative = Platform.OS !== "web";
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: isNative,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: isNative,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: isRTL ? DRAWER_WIDTH : -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: isNative,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: isNative,
        }),
      ]).start();
    }
  }, [isOpen, isRTL]);

  if (!isOpen) return null;

  return (
    <View style={styles.overlayContainer}>
      {/* Backdrop overlay */}
      <Pressable onPress={onClose} style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </Pressable>

      {/* Drawer content */}
      <Animated.View
        style={[
          styles.drawer,
          isRTL ? styles.drawerRTL : styles.drawerLTR,
          {
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [-DRAWER_WIDTH, 0, DRAWER_WIDTH],
                  outputRange: isRTL
                    ? [DRAWER_WIDTH, 0, -DRAWER_WIDTH]
                    : [-DRAWER_WIDTH, 0, DRAWER_WIDTH],
                }),
              },
            ],
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.drawerScroll}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Top bar inside drawer: EN|AR pill on left, Back button on right */}
          <View style={[styles.headerRow, isRTL && styles.rowReverse]}>
            {/* EN | AR Language Switcher */}
            <TouchableOpacity
              onPress={toggleLanguage}
              activeOpacity={0.8}
              style={styles.langPill}
            >
              <Text
                style={[
                  styles.langText,
                  language === "en" ? styles.langActive : styles.langInactive,
                ]}
              >
                EN
              </Text>
              <Text style={styles.langDivider}>|</Text>
              <Text
                style={[
                  styles.langText,
                  language === "ar" ? styles.langActive : styles.langInactive,
                ]}
              >
                AR
              </Text>
            </TouchableOpacity>

            {/* Close / Back button (<) */}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={styles.closeButton}
            >
              <Ionicons
                name={isRTL ? "chevron-forward" : "chevron-back"}
                size={18}
                color={colors.primaryGreen}
              />
            </TouchableOpacity>
          </View>

          {/* Section Label: About & Legal */}
          <View style={styles.menuSection}>
            <Text style={[styles.sectionLabel, isRTL && styles.textRight]}>
              {t("aboutLegal")}
            </Text>

            {/* Item 1: About us */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                onNavigate?.("about-us");
              }}
              activeOpacity={0.7}
              style={[styles.menuItem, isRTL && styles.rowReverse]}
            >
              <View style={styles.iconBox}>
                <Feather name="info" size={18} color={colors.primaryGreen} />
              </View>
              <Text style={[styles.menuItemText, isRTL && styles.textRight]}>
                {t("aboutUs")}
              </Text>
            </TouchableOpacity>

            {/* Item 2: Terms & Conditions */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                onNavigate?.("terms");
              }}
              activeOpacity={0.7}
              style={[styles.menuItem, isRTL && styles.rowReverse]}
            >
              <View style={styles.iconBox}>
                <Feather name="edit-3" size={18} color={colors.primaryGreen} />
              </View>
              <Text style={[styles.menuItemText, isRTL && styles.textRight]}>
                {t("termsConditions")}
              </Text>
            </TouchableOpacity>

            {/* Item 3: Privacy & Policy */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                onNavigate?.("privacy");
              }}
              activeOpacity={0.7}
              style={[styles.menuItem, isRTL && styles.rowReverse]}
            >
              <View style={styles.iconBox}>
                <Feather name="file-text" size={18} color={colors.primaryGreen} />
              </View>
              <Text style={[styles.menuItemText, isRTL && styles.textRight]}>
                {t("privacyPolicy")}
              </Text>
            </TouchableOpacity>

            {/* Item 4: Contact Us */}
            <TouchableOpacity
              onPress={() => setIsContactModalOpen(true)}
              activeOpacity={0.7}
              style={[styles.menuItem, isRTL && styles.rowReverse]}
            >
              <View style={styles.iconBox}>
                <Feather name="phone-call" size={18} color={colors.primaryGreen} />
              </View>
              <Text style={[styles.menuItemText, isRTL && styles.textRight]}>
                {t("contactUs")}
              </Text>
            </TouchableOpacity>

            {/* Item 5: Profile */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                onNavigate?.("profile");
              }}
              activeOpacity={0.7}
              style={[styles.menuItem, isRTL && styles.rowReverse]}
            >
              <View style={styles.iconBox}>
                <Feather name="user" size={18} color={colors.primaryGreen} />
              </View>
              <Text style={[styles.menuItemText, isRTL && styles.textRight]}>
                {t("profile") || "Profile"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* User Account & Sign Out Section */}
          <View style={styles.userFooterSection}>
            <View style={styles.footerDivider} />

            {currentUser ? (
              <View style={[styles.userProfileRow, isRTL && styles.rowReverse]}>
                {currentUser.avatar ? (
                  <View style={styles.userAvatarBadge}>
                    <Image source={{ uri: currentUser.avatar }} style={styles.userAvatarImage} />
                  </View>
                ) : (
                  <View style={styles.userAvatarBadge}>
                    <Text style={styles.userAvatarInitial}>
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "E"}
                    </Text>
                  </View>
                )}
                <View style={[styles.userInfoCol, isRTL && styles.alignRight]}>
                  <Text style={[styles.userNameText, isRTL && styles.textRight]} numberOfLines={1}>
                    {currentUser.name}
                  </Text>
                  <Text style={[styles.userEmailText, isRTL && styles.textRight]} numberOfLines={1}>
                    {currentUser.email}
                  </Text>
                </View>
              </View>
            ) : null}

            {currentUser && onSignOut && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onSignOut();
                }}
                activeOpacity={0.7}
                style={[styles.signOutButton, isRTL && styles.rowReverse]}
              >
                <View style={styles.iconBox}>
                  <Feather name="log-out" size={18} color="#DC2626" />
                </View>
                <Text style={[styles.signOutText, isRTL && styles.textRight]}>
                  {t("signOut")}
                </Text>
              </TouchableOpacity>
            )}

            {!currentUser && onSignIn && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onSignIn();
                }}
                activeOpacity={0.7}
                style={[styles.signInDrawerBtn, isRTL && styles.rowReverse]}
              >
                <View style={styles.iconBox}>
                  <Feather name="log-in" size={18} color={colors.primaryGreen} />
                </View>
                <Text style={[styles.signInDrawerText, isRTL && styles.textRight]}>
                  {t("signInBtn")} / {t("createAccountBtn")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Contact Us Modal */}
      <Modal
        visible={isContactModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsContactModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.contactModalCard}>
            <View style={[styles.modalHeader, isRTL && styles.rowReverse]}>
              <Text style={styles.modalTitle}>{t("contactUs")}</Text>
              <TouchableOpacity
                onPress={() => setIsContactModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={colors.primaryGreen} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.contactIntroText, isRTL && styles.textRight]}>
              {t("contactUsContent")}
            </Text>

            <View style={styles.contactItemsContainer}>
              {/* WhatsApp (Interactive) */}
              <TouchableOpacity
                onPress={() => {
                  const num = contactSettings?.whatsapp || "+971508891234";
                  const clean = num.replace(/[^0-9]/g, "");
                  handleOpenLink(`https://wa.me/${clean}`);
                }}
                activeOpacity={0.8}
                style={[styles.contactInfoRow, isRTL && styles.rowReverse]}
              >
                <View style={[styles.contactIconCircle, { backgroundColor: "rgba(37, 211, 102, 0.12)" }]}>
                  <Ionicons name="logo-whatsapp" size={19} color="#25D366" />
                </View>
                <View style={[styles.contactInfoTexts, isRTL && styles.alignRight]}>
                  <Text style={[styles.contactInfoLabel, isRTL && styles.textRight]}>
                    WhatsApp
                  </Text>
                  <Text style={[styles.contactInfoValue, isRTL && styles.textRight, { color: "#25D366" }]}>
                    {contactSettings?.whatsapp || "+971 50 889 1234"} ›
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Telegram (Interactive) */}
              <TouchableOpacity
                onPress={() => {
                  const tg = contactSettings?.telegram || "https://t.me/treasureboxapp";
                  handleOpenLink(tg.startsWith("http") ? tg : `https://t.me/${tg.replace("@", "")}`);
                }}
                activeOpacity={0.8}
                style={[styles.contactInfoRow, isRTL && styles.rowReverse]}
              >
                <View style={[styles.contactIconCircle, { backgroundColor: "rgba(14, 165, 233, 0.12)" }]}>
                  <Ionicons name="paper-plane" size={18} color="#0284C7" />
                </View>
                <View style={[styles.contactInfoTexts, isRTL && styles.alignRight]}>
                  <Text style={[styles.contactInfoLabel, isRTL && styles.textRight]}>
                    Telegram Channel
                  </Text>
                  <Text style={[styles.contactInfoValue, isRTL && styles.textRight, { color: "#0284C7" }]}>
                    {contactSettings?.telegram ? "@treasurebox" : "@treasureboxapp"} ›
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Social Channels Row (Instagram, X, TikTok) */}
              {(contactSettings?.instagram || contactSettings?.twitter || contactSettings?.tiktok) && (
                <View style={[styles.socialIconsRow, isRTL && styles.rowReverse]}>
                  {contactSettings?.instagram && (
                    <TouchableOpacity
                      onPress={() => handleOpenLink(contactSettings.instagram)}
                      style={[styles.socialMediaCircle, { backgroundColor: "rgba(225, 48, 108, 0.1)" }]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-instagram" size={18} color="#E1306C" />
                    </TouchableOpacity>
                  )}
                  {contactSettings?.twitter && (
                    <TouchableOpacity
                      onPress={() => handleOpenLink(contactSettings.twitter)}
                      style={[styles.socialMediaCircle, { backgroundColor: "rgba(0, 0, 0, 0.08)" }]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-twitter" size={17} color="#000000" />
                    </TouchableOpacity>
                  )}
                  {contactSettings?.tiktok && (
                    <TouchableOpacity
                      onPress={() => handleOpenLink(contactSettings.tiktok)}
                      style={[styles.socialMediaCircle, { backgroundColor: "rgba(0, 0, 0, 0.08)" }]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-tiktok" size={17} color="#000000" />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Email */}
              <TouchableOpacity
                onPress={() => handleOpenLink(`mailto:${contactSettings?.email || "support@treasurebox.app"}`)}
                activeOpacity={0.8}
                style={[styles.contactInfoRow, isRTL && styles.rowReverse]}
              >
                <View style={styles.contactIconCircle}>
                  <Feather name="mail" size={18} color={colors.primaryGreen} />
                </View>
                <View style={[styles.contactInfoTexts, isRTL && styles.alignRight]}>
                  <Text style={[styles.contactInfoLabel, isRTL && styles.textRight]}>
                    {t("contactEmail")}
                  </Text>
                  <Text style={[styles.contactInfoValue, isRTL && styles.textRight]}>
                    {contactSettings?.email || "support@treasurebox.app"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Hours */}
              <View style={[styles.contactInfoRow, isRTL && styles.rowReverse]}>
                <View style={styles.contactIconCircle}>
                  <Feather name="clock" size={18} color={colors.brassDark} />
                </View>
                <View style={[styles.contactInfoTexts, isRTL && styles.alignRight]}>
                  <Text style={[styles.contactInfoLabel, isRTL && styles.textRight]}>
                    {t("contactHours")}
                  </Text>
                  <Text style={[styles.contactInfoValue, isRTL && styles.textRight]}>
                    {language === "ar"
                      ? contactSettings?.workingHoursAr || t("contactHoursDetail")
                      : contactSettings?.workingHoursEn || t("contactHoursDetail")}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setIsContactModalOpen(false)}
              style={styles.contactDoneBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.contactDoneText}>{t("close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.surfaceWhite,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerScroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  drawerLTR: {
    left: 0,
    borderRightWidth: 1,
    borderColor: colors.borderSubtle,
  },
  drawerRTL: {
    right: 0,
    borderLeftWidth: 1,
    borderColor: colors.borderSubtle,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 36,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.brassBorder,
    backgroundColor: colors.surfaceWhite,
    gap: 6,
  },
  langText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  langActive: {
    color: colors.primaryGreen,
    fontWeight: "700",
  },
  langInactive: {
    color: colors.textMuted,
  },
  langDivider: {
    fontSize: 12,
    color: colors.brassBorder,
  },
  closeButton: {
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
  menuSection: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  textRight: {
    textAlign: "right",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  iconBox: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primaryGreen,
    letterSpacing: -0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    maxHeight: "80%",
    backgroundColor: colors.surfaceWhite,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
    color: colors.primaryGreen,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  modalDoneButton: {
    backgroundColor: colors.buttonGreen,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalDoneText: {
    color: colors.surfaceWhite,
    fontSize: 13,
    fontWeight: "700",
  },
  userFooterSection: {
    marginTop: "auto",
    paddingBottom: 24,
  },
  footerDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginBottom: 18,
  },
  userProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(13, 40, 35, 0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(13, 40, 35, 0.07)",
  },
  userAvatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#103B30",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarInitial: {
    color: "#E1BF62",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
  },
  userAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  userInfoCol: {
    flex: 1,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primaryGreen,
  },
  userEmailText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  alignRight: {
    alignItems: "flex-end",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
  },
  signInDrawerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(19, 115, 51, 0.08)",
    borderRadius: 12,
  },
  signInDrawerText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryGreen,
  },
  contactModalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surfaceWhite,
    borderRadius: 20,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  contactIntroText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  contactItemsContainer: {
    gap: 14,
    marginBottom: 22,
  },
  contactInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    backgroundColor: "#F7F5EE",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBE6DA",
  },
  contactIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceWhite,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  contactInfoTexts: {
    flex: 1,
  },
  contactInfoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contactInfoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primaryGreen,
    marginTop: 1,
  },
  contactDoneBtn: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  contactDoneText: {
    color: colors.surfaceWhite,
    fontSize: 14,
    fontWeight: "700",
  },
  socialIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 4,
  },
  socialMediaCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
});
