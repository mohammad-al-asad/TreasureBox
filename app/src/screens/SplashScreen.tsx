import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

interface SplashScreenProps {
  onFinish: () => void;
}

const { width } = Dimensions.get("window");
const LOGO_SIZE = Math.min(width * 0.76, 300);

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    const isNative = Platform.OS !== "web";

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: false,
      }),
    ]).start();

    // Auto navigate after 2.6 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onFinish}
      style={styles.container}
    >
      <StatusBar style="light" />

      {/* Frame 19 Authentic Background: Emerald center radial glow to deep dark forest green */}
      <LinearGradient
        colors={["#09211A", "#0F382E", "#1B5D4E", "#0F382E", "#09211A"]}
        locations={[0, 0.28, 0.5, 0.72, 1]}
        style={[
          StyleSheet.absoluteFill,
          Platform.OS === "web"
            ? ({
                backgroundImage:
                  "radial-gradient(circle at center, #1C6352 0%, #103B30 45%, #08211A 85%)",
              } as any)
            : undefined,
        ]}
      />

      {/* Transparent PNG Explorer Emblem matching Frame 19 exactly without square borders or square shadows */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require("../../assets/explorer-logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09211A",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: "center",
    justifyContent: "center",
    // No rectangular box-shadow or borders
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
});
