import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Keyboard,
  Platform,
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
  // Width / height of the chosen photo so the preview shows it uncropped (portrait by default)
  const [photoAspect, setPhotoAspect] = useState(3 / 4);
  const [hunterName, setHunterName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Keep the name field visible above the keyboard while typing
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handlePickerResult = (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      if (asset.width && asset.height) {
        setPhotoAspect(asset.width / asset.height);
      }
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          isRTL ? "الكاميرا غير مسموح بها" : "Camera Access Needed",
          isRTL
            ? "يرجى السماح بالوصول إلى الكاميرا من إعدادات الجهاز لتصوير الكنز."
            : "Please allow camera access in your device settings to photograph the treasure."
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });
      handlePickerResult(result);
    } catch (err) {
      console.warn("Failed to take photo:", err);
    }
  };

  const handleChooseFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });
      handlePickerResult(result);
    } catch (err) {
      console.warn("Failed to pick image:", err);
    }
  };

  const handlePickImage = () => {
    Alert.alert(
      isRTL ? "صورة الكنز" : "Treasure Photo",
      undefined,
      [
        { text: isRTL ? "التقاط صورة" : "Take Photo", onPress: handleTakePhoto },
        {
          text: isRTL ? "اختيار من المعرض" : "Choose from Library",
          onPress: handleChooseFromLibrary,
        },
        { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const handleConfirmPress = () => {
    // The API rejects claims without a proof photo, so require one before confirming
    if (!photoUri) {
      Alert.alert(
        isRTL ? "صورة الكنز مطلوبة" : "Treasure Photo Required",
        isRTL
          ? "يرجى التقاط صورة للكنز أو اختيارها من المعرض قبل التأكيد."
          : "Please take or choose a photo of the treasure before confirming."
      );
      return;
    }
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
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: 24 + keyboardHeight }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
          style={[
            styles.viewfinderContainer,
            photoUri && { height: undefined, aspectRatio: photoAspect },
          ]}
        >
          {photoUri ? (
            <View style={styles.photoWrapper}>
              <Image
                source={{ uri: photoUri }}
                style={styles.capturedPhoto}
                resizeMode="contain"
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
            onFocus={() =>
              setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)
            }
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
    flexGrow: 1,
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
    backgroundColor: "#000",
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
