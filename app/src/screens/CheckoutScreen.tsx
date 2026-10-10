import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { Header } from "../components/Header";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { useLanguage } from "../i18n/LanguageContext";
import { Hunt } from "../types/hunt";
import { hunterApi } from "../services/api";

interface CheckoutScreenProps {
  hunt: Hunt;
  hunterName?: string;
  hunterEmail?: string;
  onBack: () => void;
  onSuccess: () => void;
  onError?: (msg: string) => void;
  onPressProfile?: () => void;
}

type SelectedPaymentMethod = "APPLE_PAY" | "PAYPAL";

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  hunt,
  hunterName,
  hunterEmail,
  onBack,
  onSuccess,
  onError,
  onPressProfile,
}) => {
  const { t, isRTL, language } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<SelectedPaymentMethod>("APPLE_PAY");

  const localizedTitle = language === "ar" ? hunt.titleAr || hunt.title : hunt.title;

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      await hunterApi.purchaseHuntPermit({
        huntId: hunt.id,
        hunterName: hunterName || "Explorer",
        hunterEmail: hunterEmail || "hunter@treasurebox.app",
        paymentMethod: selectedMethod,
      });
      setIsProcessing(false);
      onSuccess();
    } catch (err: any) {
      setIsProcessing(false);
      const errMsg = err?.message || "Payment could not be completed. Please try again.";
      if (onError) {
        onError(errMsg);
      } else {
        alert(errMsg);
      }
    }
  };

  return (
    <View style={styles.screen}>
      <Header showBack onBack={onBack} onPressProfile={onPressProfile} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Titles */}
        <View style={[styles.headerSection, isRTL && styles.alignRight]}>
          <Text style={[styles.label, isRTL && styles.textRight]}>
            {t("secureCheckout")}
          </Text>
          <Text style={[styles.title, isRTL && styles.textRight]}>
            {t("claimYourMap")}
          </Text>
        </View>

        {/* Item Summary Card */}
        <View style={[styles.itemCard, isRTL && styles.rowReverse]}>
          <Image
            source={{ uri: hunt.coverImage }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <View style={[styles.itemDetails, isRTL && styles.alignRight]}>
            <Text style={[styles.itemName, isRTL && styles.textRight]}>
              {localizedTitle}
            </Text>
            <Text style={[styles.itemAccess, isRTL && styles.textRight]}>
              {t("oneTimeAccess")}
            </Text>
            <Text style={[styles.itemPrice, isRTL && styles.textRight]}>
              {hunt.isFree ? t("free") : hunt.price}
            </Text>
          </View>
        </View>

        <Text style={[styles.paymentMethodTitle, isRTL && styles.textRight]}>
          {language === "ar" ? "اختر طريقة الدفع" : "SELECT PAYMENT METHOD"}
        </Text>

        {/* Option 1: Apple Pay Card */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setSelectedMethod("APPLE_PAY")}
          style={[
            styles.paymentCard,
            selectedMethod === "APPLE_PAY" && styles.paymentCardSelected,
          ]}
        >
          <View style={[styles.payHeaderRow, isRTL && styles.rowReverse]}>
            <View style={styles.methodInfoRow}>
              <View
                style={[
                  styles.radioCircle,
                  selectedMethod === "APPLE_PAY" && styles.radioCircleSelected,
                ]}
              >
                {selectedMethod === "APPLE_PAY" && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.payTitle}>Apple Pay</Text>
            </View>
            <View style={styles.appleLogoBox}>
              <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
            </View>
          </View>

          <Text style={[styles.payDesc, isRTL && styles.textRight]}>
            {language === "ar"
              ? "دفع فوري وآمن بلمسة واحدة أو Face ID عبر بطاقتك المسجلة في محفظة Apple."
              : "Fast, contactless one-touch checkout with Touch ID or Face ID via Apple Wallet."}
          </Text>
        </TouchableOpacity>

        {/* Option 2: PayPal Card */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setSelectedMethod("PAYPAL")}
          style={[
            styles.paymentCard,
            selectedMethod === "PAYPAL" && styles.paymentCardSelected,
          ]}
        >
          <View style={[styles.payHeaderRow, isRTL && styles.rowReverse]}>
            <View style={styles.methodInfoRow}>
              <View
                style={[
                  styles.radioCircle,
                  selectedMethod === "PAYPAL" && styles.radioCircleSelected,
                ]}
              >
                {selectedMethod === "PAYPAL" && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.payTitle}>PayPal / Card</Text>
            </View>
            <View style={styles.paypalLogoBox}>
              <FontAwesome5 name="paypal" size={20} color="#003087" />
            </View>
          </View>

          <Text style={[styles.payDesc, isRTL && styles.textRight]}>
            {t("payWithPayPalDesc")}
          </Text>
        </TouchableOpacity>

        {/* Important Outdoor Rules & Attempt Notice Card */}
        <View style={[styles.rulesNoticeCard, isRTL && styles.rowReverse]}>
          <View style={styles.noticeIconCircle}>
            <Ionicons name="compass-outline" size={20} color="#8A6D3B" />
          </View>
          <View style={[styles.noticeTextContainer, isRTL && styles.alignRight]}>
            <Text style={[styles.noticeTitle, isRTL && styles.textRight]}>
              {t("outdoorHuntNoticeTitle")}
            </Text>
            <Text style={[styles.noticeDesc, isRTL && styles.textRight]}>
              {t("outdoorHuntNoticeDesc")}
            </Text>
          </View>
        </View>

        {/* Dynamic Action Button */}
        <TouchableOpacity
          onPress={handlePay}
          disabled={isProcessing}
          activeOpacity={0.88}
          style={[
            styles.payButton,
            selectedMethod === "APPLE_PAY" && styles.applePayButton,
            isRTL && styles.rowReverse,
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.surfaceWhite} />
          ) : (
            <>
              {selectedMethod === "APPLE_PAY" ? (
                <>
                  <Ionicons name="logo-apple" size={19} color="#FFFFFF" />
                  <Text style={styles.payButtonText}>
                    {language === "ar" ? "الدفع عبر Apple Pay" : "Pay with Apple Pay"}
                  </Text>
                </>
              ) : (
                <>
                  <FontAwesome5 name="paypal" size={17} color="#FFFFFF" />
                  <Text style={styles.payButtonText}>
                    {t("continueWithPayPal")}
                  </Text>
                  <Ionicons
                    name={isRTL ? "chevron-back" : "chevron-forward"}
                    size={16}
                    color={colors.surfaceWhite}
                  />
                </>
              )}
            </>
          )}
        </TouchableOpacity>

        {/* Security Subtext */}
        <Text style={styles.secureSubtext}>
          {t("securePaymentNote")}
        </Text>
      </ScrollView>
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
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 24,
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
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    fontFamily: fonts.frauncesBold,
    color: colors.primaryGreen,
    letterSpacing: -0.5,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceWhite,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: 20,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
    color: colors.primaryGreen,
    marginBottom: 2,
  },
  itemAccess: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.buttonGreen,
  },
  paymentMethodTitle: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#6B7280",
    marginBottom: 10,
  },
  paymentCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  paymentCardSelected: {
    borderColor: "#0D2823",
    backgroundColor: "#FAFDFB",
  },
  payHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  methodInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: "#0D2823",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0D2823",
  },
  payTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primaryGreen,
  },
  appleLogoBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#000000",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  paypalLogoBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#F0F4F8",
    borderRadius: 6,
  },
  payDesc: {
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.textSecondary,
    paddingLeft: 30,
  },
  payButton: {
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
    marginTop: 10,
    marginBottom: 16,
  },
  applePayButton: {
    backgroundColor: "#000000",
    shadowColor: "#000000",
  },
  payButtonText: {
    color: colors.surfaceWhite,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  secureSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
  },
  rulesNoticeCard: {
    backgroundColor: "#FFF9E6",
    borderWidth: 1,
    borderColor: "#E6C875",
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
    marginBottom: 10,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  noticeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FCEEBA",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  noticeTextContainer: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#684E1A",
    fontFamily: "monospace",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  noticeDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: "#5C461E",
  },
});
