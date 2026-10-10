import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

interface TreasureBoxLogoProps {
  size?: number;
}

export const TreasureBoxLogo: React.FC<TreasureBoxLogoProps> = ({
  size = 36,
}) => {
  const diamondSize = size * 0.44;
  const diamondBorder = Math.max(1.8, size * 0.065);
  const dotSize = size * 0.16;

  return (
    <View
      style={[
        styles.outerCoin,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {/* Inner Rotated Diamond */}
      <View
        style={[
          styles.diamond,
          {
            width: diamondSize,
            height: diamondSize,
            borderWidth: diamondBorder,
            borderRadius: Math.max(2, size * 0.04),
          },
        ]}
      />

      {/* Center Circular Dot */}
      <View
        style={[
          styles.centerDot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outerCoin: {
    backgroundColor: colors.brassGold,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: colors.primaryGreen,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  diamond: {
    borderColor: colors.primaryGreen,
    backgroundColor: "transparent",
    transform: [{ rotate: "45deg" }],
    position: "absolute",
  },
  centerDot: {
    backgroundColor: colors.primaryGreen,
    position: "absolute",
  },
});
