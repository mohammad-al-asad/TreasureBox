import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { useLanguage } from "../i18n/LanguageContext";

interface OnboardingScreenProps {
  onComplete: () => void;
}

const { width } = Dimensions.get("window");

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
}) => {
  const { language, toggleLanguage, isRTL } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const slides = [
    {
      icon: "compass-outline",
      iconType: "mci" as const,
      eyebrow: language === "ar" ? "بعثات استكشافية واقعية" : "REAL-WORLD EXPEDITIONS",
      title:
        language === "ar"
          ? "العالم هو\nخريطتك الحقيقية"
          : "The World Is\nYour Living Map.",
      desc:
        language === "ar"
          ? "استكشف معالم تاريخية وأسواقًا عريقة. كل رحلة تخبئ كنزًا حقيقيًا واحدًا بانتظار من يكتشفه."
          : "Step into authentic heritage sites and ancient markets. Every expedition holds one genuine physical treasure.",
    },
    {
      icon: "lock",
      iconType: "feather" as const,
      eyebrow: language === "ar" ? "آلية الشفرة الكلاسيكية" : "BRASS CRYPTEX MECHANISM",
      title:
        language === "ar"
          ? "فك رموز\nالشفرة النحاسية"
          : "Align The Brass\nCipher Rings.",
      desc:
        language === "ar"
          ? "اكتشف الحروف المخفية في المعالم المعمارية، وقم بتدوير أسطوانات الكربتكس لفتح الإحداثيات السرية."
          : "Discover letter clues etched into historic landmarks. Turn the mechanical dials to unlock the secret cache location.",
    },
    {
      icon: "award",
      iconType: "feather" as const,
      eyebrow: language === "ar" ? "سجل الشرف للمكتشفين" : "HUNTER HONOR ROLL",
      title:
        language === "ar"
          ? "وثق اكتشافك\nواحصد الجائزة"
          : "Photograph The Cache,\nClaim The Glory.",
      desc:
        language === "ar"
          ? "أول مستكشف يصل إلى الكنز ويوثق الصورة يخلد اسمه رسميًا في السجل الدائم للبعثة."
          : "Be the first to reach the physical chest, photograph the find, and claim your place in the permanent expedition registry.",
    },
  ];

  const handleNext = () => {
    if (currentStep < slides.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const activeSlide = slides[currentStep];

  return (
    <View style={styles.container}>
      {/* Top Bar: Language toggle & Skip */}
      <View style={[styles.topBar, isRTL && styles.rowReverse]}>
        {/* Language switch */}
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

        {/* Skip button */}
        <TouchableOpacity onPress={onComplete} activeOpacity={0.7}>
          <Text style={styles.skipText}>
            {language === "ar" ? "تخطي" : "Skip"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Card */}
      <View style={styles.contentContainer}>
        {/* Visual Emblem Badge */}
        <View style={styles.badgeWrapper}>
          <LinearGradient
            colors={["#E6CC8A", "#B8963E", "#72531B"]}
            style={styles.outerBadgeCircle}
          >
            <View style={styles.innerBadgeCircle}>
              {activeSlide.iconType === "mci" ? (
                <MaterialCommunityIcons
                  name="compass-outline"
                  size={52}
                  color={colors.primaryGreen}
                />
              ) : (
                <Feather
                  name={activeSlide.icon as any}
                  size={46}
                  color={colors.primaryGreen}
                />
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Eyebrow */}
        <Text style={[styles.eyebrow, isRTL && styles.textRight]}>
          {activeSlide.eyebrow}
        </Text>

        {/* Slide Title */}
        <Text style={[styles.title, isRTL && styles.textRight]}>
          {activeSlide.title}
        </Text>

        {/* Description */}
        <Text style={[styles.description, isRTL && styles.textRight]}>
          {activeSlide.desc}
        </Text>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Step Indicators */}
        <View style={[styles.dotsRow, isRTL && styles.rowReverse]}>
          {slides.map((_, i) => (
            <View
              key={`dot-${i}`}
              style={[
                styles.dot,
                i === currentStep ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.88}
          style={[styles.actionButton, isRTL && styles.rowReverse]}
        >
          <Text style={styles.actionButtonText}>
            {currentStep === slides.length - 1
              ? language === "ar"
                ? "ابدأ المغامرة"
                : "BEGIN EXPEDITION"
              : language === "ar"
              ? "التالي"
              : "CONTINUE"}
          </Text>
          <Ionicons
            name={
              isRTL
                ? "arrow-back-circle-outline"
                : "arrow-forward-circle-outline"
            }
            size={20}
            color={colors.surfaceWhite}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentLight,
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  textRight: {
    textAlign: "right",
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceWhite,
    borderWidth: 1,
    borderColor: colors.brassBorder,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },
  langText: {
    fontSize: 12,
    fontWeight: "700",
  },
  langActive: {
    color: colors.brassDark,
  },
  langInactive: {
    color: colors.textMuted,
  },
  langDivider: {
    fontSize: 12,
    color: colors.borderMedium,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  contentContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  badgeWrapper: {
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  outerBadgeCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  innerBadgeCircle: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    backgroundColor: colors.parchmentDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FAF6ED",
  },
  eyebrow: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.brassDark,
    marginBottom: 12,
    textAlign: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
    color: colors.primaryGreen,
    textAlign: "center",
    lineHeight: 38,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 320,
  },
  bottomControls: {
    width: "100%",
    alignItems: "center",
    gap: 24,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.brassDark,
  },
  dotInactive: {
    width: 6,
    backgroundColor: colors.borderMedium,
  },
  actionButton: {
    backgroundColor: colors.buttonGreen,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    shadowColor: "#0D2823",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: colors.surfaceWhite,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
