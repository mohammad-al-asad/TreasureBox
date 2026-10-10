import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { useLanguage } from "../i18n/LanguageContext";
import { UserProfile } from "../types/hunt";
import { hunterApi } from "../services/api";

type AuthSubScreen =
  | "sign-in"
  | "sign-up"
  | "forgot-password"
  | "verify-otp"
  | "reset-password";

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
  onSkipToGuest?: () => void;
}

const { width } = Dimensions.get("window");

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onSkipToGuest }) => {
  const { t, isRTL, language, toggleLanguage } = useLanguage();

  // Screen sub-state
  const [subScreen, setSubScreen] = useState<AuthSubScreen>("sign-in");
  const [authIntent, setAuthIntent] = useState<"sign-up" | "forgot-password">("sign-up");

  // Form states
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // OTP 6-digits state
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputsRef = useRef<Array<TextInput | null>>([]);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Eye icon / password visibility
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Reset Token
  const [resetToken, setResetToken] = useState<string>("");

  // Input focus tracking for border highlights
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown > 0) {
      const interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendCooldown]);

  // Helper validation
  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // Trigger error modal with message
  const triggerError = (msg?: string) => {
    setErrorMessage(
      msg || t("errorModalSubtitle") || "Please check your details and try submitting the form once more."
    );
    setShowErrorModal(true);
  };

  // Handle Sign In submission
  const handleSignIn = async () => {
    if (!email.trim() || !validateEmail(email)) {
      triggerError("Please enter a valid email address.");
      return;
    }
    if (!password.trim() || password.length < 4) {
      triggerError("Password must be at least 4 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await hunterApi.login(email.trim().toLowerCase(), password);
      onAuthSuccess({
        name: res.account?.name || email.split("@")[0],
        email: res.account?.email || email.trim().toLowerCase(),
        avatar: res.account?.avatar,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      triggerError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up submission -> Instant zero-buffering account creation
  const handleSignUp = async () => {
    if (!email.trim() || !validateEmail(email)) {
      triggerError("Please enter a valid email address.");
      return;
    }
    if (!password.trim() || password.length < 4) {
      triggerError("Password must be at least 4 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await hunterApi.quickAuth({
        email: email.trim().toLowerCase(),
        name: name.trim() || email.split("@")[0],
        password: password.trim(),
      });
      onAuthSuccess({
        name: res.account?.name || name.trim() || email.split("@")[0],
        email: res.account?.email || email.trim().toLowerCase(),
        avatar: res.account?.avatar,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account";
      triggerError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-tap Social Auth (Google / Apple)
  const handleQuickSocialAuth = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      const targetEmail = email.trim() && validateEmail(email)
        ? email.trim().toLowerCase()
        : `${provider}.explorer@treasurebox.app`;
      const targetName = name.trim() || (provider === "google" ? "Google Explorer" : "Apple Explorer");

      const res = await hunterApi.quickAuth({
        email: targetEmail,
        name: targetName,
      });

      onAuthSuccess({
        name: res.account?.name || targetName,
        email: res.account?.email || targetEmail,
        avatar: res.account?.avatar,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to authenticate with ${provider}`;
      triggerError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password submission
  const handleForgotPassword = async () => {
    if (!email.trim() || !validateEmail(email)) {
      triggerError("Please enter a valid email address.");
      return;
    }
    
    setLoading(true);
    try {
      setAuthIntent("forgot-password");
      await hunterApi.requestPasswordResetOtp(email.trim().toLowerCase());
      setOtp(["", "", "", "", "", ""]);
      setResendCooldown(60);
      setSubScreen("verify-otp");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to dispatch reset code";
      triggerError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP box change
  const handleOtpChange = (val: string, index: number) => {
    const cleanVal = val.replace(/[^0-9]/g, "");
    
    // Check if user pasted multiple digits
    if (cleanVal.length > 1) {
      const chars = cleanVal.split("").slice(0, 6);
      const newOtp = [...otp];
      chars.forEach((c, i) => {
        if (index + i < 6) newOtp[index + i] = c;
      });
      setOtp(newOtp);
      
      const targetIdx = Math.min(index + chars.length, 5);
      otpInputsRef.current[targetIdx]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanVal ? cleanVal[cleanVal.length - 1] : "";
    setOtp(newOtp);

    // Auto advance to next field
    if (cleanVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async () => {
    const fullCode = otp.join("");
    if (fullCode.length < 6) {
      triggerError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (authIntent === "sign-up") {
      setLoading(true);
      try {
        const res = await hunterApi.verifyRegistrationOtpAndCreateAccount({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          otp: fullCode,
        });
        onAuthSuccess({
          name: res.account?.name || name.trim(),
          email: res.account?.email || email.trim().toLowerCase(),
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Invalid or expired verification code";
        triggerError(msg);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        await hunterApi.verifyResetOtp(email.trim().toLowerCase(), fullCode);
        setResetToken(fullCode);
        setSubScreen("reset-password");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Invalid or expired reset code";
        triggerError(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      if (authIntent === "sign-up") {
        await hunterApi.resendRegistrationOtp(email.trim().toLowerCase(), name.trim());
      } else {
        await hunterApi.requestPasswordResetOtp(email.trim().toLowerCase());
      }
      setResendCooldown(60);
      setNoticeMsg(`A fresh 6-digit code has been sent to ${email}`);
      setTimeout(() => setNoticeMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend code";
      triggerError(msg);
    }
  };


  // Handle Reset Password
  const handleResetPassword = async () => {
    if (!password.trim() || password.length < 4) {
      triggerError("Password must be at least 4 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      triggerError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    try {
      await hunterApi.resetAccountPassword(email.trim().toLowerCase(), resetToken, password);
      // Success -> login directly with new password
      const res = await hunterApi.login(email.trim().toLowerCase(), password);
      onAuthSuccess({
        name: res.account?.name || email.split("@")[0],
        email: res.account?.email || email.trim().toLowerCase(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset password";
      triggerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const chevronChar = isRTL ? "‹" : "›";

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar with subtle back button & language switcher */}
        <View style={[styles.topBar, isRTL && styles.rowReverse]}>
          {subScreen !== "sign-in" ? (
            <TouchableOpacity
              onPress={() => {
                if (subScreen === "verify-otp") setSubScreen("forgot-password");
                else if (subScreen === "reset-password") setSubScreen("verify-otp");
                else setSubScreen("sign-in");
              }}
              style={styles.backCircle}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isRTL ? "chevron-forward" : "chevron-back"}
                size={18}
                color={colors.primaryGreen}
              />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}

          {/* Dual language pill & Guest Mode */}
          <View style={[styles.topBarActions, isRTL && styles.rowReverse]}>
            {onSkipToGuest && (
              <TouchableOpacity
                onPress={onSkipToGuest}
                activeOpacity={0.7}
                style={styles.guestSkipPill}
              >
                <Text style={styles.guestSkipPillText}>
                  {language === "ar" ? "تخطي والدخول כضيف ›" : "Explore as Guest ›"}
                </Text>
              </TouchableOpacity>
            )}
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
          </View>
        </View>

        {/* White Rounded Card matching the design */}
        <View style={styles.cardContainer}>
          {/* ============================================================ */}
          {/* 1. SIGN IN SCREEN ("Welcome back.")                           */}
          {/* ============================================================ */}
          {subScreen === "sign-in" && (
            <View style={styles.formWrapper}>
              <Text style={[styles.journalTag, isRTL && styles.textRight]}>
                {t("yourFieldJournal")}
              </Text>

              <Text style={[styles.headingTitle, isRTL && styles.textRight]}>
                {t("welcomeBack")}
              </Text>

              <Text style={[styles.subtitleText, isRTL && styles.textRight]}>
                {t("signInSubtitle")}
              </Text>

              {/* Email field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, isRTL && styles.textRight]}>
                  {t("emailAddress")}
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isRTL && styles.textRight,
                    focusedField === "email" && styles.textInputFocused,
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t("emailPlaceholder")}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Password field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, isRTL && styles.textRight]}>
                  {t("password")}
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      { flex: 1 },
                      isRTL && styles.textRight,
                      focusedField === "password" && styles.textInputFocused,
                      { paddingRight: isRTL ? 16 : 48, paddingLeft: isRTL ? 48 : 16 }
                    ]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t("passwordPlaceholder")}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    style={[styles.eyeIconContainer, isRTL && styles.eyeIconContainerRTL]}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot password link */}
              <TouchableOpacity
                onPress={() => setSubScreen("forgot-password")}
                activeOpacity={0.7}
                style={[styles.forgotLinkContainer, isRTL && styles.alignLeft]}
              >
                <Text style={styles.forgotLinkText}>{t("forgotPassword")}</Text>
              </TouchableOpacity>

              {/* Primary Sign In Button */}
              <TouchableOpacity
                onPress={handleSignIn}
                activeOpacity={0.85}
                disabled={loading}
                style={[styles.primaryButton, isRTL && styles.rowReverse]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.surfaceWhite} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>{t("signInBtn")}</Text>
                    <Text style={styles.buttonChevron}>{chevronChar}</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Footer Switch to Sign Up */}
              <View style={[styles.footerRow, isRTL && styles.rowReverse]}>
                <Text style={styles.footerMutedText}>
                  {t("newToTreasureBox")}{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => setSubScreen("sign-up")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerBoldLink}>
                    {t("createAccountBtn")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quick Social Access */}
              <View style={styles.socialDividerRow}>
                <View style={styles.socialDividerLine} />
                <Text style={styles.socialDividerText}>
                  {language === "ar" ? "أو الدخول السريع" : "OR QUICK ACCESS"}
                </Text>
                <View style={styles.socialDividerLine} />
              </View>

              <View style={[styles.socialButtonsRow, isRTL && styles.rowReverse]}>
                <TouchableOpacity
                  onPress={() => handleQuickSocialAuth("google")}
                  activeOpacity={0.8}
                  style={styles.socialBtn}
                >
                  <Ionicons name="logo-google" size={16} color="#DB4437" />
                  <Text style={styles.socialBtnText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleQuickSocialAuth("apple")}
                  activeOpacity={0.8}
                  style={styles.socialBtn}
                >
                  <Ionicons name="logo-apple" size={16} color="#000000" />
                  <Text style={styles.socialBtnText}>Apple</Text>
                </TouchableOpacity>
              </View>

              {/* Guest Mode option */}
              {onSkipToGuest && (
                <TouchableOpacity
                  onPress={onSkipToGuest}
                  activeOpacity={0.7}
                  style={[styles.guestModeBottomBtn, isRTL && styles.rowReverse]}
                >
                  <Ionicons name="compass-outline" size={16} color={colors.primaryGreen} />
                  <Text style={styles.guestModeBottomText}>
                    {language === "ar" ? "المتابعة كضيف بدون تسجيل" : "Continue as Guest & Explore"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ============================================================ */}
          {/* 2. SIGN UP SCREEN ("Start the hunt.")                         */}
          {/* ============================================================ */}
          {subScreen === "sign-up" && (
            <View style={styles.formWrapper}>
              <Text style={[styles.journalTag, isRTL && styles.textRight]}>
                {t("yourFieldJournal")}
              </Text>

              <Text style={[styles.headingTitle, isRTL && styles.textRight]}>
                {t("startTheHunt")}
              </Text>

              <Text style={[styles.subtitleText, isRTL && styles.textRight]}>
                {t("createAccountSubtitle")}
              </Text>

              {/* Full Name field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, isRTL && styles.textRight]}>
                  {t("fullName")}
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isRTL && styles.textRight,
                    focusedField === "name" && styles.textInputFocused,
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder={t("fullNamePlaceholder")}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Email address field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, isRTL && styles.textRight]}>
                  {t("emailAddress")}
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isRTL && styles.textRight,
                    focusedField === "email" && styles.textInputFocused,
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t("emailPlaceholder")}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Password field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, isRTL && styles.textRight]}>
                  {t("password")}
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      { flex: 1 },
                      isRTL && styles.textRight,
                      focusedField === "reg-password" && styles.textInputFocused,
                      { paddingRight: isRTL ? 16 : 48, paddingLeft: isRTL ? 48 : 16 }
                    ]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t("passwordPlaceholder")}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField("reg-password")}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    style={[styles.eyeIconContainer, isRTL && styles.eyeIconContainerRTL]}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Primary Create Account Button */}
              <TouchableOpacity
                onPress={handleSignUp}
                activeOpacity={0.85}
                disabled={loading}
                style={[
                  styles.primaryButton,
                  { marginTop: 14 },
                  isRTL && styles.rowReverse,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.surfaceWhite} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      {t("createAccountBtn")}
                    </Text>
                    <Text style={styles.buttonChevron}>{chevronChar}</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Footer Switch to Sign In */}
              <View style={[styles.footerRow, isRTL && styles.rowReverse]}>
                <Text style={styles.footerMutedText}>
                  {t("alreadyHaveAccount")}{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => setSubScreen("sign-in")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerBoldLink}>{t("signInBtn")}</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Social Access */}
              <View style={styles.socialDividerRow}>
                <View style={styles.socialDividerLine} />
                <Text style={styles.socialDividerText}>
                  {language === "ar" ? "أو الدخول السريع" : "OR QUICK ACCESS"}
                </Text>
                <View style={styles.socialDividerLine} />
              </View>

              <View style={[styles.socialButtonsRow, isRTL && styles.rowReverse]}>
                <TouchableOpacity
                  onPress={() => handleQuickSocialAuth("google")}
                  activeOpacity={0.8}
                  style={styles.socialBtn}
                >
                  <Ionicons name="logo-google" size={16} color="#DB4437" />
                  <Text style={styles.socialBtnText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleQuickSocialAuth("apple")}
                  activeOpacity={0.8}
                  style={styles.socialBtn}
                >
                  <Ionicons name="logo-apple" size={16} color="#000000" />
                  <Text style={styles.socialBtnText}>Apple</Text>
                </TouchableOpacity>
              </View>

              {/* Guest Mode option */}
              {onSkipToGuest && (
                <TouchableOpacity
                  onPress={onSkipToGuest}
                  activeOpacity={0.7}
                  style={[styles.guestModeBottomBtn, isRTL && styles.rowReverse]}
                >
                  <Ionicons name="compass-outline" size={16} color={colors.primaryGreen} />
                  <Text style={styles.guestModeBottomText}>
                    {language === "ar" ? "المتابعة كضيف بدون تسجيل" : "Continue as Guest & Explore"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ============================================================ */}
          {/* 3. FORGOT PASSWORD SCREEN ("Find your way back.")             */}
          {/* ============================================================ */}
          {subScreen === "forgot-password" && (
            <View style={styles.formWrapper}>
              <Text style={[styles.journalTag, isRTL && styles.textRight]}>
                {t("yourFieldJournal")}
              </Text>

              <Text style={[styles.headingTitle, isRTL && styles.textRight]}>
                {t("findYourWayBack")}
              </Text>

              <Text style={[styles.subtitleText, isRTL && styles.textRight]}>
                {t("findWayBackSubtitle")}
              </Text>

              {/* Email field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, isRTL && styles.textRight]}>
                  {t("emailAddress")}
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    isRTL && styles.textRight,
                    focusedField === "email" && styles.textInputFocused,
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t("emailPlaceholder")}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Verify Email Button */}
              <TouchableOpacity
                onPress={handleForgotPassword}
                activeOpacity={0.85}
                disabled={loading}
                style={[
                  styles.primaryButton,
                  { marginTop: 16 },
                  isRTL && styles.rowReverse,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.surfaceWhite} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      {t("verifyEmailBtn")}
                    </Text>
                    <Text style={styles.buttonChevron}>{chevronChar}</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Footer Switch to Sign In */}
              <View style={[styles.footerRow, isRTL && styles.rowReverse]}>
                <Text style={styles.footerMutedText}>
                  {t("rememberedPassword")}{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => setSubScreen("sign-in")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerBoldLink}>{t("signInBtn")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* 4. OTP VERIFICATION SCREEN ("Verify your mail")               */}
          {/* ============================================================ */}
          {subScreen === "verify-otp" && (
            <View style={styles.formWrapper}>
              <Text style={[styles.journalTag, isRTL && styles.textRight]}>
                {t("yourFieldJournal")}
              </Text>

              <Text style={[styles.subtitleText, isRTL && styles.textRight]}>
                {`Enter the 6-digit verification code dispatched to ${email || 'your email'}.`}
              </Text>

              {noticeMsg && (
                <View style={{ backgroundColor: "#FDFBF7", padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.brassGold, marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, color: colors.primaryGreen, textAlign: "center", fontWeight: "600" }}>
                    {noticeMsg}
                  </Text>
                </View>
              )}

              {/* 6-digit OTP input boxes matching design */}
              <View style={[styles.otpRow, isRTL && styles.rowReverse]}>
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const isFilled = Boolean(otp[index]);
                  const isCurrent =
                    focusedField === `otp-${index}` ||
                    (focusedField === null && index === 0);

                  return (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        otpInputsRef.current[index] = ref;
                      }}
                      style={[
                        styles.otpBox,
                        isFilled && styles.otpBoxFilled,
                        focusedField === `otp-${index}` && styles.otpBoxActive,
                      ]}
                      value={otp[index]}
                      onChangeText={(val) => handleOtpChange(val, index)}
                      onKeyPress={(e) => handleOtpKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={6}
                      selectTextOnFocus
                      onFocus={() => setFocusedField(`otp-${index}`)}
                      onBlur={() => setFocusedField(null)}
                    />
                  );
                })}
              </View>

              {/* Verify Email Button */}
              <TouchableOpacity
                onPress={handleVerifyOtp}
                activeOpacity={0.85}
                disabled={loading}
                style={[
                  styles.primaryButton,
                  { marginTop: 24 },
                  isRTL && styles.rowReverse,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.surfaceWhite} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      {authIntent === "sign-up" ? "Verify & Create Account" : t("verifyEmailBtn")}
                    </Text>
                    <Text style={styles.buttonChevron}>{chevronChar}</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Resend Code Option */}
              <View style={[styles.footerRow, { marginTop: 16 }, isRTL && styles.rowReverse]}>
                <Text style={styles.footerMutedText}>Didn&apos;t receive code? </Text>
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={resendCooldown > 0}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.footerBoldLink, resendCooldown > 0 && { color: "#999" }]}>
                    {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Footer Switch to Sign In */}
              <View style={[styles.footerRow, isRTL && styles.rowReverse]}>
                <Text style={styles.footerMutedText}>
                  {t("rememberedPassword")}{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => setSubScreen("sign-in")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerBoldLink}>{t("signInBtn")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* 5. RESET PASSWORD SCREEN ("Set a new password.")              */}
          {/* ============================================================ */}
          {subScreen === "reset-password" && (
            <View style={styles.formWrapper}>
              <Text style={[styles.journalTag, isRTL && styles.textRight]}>
                {t("yourFieldJournal")}
              </Text>

              <Text style={[styles.headingTitle, isRTL && styles.textRight]}>
                {t("setNewPassword")}
              </Text>

              <Text style={[styles.subtitleText, isRTL && styles.textRight]}>
                {t("setNewPasswordSubtitle")}
              </Text>

              {/* New Password field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, isRTL && styles.textRight]}>
                  {t("newPassword")}
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      { flex: 1 },
                      isRTL && styles.textRight,
                      focusedField === "new-pass" && styles.textInputFocused,
                      { paddingRight: isRTL ? 16 : 48, paddingLeft: isRTL ? 48 : 16 }
                    ]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t("passwordPlaceholder")}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField("new-pass")}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    style={[styles.eyeIconContainer, isRTL && styles.eyeIconContainerRTL]}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm New Password field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, isRTL && styles.textRight]}>
                  {t("confirmNewPassword")}
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      { flex: 1 },
                      isRTL && styles.textRight,
                      focusedField === "reset-confirm" && styles.textInputFocused,
                      { paddingRight: isRTL ? 16 : 48, paddingLeft: isRTL ? 48 : 16 }
                    ]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder={t("passwordPlaceholder")}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField("reset-confirm")}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    style={[styles.eyeIconContainer, isRTL && styles.eyeIconContainerRTL]}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Update Password Button */}
              <TouchableOpacity
                onPress={handleResetPassword}
                activeOpacity={0.85}
                disabled={loading}
                style={[
                  styles.primaryButton,
                  { marginTop: 14 },
                  isRTL && styles.rowReverse,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.surfaceWhite} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      {t("updatePasswordBtn")}
                    </Text>
                    <Text style={styles.buttonChevron}>{chevronChar}</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Footer Switch to Sign In */}
              <View style={[styles.footerRow, isRTL && styles.rowReverse]}>
                <Text style={styles.footerMutedText}>
                  {t("rememberedPassword")}{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => setSubScreen("sign-in")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerBoldLink}>{t("signInBtn")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ============================================================ */}
      {/* 6. ERROR MODAL ("Let's try that again.")                      */}
      {/* ============================================================ */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalFloatingCard}>
            {/* Red Circle with Cross Icon */}
            <View style={styles.modalRedCircle}>
              <Feather name="x" size={24} color="#DC2626" />
            </View>

            {/* SOMETHING WENT WRONG */}
            <Text style={styles.modalWarningTag}>
              {t("somethingWentWrong")}
            </Text>

            {/* Let's try that again. */}
            <Text style={styles.modalTitleSerif}>
              {t("letsTryAgain")}
            </Text>

            {/* Subtitle */}
            <Text style={styles.modalSubtitle}>
              {errorMessage}
            </Text>

            {/* Try again > button */}
            <TouchableOpacity
              onPress={() => setShowErrorModal(false)}
              activeOpacity={0.85}
              style={[styles.primaryButton, { width: "100%", marginTop: 24 }]}
            >
              <Text style={styles.primaryButtonText}>
                {t("tryAgainBtn")}
              </Text>
              <Text style={styles.buttonChevron}>{chevronChar}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F4F5F4",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  topBar: {
    width: "100%",
    maxWidth: 370,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingBottom: 12,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  textRight: {
    textAlign: "right",
  },
  alignLeft: {
    alignSelf: "flex-start",
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.brassBorder,
    backgroundColor: colors.surfaceWhite,
    gap: 6,
  },
  langText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  langActive: {
    color: colors.primaryGreen,
    fontWeight: "700",
  },
  langInactive: {
    color: colors.textMuted,
  },
  langDivider: {
    fontSize: 11,
    color: colors.brassBorder,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 370,
    backgroundColor: colors.surfaceWhite,
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#ECEEF0",
  },
  formWrapper: {
    width: "100%",
  },
  journalTag: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#B45309", // Warm brass/amber matching the screenshot
    letterSpacing: 1.3,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  headingTitle: {
    fontSize: 29,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
    color: "#0F382E",
    letterSpacing: -0.5,
    marginBottom: 6,
    lineHeight: 35,
  },
  subtitleText: {
    fontSize: 13,
    color: "#5C6B64",
    lineHeight: 19,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 13,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  textInput: {
    height: 45,
    backgroundColor: "#F9FAFB",
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 13.5,
    color: "#111827",
  },
  textInputFocused: {
    borderColor: colors.primaryGreen,
    backgroundColor: "#FFFFFF",
    shadowColor: colors.primaryGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  eyeIconContainer: {
    position: "absolute",
    right: 14,
    height: "100%",
    justifyContent: "center",
  },
  eyeIconContainerRTL: {
    right: undefined,
    left: 14,
  },
  forgotLinkContainer: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotLinkText: {
    fontSize: 12.5,
    color: "#B45309",
    fontWeight: "500",
  },
  primaryButton: {
    height: 45,
    backgroundColor: "#103B30",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#103B30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: colors.surfaceWhite,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  buttonChevron: {
    color: colors.surfaceWhite,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 2,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  footerMutedText: {
    fontSize: 12,
    color: "#6B7280",
  },
  footerBoldLink: {
    fontSize: 12.5,
    color: "#111827",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
    paddingHorizontal: 6,
  },
  otpBox: {
    width: 44,
    height: 52,
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#0F382E",
  },
  otpBoxFilled: {
    borderColor: "#0F382E",
    backgroundColor: "#FFFFFF",
  },
  otpBoxActive: {
    borderColor: "#0F382E",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F382E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Error Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalFloatingCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.surfaceWhite,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 12,
  },
  modalRedCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalWarningTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  modalTitleSerif: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
    color: "#0F382E",
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#5C6B64",
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 10,
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  guestSkipPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(19, 115, 51, 0.08)",
  },
  guestSkipPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryGreen,
  },
  guestModeBottomBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: colors.borderSubtle,
  },
  guestModeBottomText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primaryGreen,
  },
  socialDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
    gap: 8,
  },
  socialDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  socialDividerText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  socialButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  socialBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
});
