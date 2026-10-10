import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Header } from "../components/Header";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { useLanguage } from "../i18n/LanguageContext";
import { Hunt } from "../types/hunt";
import { playTreasureUnlockSound } from "../utils/audio";

// Local assets
const treasureChestOpenImg = require("../../assets/treasure-chest-open.jpg");
const treasureFoundHeroImg = require("../../assets/treasure-found-hero.jpg");

interface CipherSolvedScreenProps {
  hunt?: Hunt;
  onBack: () => void;
  onViewNewLocation: () => void;
  onFoundTreasureAlready: () => void;
  onPressProfile?: () => void;
}

const { width, height } = Dimensions.get("window");

// Confetti particle definition
interface Particle {
  id: number;
  startX: number;
  startY: number;
  targetY: number;
  size: number;
  color: string;
  delay: number;
  anim: Animated.Value;
  rotAnim: Animated.Value;
}

const CONFETTI_COLORS = [
  "#FFD700", // Gold
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#EF4444", // Ruby
  "#FBBF24", // Yellow
  "#FDF3D5", // Pale gold
];

export const CipherSolvedScreen: React.FC<CipherSolvedScreenProps> = ({
  hunt,
  onBack,
  onViewNewLocation,
  onFoundTreasureAlready,
  onPressProfile,
}) => {
  const { t, isRTL, language } = useLanguage();
  const [showHintModal, setShowHintModal] = useState(false);

  // Cinematic Fullscreen Video Animation Cutscene Overlay state
  const [showCinematicCutscene, setShowCinematicCutscene] = useState(true);

  // --- Animation Controllers ---
  // 1. Rotating Sunburst Rays
  const sunburstAnim = useRef(new Animated.Value(0)).current;
  // 2. Chest Spring Entry
  const chestScale = useRef(new Animated.Value(0.7)).current;
  const chestOpacity = useRef(new Animated.Value(0)).current;
  // 3. Glowing Light Beam Pulse
  const glowPulse = useRef(new Animated.Value(0.6)).current;
  // 4. Banner Slide & Shimmer
  const bannerSlide = useRef(new Animated.Value(-20)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  // 5. Cutscene modal scale
  const cutsceneScale = useRef(new Animated.Value(0.8)).current;
  const cutsceneOpacity = useRef(new Animated.Value(0)).current;

  // 6. Confetti Particles
  const particles = useRef<Particle[]>(
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      startX: Math.floor(Math.random() * (width - 40)) + 20,
      startY: -20 - Math.random() * 60,
      targetY: 360 + Math.random() * 100,
      size: 6 + Math.floor(Math.random() * 8),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: i * 65,
      anim: new Animated.Value(0),
      rotAnim: new Animated.Value(0),
    }))
  ).current;

  // Inject Web CSS hardware-accelerated animations for buttery smooth 60fps spin & glow
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const styleId = "treasure-cinematic-web-keyframes";
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
          @keyframes treasureSpinSlow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes treasureGlowPulse {
            0% { transform: scale(0.92); opacity: 0.6; }
            50% { transform: scale(1.12); opacity: 0.95; }
            100% { transform: scale(0.92); opacity: 0.6; }
          }
          @keyframes treasureFloat {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
          }
          .treasure-sunburst-spin {
            animation: treasureSpinSlow 14s linear infinite !important;
          }
          .treasure-pulse-glow {
            animation: treasureGlowPulse 2.4s ease-in-out infinite !important;
          }
          .treasure-chest-float {
            animation: treasureFloat 3.2s ease-in-out infinite !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  const runCelebrationAnimations = () => {
    // A. Sunburst Infinite Rotation Loop
    sunburstAnim.setValue(0);
    Animated.loop(
      Animated.timing(sunburstAnim, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // B. Chest Scale-in Bounce
    chestScale.setValue(0.7);
    chestOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(chestOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(chestScale, {
        toValue: 1,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();

    // C. Glowing Light Pulse Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.55,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // D. Banner Fade & Slide
    bannerSlide.setValue(-20);
    bannerOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(bannerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(bannerSlide, {
        toValue: 0,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // E. Cutscene Scale & Opacity
    cutsceneScale.setValue(0.8);
    cutsceneOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(cutsceneOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(cutsceneScale, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // F. Confetti Rain Fall
    particles.forEach((p) => {
      p.anim.setValue(0);
      p.rotAnim.setValue(0);
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.timing(p.anim, {
            toValue: 1,
            duration: 2200 + Math.random() * 800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(p.rotAnim, {
            toValue: 1,
            duration: 2200,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  };

  useEffect(() => {
    runCelebrationAnimations();
    playTreasureUnlockSound();
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    // Auto-dismiss fullscreen cutscene after 4 seconds to show location actions
    const timer = setTimeout(() => {
      setShowCinematicCutscene(false);
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  const handleTriggerCinematicVideo = () => {
    playTreasureUnlockSound();
    setShowCinematicCutscene(true);
    runCelebrationAnimations();
  };

  const sunburstInterpolate = sunburstAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Determine hint image (cipher hint image -> hints gallery -> hunt cover)
  const hintImage =
    hunt?.cipherHintImage ||
    hunt?.hints?.[0]?.image ||
    hunt?.galleryImages?.[0] ||
    hunt?.coverImage;

  const hintInstructions =
    language === "ar"
      ? hunt?.hintInstructionsAr || hunt?.hints?.[0]?.captionAr
      : hunt?.hintInstructions || hunt?.hints?.[0]?.caption;

  const handleLocationPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onViewNewLocation();
  };

  const handleSubmitPhotoPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onFoundTreasureAlready();
  };

  const handleHintPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setShowHintModal(true);
  };

  return (
    <View style={styles.screen}>
      {/* Subtle celebratory ambient glow background */}
      <LinearGradient
        colors={[
          "rgba(240, 248, 235, 0.9)",
          "rgba(253, 252, 250, 0.95)",
          colors.parchmentLight,
        ]}
        locations={[0, 0.45, 1]}
        style={styles.backgroundGlow}
      />

      {/* Top Header with Back Button */}
      <Header showBack onBack={onBack} onPressProfile={onPressProfile} />

      {/* Floating Confetti Layer */}
      <View style={styles.confettiLayer} pointerEvents="none">
        {particles.map((p) => {
          const translateY = p.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [p.startY, p.targetY],
          });
          const opacity = p.anim.interpolate({
            inputRange: [0, 0.1, 0.85, 1],
            outputRange: [0, 1, 1, 0],
          });
          const rotate = p.rotAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "720deg"],
          });

          return (
            <Animated.View
              key={`particle-${p.id}`}
              style={[
                styles.particle,
                {
                  left: p.startX,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: p.size > 8 ? 2 : p.size / 2,
                  opacity,
                  transform: [{ translateY }, { rotate }],
                },
              ]}
            />
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Animated Metallic Emerald & Gold Banner */}
        <Animated.View
          style={[
            styles.bannerContainer,
            {
              opacity: bannerOpacity,
              transform: [{ translateY: bannerSlide }],
            },
          ]}
        >
          <LinearGradient
            colors={["#0D2823", "#144E43", "#091F1A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.greenBanner}
          >
            <View style={styles.bannerSparkleGlow}>
              <Ionicons name="sparkles" size={18} color="#FFDF00" />
            </View>
            <Text style={styles.bannerText}>
              {t("congratulationSolveTreasure")}
            </Text>
            <View style={styles.bannerSparkleGlow}>
              <Ionicons name="sparkles" size={18} color="#FFDF00" />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* 2. Interactive Animated Open Glowing Treasure Chest */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleTriggerCinematicVideo}
          style={styles.chestContainer}
        >
          {/* Rotating Celestial Sunburst Rays behind Chest */}
          <Animated.View
            // @ts-ignore
            className={Platform.OS === "web" ? "treasure-sunburst-spin" : undefined}
            style={[
              styles.sunburstWrapper,
              { transform: [{ rotate: sunburstInterpolate }] },
            ]}
          >
            <View style={styles.sunburstBeam1} />
            <View style={styles.sunburstBeam2} />
            <View style={styles.sunburstBeam3} />
            <View style={styles.sunburstBeam4} />
          </Animated.View>

          {/* Pulsing Light Glow Aura */}
          <Animated.View
            // @ts-ignore
            className={Platform.OS === "web" ? "treasure-pulse-glow" : undefined}
            style={[
              styles.chestGlowAura,
              {
                opacity: glowPulse,
                transform: [{ scale: glowPulse }],
              },
            ]}
          />

          {/* Spring-animated Treasure Chest Graphic */}
          <Animated.View
            // @ts-ignore
            className={Platform.OS === "web" ? "treasure-chest-float" : undefined}
            style={[
              styles.chestImageWrapper,
              {
                opacity: chestOpacity,
                transform: [{ scale: chestScale }],
              },
            ]}
          >
            <Image
              source={treasureChestOpenImg}
              style={styles.chestImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Video Effect Action Pill */}
          <View style={styles.replayPill}>
            <Ionicons name="play-circle" size={14} color="#D4AF37" />
            <Text style={styles.replayPillText}>
              {language === "ar" ? "تشغيل الفيديو السينمائي" : "Play Cinematic Video"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Short motivational subtext */}
        <Text style={[styles.subInstructionText, isRTL && styles.textRight]}>
          {t("cipherSolvedDesc")}
        </Text>

        {/* 3. Three Action Buttons (Matches wireframe) */}
        <View style={[styles.buttonsRow, isRTL && styles.rowReverse]}>
          {/* Button 1: Location map (Map 2 after treasure) */}
          <TouchableOpacity
            onPress={handleLocationPress}
            activeOpacity={0.85}
            style={[styles.actionBtn, styles.locationBtn]}
          >
            <Feather name="map-pin" size={18} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.btnText}>
              {t("locationMapBtn")}
            </Text>
          </TouchableOpacity>

          {/* Button 2: Submit photo for treasure (Dark central button) */}
          <TouchableOpacity
            onPress={handleSubmitPhotoPress}
            activeOpacity={0.85}
            style={[styles.actionBtn, styles.submitPhotoBtn]}
          >
            <Feather name="camera" size={18} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.btnText}>
              {t("submitPhotoForTreasure")}
            </Text>
          </TouchableOpacity>

          {/* Button 3: Hint picture (Hints 2) */}
          <TouchableOpacity
            onPress={handleHintPress}
            activeOpacity={0.85}
            style={[styles.actionBtn, styles.hintBtn]}
          >
            <Feather name="image" size={18} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.btnText}>
              {t("hintPictureBtn")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ======================================================== */}
      {/* 4. FULLSCREEN CINEMATIC VIDEO CUTSCENE REVEAL OVERLAY     */}
      {/* ======================================================== */}
      <Modal
        visible={showCinematicCutscene}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCinematicCutscene(false)}
      >
        <View style={styles.cutsceneFullscreenOverlay}>
          <LinearGradient
            colors={["rgba(5, 18, 15, 0.98)", "rgba(10, 32, 27, 0.98)", "#071714"]}
            style={StyleSheet.absoluteFill}
          />

          {/* Large Spinning Golden Vortex Rays */}
          <Animated.View
            // @ts-ignore
            className={Platform.OS === "web" ? "treasure-sunburst-spin" : undefined}
            style={[
              styles.cutsceneSunburstWrapper,
              { transform: [{ rotate: sunburstInterpolate }] },
            ]}
          >
            <View style={styles.cutsceneBeam1} />
            <View style={styles.cutsceneBeam2} />
            <View style={styles.cutsceneBeam3} />
            <View style={styles.cutsceneBeam4} />
          </Animated.View>

          {/* Floating Golden Confetti Particles inside Cutscene */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {particles.slice(0, 16).map((p) => {
              const translateY = p.anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-40, height * 0.9],
              });
              const opacity = p.anim.interpolate({
                inputRange: [0, 0.1, 0.85, 1],
                outputRange: [0, 1, 0.9, 0],
              });
              const rotate = p.rotAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "720deg"],
              });

              return (
                <Animated.View
                  key={`cutscene-particle-${p.id}`}
                  style={[
                    styles.particle,
                    {
                      left: p.startX,
                      width: p.size + 2,
                      height: p.size + 2,
                      backgroundColor: p.color,
                      borderRadius: (p.size + 2) / 2,
                      opacity,
                      transform: [{ translateY }, { rotate }],
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Cutscene Content Container */}
          <Animated.View
            style={[
              styles.cutsceneContent,
              {
                opacity: cutsceneOpacity,
                transform: [{ scale: cutsceneScale }],
              },
            ]}
          >
            {/* Top Seal Badge */}
            <View style={styles.cutsceneSealBadge}>
              <MaterialCommunityIcons name="shield-crown" size={20} color="#F5D77F" />
              <Text style={styles.cutsceneSealText}>
                {language === "ar" ? "تم فك رموز الشفرة بنجاح" : "EXPEDITION CIPHER SOLVED"}
              </Text>
            </View>

            {/* Glowing Hero Treasure Chest Graphic */}
            <View style={styles.cutsceneHeroChestWrapper}>
              <View style={styles.cutsceneAuraGlow} />
              <Image
                source={treasureFoundHeroImg}
                style={styles.cutsceneHeroImage}
                resizeMode="contain"
              />
            </View>

            {/* Cinematic Title & Instructions */}
            <Text style={styles.cutsceneTitle}>
              {language === "ar" ? "انفتحت خزانة الكنز!" : "ROYAL TREASURY\nUNLOCKED!"}
            </Text>
            <Text style={styles.cutsceneSub}>
              {language === "ar"
                ? "تم فتح الموقع السري للمرحلة الثانية بنجاح! توجه الآن إلى الخريطة لاكتشاف مكان الكنز الحقيقي."
                : "The ancient brass cipher has revealed its final coordinates! The physical treasure cache is waiting."}
            </Text>

            {/* Dismiss / Continue to Action Button */}
            <TouchableOpacity
              onPress={() => setShowCinematicCutscene(false)}
              activeOpacity={0.88}
              style={styles.cutsceneContinueBtn}
            >
              <LinearGradient
                colors={["#F6D268", "#C99A24", "#8F6710"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cutsceneContinueGradient}
              >
                <Text style={styles.cutsceneContinueText}>
                  {language === "ar" ? "متابعة إلى خريطة الكنز" : "CONTINUE TO LOCATION MAP"}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#251803" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowCinematicCutscene(false)}
              style={styles.cutsceneSkipBtn}
            >
              <Text style={styles.cutsceneSkipText}>
                {language === "ar" ? "تخطي العرض" : "Skip Animation"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* 5. Hint Picture Modal / Lightbox */}
      <Modal
        visible={showHintModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHintModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowHintModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, isRTL && styles.rowReverse]}>
              <View style={[styles.modalHeaderTitleRow, isRTL && styles.rowReverse]}>
                <Feather name="eye" size={18} color="#087E8B" />
                <Text style={styles.modalTitle}>
                  {t("hintPictureModalTitle")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowHintModal(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.closeBtn}
              >
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Hint Photo Display */}
            <View style={styles.modalImageCard}>
              {hintImage ? (
                <Image
                  source={{ uri: hintImage }}
                  style={styles.modalHintImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.modalEmptyImage}>
                  <Feather name="image" size={36} color="#94A3B8" />
                  <Text style={styles.modalEmptyText}>
                    No hint image available
                  </Text>
                </View>
              )}
            </View>

            {/* Hint Instructions */}
            {Boolean(hintInstructions) && (
              <Text style={[styles.modalHintText, isRTL && styles.textRight]}>
                {hintInstructions}
              </Text>
            )}

            {/* Close Modal Button */}
            <TouchableOpacity
              onPress={() => setShowHintModal(false)}
              activeOpacity={0.85}
              style={styles.modalCloseBtn}
            >
              <Text style={styles.modalCloseBtnText}>
                {t("closeModal")}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.parchmentLight,
    position: "relative",
    overflow: "hidden",
  },
  backgroundGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
  particle: {
    position: "absolute",
    top: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    alignItems: "center",
  },
  bannerContainer: {
    width: "100%",
    maxWidth: 380,
    marginBottom: 16,
    marginTop: 4,
  },
  greenBanner: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#E1BF62",
    shadowColor: "#E1BF62",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  bannerSparkleGlow: {
    shadowColor: "#FFDF00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  bannerText: {
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: "900",
    fontFamily: fonts.frauncesBold,
    textAlign: "center",
    letterSpacing: 0.3,
    flexShrink: 1,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Central Interactive Chest
  chestContainer: {
    width: "100%",
    maxWidth: 360,
    height: 270,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginVertical: 10,
  },
  sunburstWrapper: {
    position: "absolute",
    width: 320,
    height: 320,
    alignItems: "center",
    justifyContent: "center",
  },
  sunburstBeam1: {
    position: "absolute",
    width: 300,
    height: 60,
    backgroundColor: "rgba(255, 215, 0, 0.12)",
    borderRadius: 30,
    transform: [{ rotate: "0deg" }],
  },
  sunburstBeam2: {
    position: "absolute",
    width: 300,
    height: 60,
    backgroundColor: "rgba(255, 215, 0, 0.12)",
    borderRadius: 30,
    transform: [{ rotate: "45deg" }],
  },
  sunburstBeam3: {
    position: "absolute",
    width: 300,
    height: 60,
    backgroundColor: "rgba(255, 215, 0, 0.12)",
    borderRadius: 30,
    transform: [{ rotate: "90deg" }],
  },
  sunburstBeam4: {
    position: "absolute",
    width: 300,
    height: 60,
    backgroundColor: "rgba(255, 215, 0, 0.12)",
    borderRadius: 30,
    transform: [{ rotate: "135deg" }],
  },
  chestGlowAura: {
    position: "absolute",
    width: 220,
    height: 200,
    borderRadius: 110,
    backgroundColor: "rgba(255, 215, 0, 0.25)",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 8,
  },
  chestImageWrapper: {
    width: "100%",
    height: 230,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    overflow: "hidden",
  },
  chestImage: {
    width: "100%",
    height: "100%",
    // @ts-ignore
    mixBlendMode: Platform.OS === "web" ? "multiply" : undefined,
  },
  replayPill: {
    position: "absolute",
    bottom: -6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(13, 40, 35, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E1BF62",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  replayPillText: {
    fontSize: 11,
    fontFamily: fonts.frauncesBold,
    fontWeight: "700",
    color: "#F6D268",
    letterSpacing: 0.5,
  },
  subInstructionText: {
    fontSize: 13,
    color: "#5C6B64",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 320,
    marginTop: 14,
    marginBottom: 24,
  },
  buttonsRow: {
    width: "100%",
    maxWidth: 380,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 8,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  textRight: {
    textAlign: "right",
  },
  actionBtn: {
    flex: 1,
    minHeight: 88,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  btnIcon: {
    marginBottom: 8,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 15,
  },
  locationBtn: {
    backgroundColor: "#166534",
    shadowColor: "#166534",
  },
  submitPhotoBtn: {
    backgroundColor: "#1F2937",
    shadowColor: "#000000",
  },
  hintBtn: {
    backgroundColor: "#15803D",
    shadowColor: "#15803D",
  },

  // ==========================================
  // FULLSCREEN CINEMATIC CUTSCENE STYLES
  // ==========================================
  cutsceneFullscreenOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  cutsceneSunburstWrapper: {
    position: "absolute",
    width: 600,
    height: 600,
    alignItems: "center",
    justifyContent: "center",
  },
  cutsceneBeam1: {
    position: "absolute",
    width: 580,
    height: 90,
    backgroundColor: "rgba(225, 191, 98, 0.1)",
    borderRadius: 45,
    transform: [{ rotate: "0deg" }],
  },
  cutsceneBeam2: {
    position: "absolute",
    width: 580,
    height: 90,
    backgroundColor: "rgba(225, 191, 98, 0.1)",
    borderRadius: 45,
    transform: [{ rotate: "45deg" }],
  },
  cutsceneBeam3: {
    position: "absolute",
    width: 580,
    height: 90,
    backgroundColor: "rgba(225, 191, 98, 0.1)",
    borderRadius: 45,
    transform: [{ rotate: "90deg" }],
  },
  cutsceneBeam4: {
    position: "absolute",
    width: 580,
    height: 90,
    backgroundColor: "rgba(225, 191, 98, 0.1)",
    borderRadius: 45,
    transform: [{ rotate: "135deg" }],
  },
  cutsceneContent: {
    width: "90%",
    maxWidth: 380,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  cutsceneSealBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(13, 40, 35, 0.85)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#E1BF62",
    marginBottom: 16,
    shadowColor: "#E1BF62",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  cutsceneSealText: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#F5D77F",
  },
  cutsceneHeroChestWrapper: {
    width: 260,
    height: 260,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginVertical: 10,
  },
  cutsceneAuraGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255, 215, 0, 0.28)",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 50,
  },
  cutsceneHeroImage: {
    width: "100%",
    height: "100%",
  },
  cutsceneTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    fontFamily: fonts.frauncesBold,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
    marginVertical: 12,
    textShadowColor: "rgba(225, 191, 98, 0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  cutsceneSub: {
    fontSize: 13,
    lineHeight: 19,
    color: "#E2E8F0",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  cutsceneContinueBtn: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#C99A24",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#FFF2BE",
  },
  cutsceneContinueGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  cutsceneContinueText: {
    color: "#251803",
    fontSize: 13.5,
    fontWeight: "900",
    fontFamily: fonts.frauncesBold,
    letterSpacing: 0.8,
  },
  cutsceneSkipBtn: {
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  cutsceneSkipText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },

  // Modal Lightbox styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(13, 40, 35, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surfaceWhite,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
    color: colors.primaryGreen,
  },
  closeBtn: {
    padding: 4,
  },
  modalImageCard: {
    width: "100%",
    height: 240,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    marginBottom: 16,
  },
  modalHintImage: {
    width: "100%",
    height: "100%",
  },
  modalEmptyImage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modalEmptyText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  modalHintText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  modalCloseBtn: {
    backgroundColor: colors.buttonGreen,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseBtnText: {
    color: colors.surfaceWhite,
    fontSize: 13,
    fontWeight: "700",
  },
});
