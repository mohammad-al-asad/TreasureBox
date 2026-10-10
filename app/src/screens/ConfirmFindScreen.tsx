import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Header } from "../components/Header";
import { LockConfirmModal } from "../components/LockConfirmModal";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { useLanguage } from "../i18n/LanguageContext";

interface ConfirmFindScreenProps {
  onBack: () => void;
  onClaimConfirmed: (hunterName: string, photoUri?: string) => void;
  onPressProfile?: () => void;
}

export const ConfirmFindScreen: React.FC<ConfirmFindScreenProps> = ({
  onBack,
  onClaimConfirmed,
  onPressProfile,
}) => {
  const { t, isRTL } = useLanguage();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [hunterName, setHunterName] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn("Failed to pick image:", err);
    }
  };

  const handleConfirmPress = () => {
    if (!hunterName.trim()) {
      Alert.alert(
        isRTL ? "يرجى كتابة اسمك" : "Hunter Name Required",
        isRTL
          ? "يرجى إدخال اسمك لتسجيل السجل الميداني."
          : "Please enter your name to register the field record."
      );
      return;
    }
    setShowModal(true);
  };

  const handleFinalClaim = () => {
    setShowModal(false);
    onClaimConfirmed(hunterName.trim(), photoUri || undefined);
  };

  return (
    <View style={styles.screen}>
      <Header showBack onBack={onBack} onPressProfile={onPressProfile} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={[styles.headerSection, isRTL && styles.alignRight]}>
          <Text style={[styles.label, isRTL && styles.textRight]}>
            {t("finalRecord")}
          </Text>
          <Text style={[styles.title, isRTL && styles.textRight]}>
            {t("confirmTheFind")}
          </Text>
          <Text style={[styles.description, isRTL && styles.textRight]}>
            {t("confirmFindDesc")}
          </Text>
        </View>

        {/* Photo Box / Viewfinder */}
        <TouchableOpacity
          onPress={handlePickImage}
          activeOpacity={0.88}
          style={styles.viewfinderContainer}
        >
          {photoUri ? (
            <View style={styles.photoWrapper}>
              <Image
                source={{ uri: photoUri }}
                style={styles.capturedPhoto}
                resizeMode="cover"
              />
              <View style={styles.changeBadge}>
                <Feather name="camera" size={14} color={colors.surfaceWhite} />
              </View>
            </View>
          ) : (
            <View style={styles.emptyViewfinder}>
              {/* Corner framing brackets */}
              <View style={[styles.bracket, styles.bracketTopLeft]} />
              <View style={[styles.bracket, styles.bracketTopRight]} />
              <View style={[styles.bracket, styles.bracketBottomLeft]} />
              <View style={[styles.bracket, styles.bracketBottomRight]} />

              <Feather name="camera" size={28} color={colors.brassDark} />
              <Text style={styles.captureText}>{t("tapToCapture")}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Hunter Name Input */}
        <View style={[styles.inputSection, isRTL && styles.alignRight]}>
          <Text style={[styles.inputLabel, isRTL && styles.textRight]}>
            {t("yourName")}
          </Text>
          <TextInput
            value={hunterName}
            onChangeText={setHunterName}
            placeholder={t("creditPlaceholder")}
            placeholderTextColor={colors.textMuted}
            style={[styles.inputField, isRTL && styles.textRight]}
          />
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleConfirmPress}
          activeOpacity={0.88}
          style={[styles.confirmButton, isRTL && styles.rowReverse]}
        >
          <Text style={styles.confirmButtonText}>
            {t("confirmTreasureFound")}
          </Text>
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.surfaceWhite} />
        </TouchableOpacity>
      </ScrollView>

      {/* Lock Confirm Modal */}
      <LockConfirmModal
        visible={showModal}
        onConfirm={handleFinalClaim}
        onCancel={() => setShowModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.parchmentLight,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  headerSection: {
    marginBottom: 20,
  },
  alignRight: {
    alignItems: "flex-end",
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  textRight: {
    textAlign: "right",
  },
  label: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.brassDark,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
    color: colors.primaryGreen,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  viewfinderContainer: {
    width: "100%",
    height: 220,
    marginBottom: 24,
  },
  emptyViewfinder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.surfaceWhite,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    gap: 8,
  },
  bracket: {
    position: "absolute",
    width: 18,
    height: 18,
    borderColor: colors.brassGold,
  },
  bracketTopLeft: {
    top: 12,
    left: 12,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  bracketTopRight: {
    top: 12,
    right: 12,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bracketBottomLeft: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bracketBottomRight: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  captureText: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 1.5,
    color: colors.brassDark,
  },
  photoWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  capturedPhoto: {
    width: "100%",
    height: "100%",
  },
  changeBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
    borderRadius: 20,
  },
  inputSection: {
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.primaryGreen,
  },
  confirmButton: {
    backgroundColor: colors.buttonGreen,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#0D2823",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: colors.surfaceWhite,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
