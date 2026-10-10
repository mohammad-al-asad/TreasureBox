import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { useLanguage } from "../i18n/LanguageContext";

interface LockConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LockConfirmModal: React.FC<LockConfirmModalProps> = ({
  visible,
  onConfirm,
  onCancel,
}) => {
  const { t, isRTL } = useLanguage();

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      <View style={[styles.modalCard, isRTL && styles.alignRight]}>
        <Text style={[styles.title, isRTL && styles.textRight]}>
          {t("lockWarningTitle")}
        </Text>
        <Text style={[styles.description, isRTL && styles.textRight]}>
          {t("lockWarningDesc")}
        </Text>

        <View style={styles.actions}>
          {/* YES, CONFIRM FIND */}
          <TouchableOpacity
            onPress={onConfirm}
            activeOpacity={0.88}
            style={styles.confirmButton}
          >
            <Text style={styles.confirmButtonText}>
              {t("yesConfirmFind")}
            </Text>
          </TouchableOpacity>

          {/* KEEP SEARCHING */}
          <TouchableOpacity
            onPress={onCancel}
            activeOpacity={0.85}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>
              {t("keepSearching")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
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
    fontSize: 13,
    lineHeight: 19,
    color: "#5C6B64",
    marginBottom: 24,
  },
  actions: {
    gap: 10,
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
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  cancelButton: {
    backgroundColor: "#FAF6EC",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E6D9BC",
  },
  cancelButtonText: {
    color: "#9A7B38",
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
});
