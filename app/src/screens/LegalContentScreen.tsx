import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import RenderHtml from "react-native-render-html";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { useLanguage } from "../i18n/LanguageContext";
import { hunterApi } from "../services/api";

export type LegalType = "terms" | "about-us" | "privacy";

interface LegalContentScreenProps {
  type: LegalType;
  onBack: () => void;
}

export const LegalContentScreen: React.FC<LegalContentScreenProps> = ({
  type,
  onBack,
}) => {
  const { isRTL } = useLanguage();
  const { width } = useWindowDimensions();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        let apiType: "TERMS" | "PRIVACY" | "ABOUT" = "TERMS";
        if (type === "privacy") apiType = "PRIVACY";
        if (type === "about-us") apiType = "ABOUT";

        const res = await hunterApi.getLegalDocument(apiType);
        setTitle(res.title || type.toUpperCase());
        setContent(res.content || "<p>No content available at the moment.</p>");
      } catch (err) {
        console.warn("Failed to fetch legal document", err);
        setTitle("Error");
        setContent("<p>Failed to load document.</p>");
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [type]);

  const htmlTagsStyles = {
    p: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
      marginBottom: 16,
      textAlign: isRTL ? "right" : ("left" as any),
    },
    h1: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.primaryGreen,
      marginBottom: 12,
      fontFamily: fonts.frauncesBold,
      textAlign: isRTL ? "right" : ("left" as any),
    },
    h2: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.primaryGreen,
      marginBottom: 10,
      fontFamily: fonts.frauncesBold,
      textAlign: isRTL ? "right" : ("left" as any),
    },
    h3: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.primaryGreen,
      marginBottom: 8,
      fontFamily: fonts.frauncesBold,
      textAlign: isRTL ? "right" : ("left" as any),
    },
    ul: {
      marginBottom: 16,
    },
    ol: {
      marginBottom: 16,
    },
    li: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    strong: {
      color: colors.primaryGreen,
      fontWeight: "700",
    },
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, isRTL && styles.rowReverse]}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Ionicons
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={20}
            color={colors.primaryGreen}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, isRTL && styles.textRight]}>{title}</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primaryGreen} style={{ marginTop: 40 }} />
        ) : (
          <RenderHtml
            contentWidth={width - 56} // padding horizontal 28 * 2
            source={{ html: content }}
            tagsStyles={htmlTagsStyles as any}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 48,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
    color: colors.primaryGreen,
    letterSpacing: -0.5,
    marginBottom: 28,
  },
});
