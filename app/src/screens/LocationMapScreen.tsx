import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
  Dimensions,
  Image,
  ActivityIndicator,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Header } from "../components/Header";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { useLanguage } from "../i18n/LanguageContext";
import { Hunt } from "../types/hunt";

interface LocationMapScreenProps {
  hunt: Hunt;
  onBack: () => void;
  onConfirmFind: () => void;
  onPressProfile?: () => void;
}

const { width } = Dimensions.get("window");
const MAP_WIDTH = Math.min(width - 44, 420);
const MAP_HEIGHT = 260;

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

function buildStaticMapUrl(lat: number, lng: number): string {
  const zoom = 15;
  const size = `${MAP_WIDTH * 2}x${MAP_HEIGHT * 2}`; // 2x for retina

  if (GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
    const marker = `color:0x103B30|label:T|${lat},${lng}`;
    return (
      `https://maps.googleapis.com/maps/api/staticmap` +
      `?center=${lat},${lng}` +
      `&zoom=${zoom}` +
      `&size=${size}` +
      `&maptype=roadmap` +
      `&markers=${encodeURIComponent(marker)}` +
      `&style=feature:poi|visibility:off` +
      `&style=feature:transit|visibility:off` +
      `&key=${GOOGLE_MAPS_API_KEY}`
    );
  }

  // Fallback: OpenStreetMap static via staticmap.de (no key needed)
  return (
    `https://staticmap.openstreetmap.de/staticmap.php` +
    `?center=${lat},${lng}` +
    `&zoom=${zoom}` +
    `&size=${MAP_WIDTH * 2}x${MAP_HEIGHT * 2}` +
    `&maptype=mapnik` +
    `&markers=${lat},${lng},red-pushpin`
  );
}

export const LocationMapScreen: React.FC<LocationMapScreenProps> = ({
  hunt,
  onBack,
  onConfirmFind,
  onPressProfile,
}) => {
  const { t, isRTL, language } = useLanguage();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const localizedLocation =
    (language === "ar" ? hunt.locationNameAr : hunt.locationName) ||
    hunt.title ||
    "Treasure Location";
  const localizedTitle = (language === "ar" && hunt.titleAr?.trim()) ? hunt.titleAr.trim() : hunt.title;

  const targetLat = hunt.coordinates?.latitude ?? 25.2644;
  const targetLng = hunt.coordinates?.longitude ?? 55.2982;
  const coordinatesString =
    hunt.stage1Pin || `${targetLat.toFixed(4)}° N, ${targetLng.toFixed(4)}° E`;

  const staticMapUrl = buildStaticMapUrl(targetLat, targetLng);

  // OpenStreetMap embed URL for web (no API key, no CORS issues)
  const osmEmbedUrl =
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${targetLng - 0.008},${targetLat - 0.007},${targetLng + 0.008},${targetLat + 0.007}` +
    `&layer=mapnik` +
    `&marker=${targetLat},${targetLng}`;

  const handleOpenMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(localizedLocation)}&ll=${targetLat},${targetLng}`,
      android: `geo:0,0?q=${targetLat},${targetLng}(${encodeURIComponent(localizedLocation)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${targetLat},${targetLng}`,
    });
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.screen}>
      <Header showBack onBack={onBack} onPressProfile={onPressProfile} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header Section ── */}
        <View style={[styles.headerSection, isRTL && styles.alignRight]}>
          <Text style={[styles.stageLabel, isRTL && styles.textRight]}>
            {language === "ar" ? "الموقع النهائي" : "FINAL LOCATION"}
          </Text>
          <Text style={[styles.title, isRTL && styles.textRight]}>
            {localizedLocation}
          </Text>
          <Text style={[styles.description, isRTL && styles.textRight]}>
            {t("openInMapsDesc")}
          </Text>
        </View>

        {/* ── Map Card with Real Static Map ── */}
        <TouchableOpacity
          activeOpacity={Platform.OS === "web" ? 1 : 0.92}
          onPress={Platform.OS === "web" ? undefined : handleOpenMaps}
          style={styles.mapCard}
        >
          {Platform.OS === "web" ? (
            // Web: use OSM iframe embed — no API key, no CORS issues
            <View style={styles.webMapWrapper}>
              {/* @ts-ignore — iframe is valid in Expo Web / React Native Web */}
              <iframe
                src={osmEmbedUrl}
                style={{
                  width: "100%",
                  height: MAP_HEIGHT,
                  border: "none",
                  borderRadius: 12,
                  display: "block",
                }}
                title="Treasure Location Map"
                loading="lazy"
              />
              {/* GPS status pill on top of iframe */}
              <View
                style={[styles.gpsPill, isRTL && styles.gpsPillRTL]}
                pointerEvents="none"
              >
                <View style={styles.greenLiveDot} />
                <Text style={styles.gpsText}>GPS ACTIVE • CACHE REVEALED</Text>
              </View>
              {/* Location name label at bottom center */}
              <View style={styles.webLocationLabel} pointerEvents="none">
                <Text style={styles.webLocationLabelText} numberOfLines={1}>
                  {localizedLocation}
                </Text>
              </View>
            </View>
          ) : (
            <>
              {/* Loading placeholder */}
              {!mapLoaded && !mapError && (
                <View style={styles.mapPlaceholder}>
                  <ActivityIndicator size="small" color={colors.primaryGreen} />
                  <Text style={styles.mapLoadingText}>Loading map…</Text>
                </View>
              )}

              {/* Error fallback */}
              {mapError && (
                <View style={styles.mapPlaceholder}>
                  <MaterialCommunityIcons
                    name="map-marker-off"
                    size={32}
                    color="#B45309"
                  />
                  <Text style={styles.mapErrorText}>Map unavailable</Text>
                  <Text style={styles.mapErrorCoords}>
                    {targetLat.toFixed(5)}, {targetLng.toFixed(5)}
                  </Text>
                </View>
              )}

              {/* Google / OSM Static Map Image */}
              <Image
                source={{ uri: staticMapUrl }}
                style={[
                  styles.mapImage,
                  (!mapLoaded || mapError) && styles.hidden,
                ]}
                resizeMode="cover"
                onLoad={() => setMapLoaded(true)}
                onError={() => {
                  setMapLoaded(true);
                  setMapError(true);
                }}
              />

              {/* Dark gradient vignette over the map */}
              {mapLoaded && !mapError && (
                <View style={styles.mapVignette} pointerEvents="none" />
              )}

              {/* Glowing treasure pin overlay (center) */}
              {mapLoaded && !mapError && (
                <View style={styles.centerPinWrapper} pointerEvents="none">
                  <View style={styles.radarPulse} />
                  <View style={styles.markerCircle}>
                    <MaterialCommunityIcons
                      name="treasure-chest"
                      size={22}
                      color="#E1BF62"
                    />
                  </View>
                  <View style={styles.pinLabelPill}>
                    <Text style={styles.pinLabelText} numberOfLines={1}>
                      {localizedLocation}
                    </Text>
                  </View>
                </View>
              )}

              {/* GPS status pill */}
              <View
                style={[styles.gpsPill, isRTL && styles.gpsPillRTL]}
                pointerEvents="none"
              >
                <View style={styles.greenLiveDot} />
                <Text style={styles.gpsText}>GPS ACTIVE • CACHE REVEALED</Text>
              </View>

              {/* Tap to open hint */}
              {mapLoaded && !mapError && (
                <View style={styles.tapHint} pointerEvents="none">
                  <Feather name="external-link" size={11} color="#FFFDF7" />
                  <Text style={styles.tapHintText}>TAP TO OPEN IN MAPS</Text>
                </View>
              )}
            </>
          )}
        </TouchableOpacity>

        {/* ── Coordinates Details Card ── */}
        <View style={[styles.detailsCard, isRTL && styles.rowReverse]}>
          <View style={styles.compassBox}>
            <MaterialCommunityIcons
              name="compass-rose"
              size={32}
              color={colors.primaryGreen}
            />
          </View>
          <View style={[styles.coordsTextCol, isRTL && styles.alignRight]}>
            <Text style={[styles.coordsLabel, isRTL && styles.textRight]}>
              {language === "ar" ? "الإحداثيات الدقيقة" : "FIELD COORDINATES"}
            </Text>
            <Text style={[styles.coordsValue, isRTL && styles.textRight]}>
              {coordinatesString}
            </Text>
            <Text style={[styles.coordsSub, isRTL && styles.textRight]}>
              {localizedTitle} • {language === "ar" ? "المرحلة الثانية: موقع الكنز الحقيقي" : "Stage 2 Treasure Cache"}
            </Text>
          </View>
        </View>

        {/* ── Lat / Lng Chip Row ── */}
        <View style={[styles.chipRow, isRTL && styles.rowReverse]}>
          <View style={styles.chip}>
            <Text style={styles.chipLabel}>LAT</Text>
            <Text style={styles.chipValue}>{targetLat.toFixed(6)}</Text>
          </View>
          <View style={styles.chipDivider} />
          <View style={styles.chip}>
            <Text style={styles.chipLabel}>LNG</Text>
            <Text style={styles.chipValue}>{targetLng.toFixed(6)}</Text>
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={handleOpenMaps}
            activeOpacity={0.88}
            style={[styles.openMapsButton, isRTL && styles.rowReverse]}
          >
            <Feather name="map-pin" size={17} color={colors.surfaceWhite} />
            <Text style={styles.openMapsText}>{t("openInMaps")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onConfirmFind}
            activeOpacity={0.88}
            style={[styles.confirmFindButton, isRTL && styles.rowReverse]}
          >
            <Feather name="camera" size={16} color="#103B30" />
            <Text style={styles.confirmFindText}>
              {language === "ar"
                ? "أنا في الموقع • تأكيد الكنز"
                : "I'M HERE • CONFIRM THE FIND"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.parchmentLight,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 40,
    alignItems: "center",
  },

  // ── Web Map Wrapper
  webMapWrapper: {
    width: "100%",
    height: MAP_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  webLocationLabel: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  webLocationLabelText: {
    backgroundColor: "rgba(16, 59, 48, 0.88)",
    color: "#E1BF62",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: "hidden",
  },

  // ── Header
  headerSection: {
    width: "100%",
    maxWidth: 420,
    marginBottom: 20,
  },
  alignRight: { alignItems: "flex-end" },
  rowReverse: { flexDirection: "row-reverse" },
  textRight: { textAlign: "right" },
  stageLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#B45309",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: fonts.frauncesBold,
    color: "#0F382E",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: "#5C6B64",
  },

  // ── Map Card
  mapCard: {
    width: "100%",
    maxWidth: 420,
    height: MAP_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1.5,
    borderColor: "#E6DEC9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 7,
    marginBottom: 16,
    backgroundColor: "#E9E5DA",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  hidden: {
    opacity: 0,
    position: "absolute",
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDE9DE",
    gap: 8,
  },
  mapLoadingText: {
    fontSize: 12,
    color: "#8A9E96",
    fontWeight: "600",
  },
  mapErrorText: {
    fontSize: 13,
    color: "#B45309",
    fontWeight: "700",
    marginTop: 4,
  },
  mapErrorCoords: {
    fontSize: 11,
    color: "#6B7280",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  mapVignette: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(13, 40, 35, 0.28)",
  },

  // ── Pin Overlay
  centerPinWrapper: {
    position: "absolute",
    top: "38%",
    left: "50%",
    transform: [{ translateX: -40 }, { translateY: -40 }],
    alignItems: "center",
    justifyContent: "center",
  },
  radarPulse: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(225, 191, 98, 0.28)",
    borderWidth: 1.5,
    borderColor: "rgba(225, 191, 98, 0.6)",
  },
  markerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#103B30",
    borderWidth: 2,
    borderColor: "#E1BF62",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  pinLabelPill: {
    marginTop: 6,
    backgroundColor: colors.surfaceWhite,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  pinLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F382E",
  },

  // ── GPS Pill
  gpsPill: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "rgba(9, 29, 25, 0.82)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gpsPillRTL: { left: undefined, right: 14 },
  greenLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },
  gpsText: {
    color: "#FFFDF7",
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // ── Tap hint
  tapHint: {
    position: "absolute",
    bottom: 12,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(9, 29, 25, 0.72)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tapHintText: {
    color: "#FFFDF7",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  // ── Details Card
  detailsCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surfaceWhite,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#ECE8DC",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  compassBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F4EFE2",
    alignItems: "center",
    justifyContent: "center",
  },
  coordsTextCol: { flex: 1 },
  coordsLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B45309",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  coordsValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F382E",
    fontFamily: Platform.OS === "ios" ? "Courier-Bold" : "monospace",
    letterSpacing: 0.5,
  },
  coordsSub: {
    fontSize: 11.5,
    color: "#6B7280",
    marginTop: 2,
  },

  // ── Lat/Lng Chip Row
  chipRow: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    backgroundColor: colors.surfaceWhite,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECE8DC",
    marginBottom: 24,
    overflow: "hidden",
  },
  chip: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  chipDivider: {
    width: 1,
    backgroundColor: "#ECE8DC",
    marginVertical: 10,
  },
  chipLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#B45309",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  chipValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F382E",
    fontFamily: Platform.OS === "ios" ? "Courier-Bold" : "monospace",
  },

  // ── Action Buttons
  actionsContainer: {
    width: "100%",
    maxWidth: 420,
    gap: 12,
  },
  openMapsButton: {
    backgroundColor: "#103B30",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#103B30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  openMapsText: {
    color: colors.surfaceWhite,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  confirmFindButton: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#103B30",
  },
  confirmFindText: {
    color: "#103B30",
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
});
