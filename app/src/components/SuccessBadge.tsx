import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

interface SuccessBadgeProps {
  type?: "cipher" | "treasure" | "compass";
  size?: number;
}

export const SuccessBadge: React.FC<SuccessBadgeProps> = ({
  type = "cipher",
  size = 72,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const isNative = Platform.OS !== "web";
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: isNative,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: isNative,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.outerGlowContainer, { width: size * 1.6, height: size * 1.6 }]}>
      <Animated.View
        style={[
          styles.glowCircle,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: (size * 1.4) / 2,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <View
        style={[
          styles.innerCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        {type === "compass" ? (
          <Ionicons name="compass-outline" size={size * 0.5} color={colors.brassDark} />
        ) : (
          <Ionicons
            name="checkmark"
            size={size * 0.52}
            color={type === "treasure" ? colors.buttonGreen : colors.brassDark}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerGlowContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glowCircle: {
    position: "absolute",
    backgroundColor: "rgba(225, 191, 98, 0.22)",
  },
  innerCircle: {
    backgroundColor: colors.surfaceWhite,
    borderWidth: 1.5,
    borderColor: colors.brassBorder,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brassDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});
