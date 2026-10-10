import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { useLanguage } from "../i18n/LanguageContext";
import { hunterApi } from "../services/api";
import { UserProfile, Hunt } from "../types/hunt";

interface ProfileScreenProps {
  onBack: () => void;
  onProfileUpdated?: (user: UserProfile) => void;
  onSelectHunt?: (hunt: Hunt) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onProfileUpdated,
  onSelectHunt,
}) => {
  const { isRTL, t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"expeditions" | "security">("expeditions");

  // Profile data
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Expeditions data
  const [expeditions, setExpeditions] = useState<Hunt[]>([]);
  const [loadingExpeditions, setLoadingExpeditions] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expPage, setExpPage] = useState(1);
  const [expTotalPages, setExpTotalPages] = useState(1);
  const [expTotal, setExpTotal] = useState(0);
  const EXP_LIMIT = 5;

  // Password data
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passErrorMsg, setPassErrorMsg] = useState("");
  const [passSuccessMsg, setPassSuccessMsg] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await hunterApi.getMe();
      if (data) {
        setName(data.name || "");
        setEmail(data.email || "");
        if (data.avatar) setAvatarUrl(data.avatar);
        if (data.email) {
          loadExpeditions(data.email);
        }
      }
    } catch (e) {
      console.warn("Failed to load profile", e);
      setErrorMsg("Could not load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const loadExpeditions = async (hunterEmail?: string, page: number = 1) => {
    const targetEmail = hunterEmail || email;
    if (!targetEmail) {
      setLoadingExpeditions(false);
      return;
    }
    try {
      const result = await hunterApi.fetchMyPurchasedExpeditions(targetEmail, page, EXP_LIMIT);
      setExpeditions(result.hunts);
      setExpPage(result.page);
      setExpTotalPages(result.totalPages);
      setExpTotal(result.total);
    } catch (e) {
      console.warn('Failed to load purchased expeditions', e);
    } finally {
      setLoadingExpeditions(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadExpeditions(email, 1);
  };

  const handlePrevPage = () => {
    if (expPage <= 1) return;
    setLoadingExpeditions(true);
    loadExpeditions(email, expPage - 1);
  };

  const handleNextPage = () => {
    if (expPage >= expTotalPages) return;
    setLoadingExpeditions(true);
    loadExpeditions(email, expPage + 1);
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      setAvatarUrl(pickerResult.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg("Name cannot be empty.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const isLocalFile =
        avatarUrl?.startsWith("file://") ||
        avatarUrl?.startsWith("data:") ||
        avatarUrl?.startsWith("blob:");
      const res = await hunterApi.updateMyProfile(
        name,
        isLocalFile && avatarUrl ? avatarUrl : undefined
      );

      setSuccessMsg("Profile updated successfully!");
      if (onProfileUpdated) {
        onProfileUpdated({
          name: res.name || name,
          email: res.email || email,
          avatar: res.avatar,
        });
      }
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      console.warn("Failed to update profile", e);
      setErrorMsg("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) {
      setPassErrorMsg("Please enter both current and new passwords.");
      return;
    }
    if (newPassword.length < 6) {
      setPassErrorMsg("New password must be at least 6 characters.");
      return;
    }

    setChangingPassword(true);
    setPassErrorMsg("");
    setPassSuccessMsg("");

    try {
      await hunterApi.changePassword(currentPassword, newPassword);
      setPassSuccessMsg("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setPassSuccessMsg(""), 3000);
    } catch (e: any) {
      console.warn("Failed to change password", e);
      setPassErrorMsg(e.message || "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "EASY":
        return "#10B981";
      case "MEDIUM":
        return "#F59E0B";
      case "HARD":
        return "#EF4444";
      default:
        return "#10B981";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerRow, isRTL && styles.rowReverse]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={20} color={colors.primaryGreen} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("profile") || "Profile"}</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Segmented Top Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab("expeditions")}
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === "expeditions" && styles.tabButtonActive]}
        >
          <Ionicons
            name="compass"
            size={16}
            color={activeTab === "expeditions" ? "#E1BF62" : "#6B7280"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "expeditions" && styles.tabButtonTextActive,
            ]}
          >
            {t("myExpeditions") || "My Expeditions"}
          </Text>
            {expeditions.length > 0 && (
             <View
               style={[
                 styles.badgeCounter,
                 activeTab === "expeditions" && styles.badgeCounterActive,
               ]}
             >
               <Text
                 style={[
                   styles.badgeCounterText,
                   activeTab === "expeditions" && styles.badgeCounterTextActive,
                 ]}
               >
                 {expTotal > 0 ? expTotal : expeditions.length}
               </Text>
             </View>
           )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("security")}
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === "security" && styles.tabButtonActive]}
        >
          <Ionicons
            name="person"
            size={16}
            color={activeTab === "security" ? "#E1BF62" : "#6B7280"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "security" && styles.tabButtonTextActive,
            ]}
          >
            {t("accountSecurity") || "Account & Security"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primaryGreen} style={{ marginTop: 40 }} />
      ) : activeTab === "expeditions" ? (
        /* --- MY EXPEDITIONS TAB --- */
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.expeditionsContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#0F382E" />
          }
        >
          {loadingExpeditions ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={colors.primaryGreen} />
              <Text style={styles.loadingText}>Loading your expeditions...</Text>
            </View>
          ) : expeditions.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="compass-outline" size={48} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>
                {t("noPurchasedHunts") || "No Expedition Permits Yet"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {t("noPurchasedHuntsSubtitle") ||
                  "Acquire an expedition permit from the catalog to embark on a real-world treasure hunt."}
              </Text>
              <TouchableOpacity onPress={onBack} activeOpacity={0.85} style={styles.browseButton}>
                <Text style={styles.browseButtonText}>
                  {t("exploreCatalog") || "Explore Catalog"}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {/* Section header with prev/next pagination arrows */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[styles.sectionHeaderLabel, isRTL && styles.textRight]}>
                  ACTIVE PERMITS &amp; EXPEDITIONS ({expTotal})
                </Text>
                {expTotalPages > 1 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TouchableOpacity
                      onPress={handlePrevPage}
                      disabled={expPage <= 1 || loadingExpeditions}
                      activeOpacity={0.7}
                      style={[
                        styles.pageArrowBtn,
                        (expPage <= 1 || loadingExpeditions) && { opacity: 0.35 },
                      ]}
                    >
                      <Ionicons name="chevron-back" size={16} color={colors.primaryGreen} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleNextPage}
                      disabled={expPage >= expTotalPages || loadingExpeditions}
                      activeOpacity={0.7}
                      style={[
                        styles.pageArrowBtn,
                        (expPage >= expTotalPages || loadingExpeditions) && { opacity: 0.35 },
                      ]}
                    >
                      <Ionicons name="chevron-forward" size={16} color={colors.primaryGreen} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {expeditions.map((hunt) => {
                const isFound = hunt.status === "FOUND";
                const localizedTitle =
                  language === "ar" ? hunt.titleAr || hunt.title : hunt.title;
                const localizedLocation =
                  language === "ar" ? hunt.locationNameAr || hunt.locationName : hunt.locationName;

                return (
                  <View key={hunt.id} style={styles.expeditionCard}>
                    {/* Card Top: Cover Image & Status Badge */}
                    <View style={styles.cardImageContainer}>
                      {hunt.coverImage ? (
                        <Image source={{ uri: hunt.coverImage }} style={styles.cardImage} />
                      ) : (
                        <View style={[styles.cardImage, { backgroundColor: "#0D2823" }]} />
                      )}
                      <View style={styles.cardImageOverlay} />

                      {/* Difficulty Tag */}
                      <View style={styles.difficultyTag}>
                        <View
                          style={[
                            styles.diffIndicatorDot,
                            { backgroundColor: getDifficultyColor(hunt.difficulty) },
                          ]}
                        />
                        <Text style={styles.difficultyText}>{hunt.difficulty}</Text>
                      </View>

                      {/* Status Tag */}
                      <View
                        style={[
                          styles.statusPill,
                          isFound ? styles.statusPillFound : styles.statusPillInProgress,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            isFound ? styles.statusPillTextFound : styles.statusPillTextInProgress,
                          ]}
                        >
                          {isFound
                            ? `★ ${t("foundStatus") || "FOUND & SEALED"}`
                            : `● ${t("inProgressStatus") || "IN PROGRESS"}`}
                        </Text>
                      </View>
                    </View>

                    {/* Card Body */}
                    <View style={styles.cardBody}>
                      <Text style={[styles.cardTitle, isRTL && styles.textRight]}>
                        {localizedTitle}
                      </Text>

                      {/* Location & Coordinates Row */}
                      <View style={[styles.metaRow, isRTL && styles.rowReverse]}>
                        <Ionicons name="location-sharp" size={15} color="#059669" />
                        <Text style={styles.metaLocationText} numberOfLines={1}>
                          {localizedLocation || "Riyadh Expedition Point"}
                        </Text>
                      </View>

                      {hunt.stage1Pin ? (
                        <Text style={[styles.coordsText, isRTL && styles.textRight]}>
                          📍 {hunt.stage1Pin}
                        </Text>
                      ) : null}

                      {/* Hints & Cipher stats */}
                      <View style={[styles.statsRow, isRTL && styles.rowReverse]}>
                        <View style={styles.statBadge}>
                          <Ionicons name="bulb-outline" size={13} color="#6B7280" />
                          <Text style={styles.statBadgeText}>
                            {hunt.hints?.length || 0} Field Hints
                          </Text>
                        </View>
                        <View style={styles.statBadge}>
                          <Ionicons name="key-outline" size={13} color="#6B7280" />
                          <Text style={styles.statBadgeText}>
                            {hunt.cipherColumns || 5}-Barrel Cipher
                          </Text>
                        </View>
                      </View>

                      {/* Action Button: Resume Hunt / View Record */}
                      <TouchableOpacity
                        onPress={() => {
                          if (onSelectHunt) {
                            onSelectHunt(hunt);
                          }
                        }}
                        activeOpacity={0.85}
                        style={[
                          styles.cardActionButton,
                          isFound ? styles.cardActionButtonFound : styles.cardActionButtonActive,
                          isRTL && styles.rowReverse,
                        ]}
                      >
                        <Ionicons
                          name={isFound ? "checkmark-circle" : "compass"}
                          size={18}
                          color={isFound ? colors.primaryGreen : "#E1BF62"}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={[
                            styles.cardActionText,
                            isFound && { color: colors.primaryGreen },
                          ]}
                        >
                          {isFound
                            ? "View Completed Record"
                            : t("resumeExpedition") || "Resume Expedition"}
                        </Text>
                        <Ionicons
                          name={isRTL ? "chevron-back" : "chevron-forward"}
                          size={16}
                          color={isFound ? colors.primaryGreen : "#E1BF62"}
                          style={{ marginLeft: "auto" }}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : (
        /* --- ACCOUNT & SECURITY TAB --- */
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{name ? name.charAt(0).toUpperCase() : "U"}</Text>
                </View>
              )}
              <View style={styles.editIconBadge}>
                <Feather name="camera" size={12} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.inputLabel, isRTL && styles.textRight]}>
              {t("fullName") || "Full Name"}
            </Text>
            <TextInput
              style={[styles.textInput, isRTL && styles.textRight]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.inputLabel, isRTL && styles.textRight]}>
              {t("emailAddress") || "Email Address"}
            </Text>
            <TextInput
              style={[styles.textInput, isRTL && styles.textRight, { backgroundColor: "#F3F4F6", color: "#6B7280" }]}
              value={email}
              editable={false}
            />
            <Text style={styles.helperText}>Email address cannot be changed.</Text>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
            style={styles.primaryButton}
          >
            {saving ? (
              <ActivityIndicator color={colors.surfaceWhite} />
            ) : (
              <Text style={styles.primaryButtonText}>{t("save") || "Save Changes"}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Change Password</Text>
          {passErrorMsg ? <Text style={styles.errorText}>{passErrorMsg}</Text> : null}
          {passSuccessMsg ? <Text style={styles.successText}>{passSuccessMsg}</Text> : null}

          <View style={styles.fieldGroup}>
            <Text style={[styles.inputLabel, isRTL && styles.textRight]}>Current Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[styles.textInput, styles.passwordInputFlexible, isRTL && styles.textRight]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeIconContainer}
              >
                <Feather
                  name={showCurrentPassword ? "eye" : "eye-off"}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.inputLabel, isRTL && styles.textRight]}>New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[styles.textInput, styles.passwordInputFlexible, isRTL && styles.textRight]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password (min 6 characters)"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeIconContainer}
              >
                <Feather
                  name={showNewPassword ? "eye" : "eye-off"}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleChangePassword}
            activeOpacity={0.85}
            disabled={changingPassword}
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.surfaceWhite,
                borderWidth: 1,
                borderColor: colors.primaryGreen,
              },
            ]}
          >
            {changingPassword ? (
              <ActivityIndicator color={colors.primaryGreen} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: colors.primaryGreen }]}>
                Change Password
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  textRight: {
    textAlign: "right",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.parchmentLight,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.frauncesBold,
    color: colors.primaryGreen,
  },

  /* Segmented Tabs */
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    padding: 4,
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 14,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: "#0D2823",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  badgeCounter: {
    backgroundColor: "#D1D5DB",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  badgeCounterActive: {
    backgroundColor: "#E1BF62",
  },
  badgeCounterText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
  },
  badgeCounterTextActive: {
    color: "#0D2823",
  },

  /* Expeditions List */
  expeditionsContent: {
    padding: 18,
    paddingBottom: 40,
  },
  pageArrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  loaderBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#6B7280",
  },
  sectionHeaderLabel: {
    fontSize: 11,
    color: "#6B7280",
    letterSpacing: 1,
    marginBottom: 4,
  },
  expeditionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#0D2823",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardImageContainer: {
    width: "100%",
    height: 150,
    position: "relative",
    backgroundColor: "#1F2937",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  difficultyTag: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  diffIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  difficultyText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statusPill: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillInProgress: {
    backgroundColor: "rgba(209, 250, 229, 0.95)",
    borderColor: "#A7F3D0",
  },
  statusPillFound: {
    backgroundColor: "rgba(254, 243, 199, 0.95)",
    borderColor: "#FDE68A",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statusPillTextInProgress: {
    color: "#065F46",
  },
  statusPillTextFound: {
    color: "#92400E",
  },
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: fonts.frauncesBold,
    color: "#0F382E",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  metaLocationText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
    marginLeft: 4,
  },
  coordsText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statBadgeText: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "500",
  },
  cardActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  cardActionButtonActive: {
    backgroundColor: "#0D2823",
  },
  cardActionButtonFound: {
    backgroundColor: colors.parchmentLight,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  /* Empty State */
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.frauncesBold,
    color: colors.primaryGreen,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
    maxWidth: 280,
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D2823",
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  /* Account & Security */
  content: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 30,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#E1BF62",
    fontSize: 34,
    fontFamily: fonts.frauncesBold,
  },
  editIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primaryGreen,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  fieldGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.primaryGreen,
    backgroundColor: colors.surfaceWhite,
  },
  helperText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: colors.buttonGreen,
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: colors.surfaceWhite,
    fontSize: 14,
    fontWeight: "700",
  },
  errorText: {
    color: "red",
    marginBottom: 14,
    textAlign: "center",
    fontSize: 13,
  },
  successText: {
    color: "green",
    marginBottom: 14,
    textAlign: "center",
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.frauncesBold,
    color: colors.primaryGreen,
    marginBottom: 14,
  },
  passwordInputContainer: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInputFlexible: {
    paddingRight: 45,
  },
  eyeIconContainer: {
    position: "absolute",
    right: 12,
    height: "100%",
    justifyContent: "center",
  },
});
