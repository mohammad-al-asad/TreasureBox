import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { useLanguage } from "../i18n/LanguageContext";

interface AlertModalProps {
  visible: boolean;
  message: string;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  message,
  onClose,
}) => {
  const { t, isRTL, language } = useLanguage();

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.modalCard, isRTL && styles.alignRight]}>
        <Text style={[styles.title, isRTL && styles.textRight]}>
          {language === "ar" ? "تنبيه" : "Alert"}
        </Text>
        <Text style={[styles.description, isRTL && styles.textRight]}>
          {message}
        </Text>

        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.88}
          style={styles.confirmButton}
        >
          <Text style={styles.confirmButtonText}>
            {language === "ar" ? "حسناً" : "OK"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 330,
    backgroundColor: colors.surfaceWhite,
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  alignRight: {
    alignItems: "stretch",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
    color: "#0F382E",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  textRight: {
    textAlign: "right",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: "#5C6B64",
    marginBottom: 24,
  },
  confirmButton: {
    backgroundColor: "#103B30",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#103B30",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButtonText: {
    color: colors.surfaceWhite,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
});
