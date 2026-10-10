import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  PanResponder,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { useLanguage } from "../i18n/LanguageContext";

interface CipherWheelProps {
  columns?: number;
  initialSequence?: string;
  targetSequence?: string;
  isPreview?: boolean;
  isLandscape?: boolean;
  onSolved?: () => void;
  onSequenceChange?: (seq: string) => void;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const STEP_HEIGHT = 27; // Compact mechanical step height (3 * 27 = 81px cylinder)
const CYLINDER_HEIGHT = STEP_HEIGHT * 3; // 81px

interface TumblerImperativeHandle {
  spin: (direction: "up" | "down") => void;
}

interface CryptexTumblerProps {
  index: number;
  letter: string;
  targetLetter?: string;
  isPreview?: boolean;
  tumblerWidth?: number;
  onStep: (index: number, direction: "up" | "down") => void;
  registerHandle?: (
    index: number,
    handle: TumblerImperativeHandle | null,
  ) => void;
}

// Single rotating cylindrical tumbler with 3D mechanical roll animation
const CryptexTumbler: React.FC<CryptexTumblerProps> = ({
  index,
  letter,
  targetLetter,
  isPreview = false,
  tumblerWidth,
  onStep,
  registerHandle,
}) => {
  const animY = useRef(new Animated.Value(0)).current;
  const isSpinning = useRef(false);
  const isLock = isPreview && letter === "LOCK";
  const isCompact = typeof tumblerWidth === "number" && tumblerWidth < 40;
  const isUltraCompact = typeof tumblerWidth === "number" && tumblerWidth < 32;
  // Disabled live character revealing to prevent brute-force guessing
  const isMatched = false;

  const spin = (direction: "up" | "down") => {
    if (isPreview || isSpinning.current) return;
    isSpinning.current = true;

    try {
      Haptics.selectionAsync();
    } catch {
      // safe fallback
    }

    // Direction "down" means advancing to next letter (strip scrolls up by -STEP_HEIGHT)
    // Direction "up" means returning to previous letter (strip scrolls down by +STEP_HEIGHT)
    const targetOffset = direction === "down" ? -STEP_HEIGHT : STEP_HEIGHT;

    Animated.timing(animY, {
      toValue: targetOffset,
      duration: 170,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      animY.setValue(0);
      isSpinning.current = false;
      onStep(index, direction);
    });
  };

  useEffect(() => {
    if (registerHandle) {
      registerHandle(index, { spin });
    }
    return () => {
      if (registerHandle) registerHandle(index, null);
    };
  }, [index, registerHandle, letter]);

  // Touch gesture responder for swiping directly on the barrel
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isPreview,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        !isPreview && Math.abs(gestureState.dy) > 4,
      onPanResponderRelease: (_, gestureState) => {
        if (isPreview) return;
        if (gestureState.dy < -10) {
          spin("down"); // swipe up -> roll to next letter
        } else if (gestureState.dy > 10) {
          spin("up"); // swipe down -> roll to prev letter
        }
      },
    }),
  ).current;

  // Build the 5-letter vertical strip for the continuous seamless drum roll
  const currIdx = ALPHABET.indexOf(letter);
  const safeIdx = currIdx === -1 ? 0 : currIdx;

  const p2 = ALPHABET[(safeIdx - 2 + 26) % 26];
  const p1 = ALPHABET[(safeIdx - 1 + 26) % 26];
  const curr = ALPHABET[safeIdx];
  const n1 = ALPHABET[(safeIdx + 1) % 26];
  const n2 = ALPHABET[(safeIdx + 2) % 26];

  return (
    <View
      style={[
        styles.tumblerWrapper,
        tumblerWidth ? { width: tumblerWidth } : null,
      ]}
      {...panResponder.panHandlers}
      // Web mouse wheel support
      {...(Platform.OS === "web"
        ? {
            onWheel: (e: any) => {
              if (isPreview) return;
              if (e.deltaY > 0) {
                spin("down");
              } else if (e.deltaY < 0) {
                spin("up");
              }
            },
          }
        : {})}
    >
      <View
        style={[
          styles.tumblerBarrel,
          tumblerWidth ? { width: tumblerWidth } : null,
          isLock && styles.tumblerBarrelLocked,
        ]}
      >
        {isLock ? (
          // Locked State (as in Image 3 with antique cryptex styling)
          <View style={styles.lockContainer}>
            <Text style={styles.neighborLetterDim}>•</Text>
            <View style={styles.letterFrameBorder} />
            <View style={styles.brassLockSeal}>
              <LinearGradient
                colors={["#F8EBC6", "#D5B462", "#8E6F25"]}
                style={styles.brassLockInner}
              >
                <Ionicons name="lock-closed" size={16} color="#261B09" />
              </LinearGradient>
            </View>
            <View style={styles.letterFrameBorder} />
            <Text style={styles.neighborLetterDim}>•</Text>
          </View>
        ) : (
          // Animated letter ribbon
          <Animated.View
            style={[
              styles.letterRibbon,
              {
                transform: [{ translateY: animY }],
              },
            ]}
          >
            {/* Prev 2 */}
            <View style={styles.ribbonItemFar}>
              <Text style={styles.neighborLetterSmall}>{p2}</Text>
              <View style={styles.grooveLine} />
            </View>

            {/* Prev 1 */}
            <View style={styles.ribbonItemNeighbor}>
              <Text
                style={[
                  styles.neighborLetter,
                  isCompact && styles.neighborLetterCompact,
                  isUltraCompact && styles.neighborLetterUltraCompact,
                ]}
              >
                {p1}
              </Text>
              <View style={styles.grooveLine} />
            </View>

            {/* Current Active */}
            <View style={styles.ribbonItemActive}>
              <View style={styles.letterFrameBorder} />
              <Text
                style={[
                  styles.activeLetterText,
                  isCompact && styles.activeLetterTextCompact,
                  isUltraCompact && styles.activeLetterTextUltraCompact,
                ]}
              >
                {curr}
              </Text>
              <View style={styles.letterFrameBorder} />
            </View>

            {/* Next 1 */}
            <View style={styles.ribbonItemNeighbor}>
              <View style={styles.grooveLine} />
              <Text
                style={[
                  styles.neighborLetter,
                  isCompact && styles.neighborLetterCompact,
                  isUltraCompact && styles.neighborLetterUltraCompact,
                ]}
              >
                {n1}
              </Text>
            </View>

            {/* Next 2 */}
            <View style={styles.ribbonItemFar}>
              <View style={styles.grooveLine} />
              <Text style={styles.neighborLetterSmall}>{n2}</Text>
            </View>
          </Animated.View>
        )}

        {/* 3D Cylindrical lighting & reflection overlay */}
        <LinearGradient
          colors={[
            "rgba(35, 24, 11, 0.72)",
            "rgba(255, 255, 255, 0.45)",
            "rgba(255, 255, 255, 0.05)",
            "rgba(0, 0, 0, 0.05)",
            "rgba(20, 13, 5, 0.78)",
          ]}
          locations={[0, 0.18, 0.5, 0.75, 1]}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />

        {/* Subtle brass edge bevels */}
        <View style={styles.tumblerEdgeLeft} />
        <View style={styles.tumblerEdgeRight} />
      </View>
    </View>
  );
};

export const CipherWheel: React.FC<CipherWheelProps> = ({
  columns = 5,
  initialSequence = "AAAAA",
  targetSequence = "MALES",
  isPreview = false,
  isLandscape: propIsLandscape,
  onSolved,
  onSequenceChange,
}) => {
  const { t, isRTL, language } = useLanguage();
  const { width, height } = useWindowDimensions();
  const isPhysicallyWide = width > height;
  const isLandscape =
    propIsLandscape !== undefined
      ? propIsLandscape
      : isPhysicallyWide;

  // In landscape mode (or when >5 columns auto-landscape), use full horizontal span
  const effectiveWidth = isLandscape ? Math.max(width, height) : width;

  // Responsive fluid sizing for cryptex dials
  const totalCols = columns || 5;
  const isFiveDialPreview = isPreview && totalCols <= 5;
  const availableContentWidth = isFiveDialPreview
    ? Math.min(width, 480) - 48
    : (isLandscape ? effectiveWidth : width) - (isLandscape ? 32 : 16);

  let tumblerWidth: number;
  let endCapWidth: number;
  let separatorWidth: number;

  if (isFiveDialPreview) {
    tumblerWidth = Math.max(
      38,
      Math.min(48, Math.floor((availableContentWidth - 88) / 5)),
    );
    endCapWidth = Math.max(
      32,
      Math.min(48, Math.floor(tumblerWidth * 0.92)),
    );
    separatorWidth = tumblerWidth < 46 ? 3 : 4;
  } else if (totalCols > 5) {
    if (isLandscape) {
      const availableForTumblers = availableContentWidth - 36;
      const computedWidth = Math.floor(availableForTumblers / (totalCols + 1.6));
      tumblerWidth = Math.max(34, Math.min(52, computedWidth));
      endCapWidth = Math.max(24, Math.min(42, Math.floor(tumblerWidth * 0.85)));
      separatorWidth = 2.5;
    } else {
      // In portrait: user-friendly comfortable dials with smooth horizontal swiping
      tumblerWidth = 46;
      endCapWidth = 32;
      separatorWidth = 3;
    }
  } else {
    // For 5 columns or less in portrait, fill full screen width with clean safe margins
    const maxAllowedWidth = Math.min(width, 480);
    const contentWidth = maxAllowedWidth - 16; // 8px safe margin on each side
    const totalSeparators = Math.max(0, totalCols - 1);
    const totalSeparatorsWidth = totalSeparators * 3;
    const availableForDialsAndCaps = contentWidth - totalSeparatorsWidth;
    // Ratio of each endcap to dial width = 0.68
    const computedTumbler = Math.floor(
      availableForDialsAndCaps / (totalCols + 2 * 0.68),
    );
    tumblerWidth = Math.max(38, Math.min(64, computedTumbler));
    endCapWidth = Math.max(24, Math.min(44, Math.floor(tumblerWidth * 0.68)));
    separatorWidth = 3;
  }

  // Exact sub-element widths inside endcaps so sum === endCapWidth exactly without scaling artifacts
  const tipW = Math.max(8, Math.round(endCapWidth * 0.28));
  const ringW = Math.max(6, Math.round(endCapWidth * 0.22));
  const collarW = Math.max(10, endCapWidth - tipW - ringW);

  // Calculate physical cryptex track width
  const cryptexTrackWidth =
    endCapWidth * 2 +
    totalCols * tumblerWidth +
    Math.max(0, totalCols - 1) * separatorWidth;
  const shouldCenter = effectiveWidth >= cryptexTrackWidth || isFiveDialPreview;

  const getInitialLetters = (): string[] => {
    if (isPreview) {
      if (columns > 5) {
        const res: string[] = [];
        for (let i = 0; i < columns; i++) {
          if (i === 2 || i === 7) {
            res.push("LOCK");
          } else {
            res.push(ALPHABET[i % ALPHABET.length]);
          }
        }
        return res;
      }
      return ["M", "A", "LOCK", "L", "E"];
    }
    const safeInitial = (initialSequence || "")
      .padEnd(columns, "A")
      .slice(0, columns);
    return safeInitial.split("");
  };

  const [letters, setLetters] = useState<string[]>(getInitialLetters);
  const tumblerHandles = useRef<Map<number, TumblerImperativeHandle>>(
    new Map(),
  );
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Whenever columns change, sequence changes, or window resizes, snap to offset 0 so Dial 1 and left cap are never cut off
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: 0, animated: false });
    }, 40);
    return () => clearTimeout(timer);
  }, [columns, initialSequence, width]);

  const registerHandle = (
    index: number,
    handle: TumblerImperativeHandle | null,
  ) => {
    if (handle) {
      tumblerHandles.current.set(index, handle);
    } else {
      tumblerHandles.current.delete(index);
    }
  };

  useEffect(() => {
    if (!isPreview) {
      const safeInitial = (initialSequence || "")
        .padEnd(columns, "A")
        .slice(0, columns);
      setLetters(safeInitial.split(""));
    } else {
      setLetters(getInitialLetters());
    }
  }, [columns, initialSequence, isPreview]);

  useEffect(() => {
    if (!isPreview) {
      const currentSeq = letters.join("");
      onSequenceChange?.(currentSeq);
    }
  }, [letters]);

  // Called after animation finishes
  const handleStepComplete = (index: number, direction: "up" | "down") => {
    setLetters((prev) => {
      const next = [...prev];
      const currentChar = next[index];
      const currentIndex = ALPHABET.indexOf(currentChar);
      const safeIndex = currentIndex === -1 ? 0 : currentIndex;

      let nextIndex = direction === "up" ? safeIndex - 1 : safeIndex + 1;
      if (nextIndex < 0) nextIndex = ALPHABET.length - 1;
      if (nextIndex >= ALPHABET.length) nextIndex = 0;

      next[index] = ALPHABET[nextIndex];
      return next;
    });
  };

  const handleButtonPress = (index: number, direction: "up" | "down") => {
    const handle = tumblerHandles.current.get(index);
    if (handle) {
      handle.spin(direction);
    } else {
      handleStepComplete(index, direction);
    }
  };

  return (
    <View style={[styles.wrapper, isLandscape && styles.wrapperLandscape]}>
      {/* Visual Swipe Hint only when dials overflow screen */}
      {letters.length > 5 && !shouldCenter && (
        <View style={styles.scrollHintRow}>
          <TouchableOpacity
            onPress={() =>
              scrollRef.current?.scrollTo({ x: 0, animated: true })
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.hintChevronButton}
          >
            <Ionicons name="chevron-back" size={14} color="#A8863A" />
          </TouchableOpacity>
          <Text style={styles.scrollHintText}>
            {language === "ar"
              ? `مرر لعرض جميع الأقراص (${letters.length})`
              : `SWIPE TO VIEW ALL ${letters.length} DIALS`}
          </Text>
          <TouchableOpacity
            onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.hintChevronButton}
          >
            <Ionicons name="chevron-forward" size={14} color="#A8863A" />
          </TouchableOpacity>
        </View>
      )}

      {/* Horizontal Scroll for long Cryptex (10 / 15 columns) with hidden native scrollbar */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={totalCols > 5}
        style={[
          styles.scrollViewContainer,
          Platform.OS === "web"
            ? ({
                overflowX: totalCols <= 5 ? "hidden" : "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              } as any)
            : null,
        ]}
        contentContainerStyle={[
          styles.horizontalScrollContent,
          isFiveDialPreview || totalCols <= 5 || shouldCenter
            ? [styles.scrollCenterContent, { paddingHorizontal: 0, paddingLeft: 0, paddingRight: 0 }] 
            : styles.scrollLeftContent,
        ]}
        bounces={true}
        scrollEventThrottle={16}
      >
        <View
          style={[
            styles.cryptexTrack,
            shouldCenter ? styles.cryptexTrackCenter : styles.cryptexTrackStart,
          ]}
        >
          {/* Brass Column Number Badges [1]..[N] - Perfectly aligned with tumblers */}
          <View style={styles.columnHeaderRow}>
            <View style={[styles.endCapSpacer, { width: endCapWidth }]} />
            <View
              style={styles.columnCellsContainer}
            >
              {letters.map((_, i) => (
                <React.Fragment key={`badge-${i}`}>
                  {i > 0 && (
                    <View
                      style={[
                        styles.columnSeparatorSpacer,
                        { width: separatorWidth },
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.columnBadgeCell,
                      { width: tumblerWidth },
                    ]}
                  >
                    <View
                      style={[
                        styles.numberBadge,
                        tumblerWidth < 40 && styles.numberBadgeCompact,
                      ]}
                    >
                      <LinearGradient
                        colors={["#D8BA70", "#9B762D", "#6F501A"]}
                        style={styles.numberBadgeGradient}
                      >
                        <Text
                          style={[
                            styles.numberBadgeText,
                            tumblerWidth < 40 && styles.numberBadgeTextCompact,
                          ]}
                        >
                          {i + 1}
                        </Text>
                      </LinearGradient>
                    </View>
                  </View>
                </React.Fragment>
              ))}
            </View>
            <View style={[styles.endCapSpacer, { width: endCapWidth }]} />
          </View>

          {/* Up Chevrons Row (UP BUTTONS) for interactive smooth rotation */}
          {!isPreview && (
            <View style={styles.controlsRow}>
              <View style={[styles.endCapSpacer, { width: endCapWidth }]} />
              <View
                style={styles.columnCellsContainer}
              >
                {letters.map((_, index) => (
                  <React.Fragment key={`up-${index}`}>
                    {index > 0 && (
                      <View
                        style={[
                          styles.columnSeparatorSpacer,
                          { width: separatorWidth },
                        ]}
                      />
                    )}
                    <View style={[styles.controlCell, { width: tumblerWidth }]}>
                      <TouchableOpacity
                        onPress={() => handleButtonPress(index, "up")}
                        activeOpacity={0.6}
                        style={styles.arrowButton}
                        hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                      >
                        <Ionicons
                          name="chevron-up"
                          size={tumblerWidth < 40 ? 15 : 20}
                          color={colors.brassDark}
                        />
                      </TouchableOpacity>
                    </View>
                  </React.Fragment>
                ))}
              </View>
              <View style={[styles.endCapSpacer, { width: endCapWidth }]} />
            </View>
          )}

          {/* 3D CRYPTEX CYLINDER ASSEMBLY */}
          <View style={styles.cryptexAssembly}>
            {/* Left Endcap (Brass cone, stepped rings, ornate filigree & alignment arrow) */}
            <View style={[styles.endCapLeft, { width: endCapWidth }]}>
              <LinearGradient
                colors={["#A8863A", "#654C1C", "#392A0E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.coneTip, { width: tipW }]}
              />

              <View style={[styles.steppedRingOuter, { width: ringW }]}>
                <LinearGradient
                  colors={["#E3C77F", "#8E6E2D", "#4B3712"]}
                  style={styles.steppedRingInner}
                />
              </View>

              <View style={[styles.collarBody, { width: collarW }]}>
                <LinearGradient
                  colors={["#B79549", "#7D5F23", "#4A3611"]}
                  style={styles.collarGradient}
                >
                  <View style={styles.filigreeGroove} />
                  <View style={styles.filigreeGroove} />
                </LinearGradient>

                <View style={styles.indicatorLeft}>
                  <View style={styles.triangleRight} />
                </View>
              </View>
            </View>

            {/* Central Cylindrical Rotating Tumbler Rings */}
            <View style={styles.cryptexBody}>
              {letters.map((letter, index) => (
                <React.Fragment key={`dial-${index}`}>
                  {/* Brass separator rim between dials */}
                  {index > 0 && (
                    <View
                      style={[styles.dialSeparator, { width: separatorWidth }]}
                    >
                      <LinearGradient
                        colors={["#3D2C0C", "#C5A55B", "#7E5E22", "#2B1D06"]}
                        style={StyleSheet.absoluteFill}
                      />
                    </View>
                  )}

                  {/* Tumbler Column with smooth Y-scroll animation */}
                  <CryptexTumbler
                    index={index}
                    letter={letter}
                    targetLetter={targetSequence?.[index]}
                    isPreview={isPreview}
                    tumblerWidth={tumblerWidth}
                    onStep={handleStepComplete}
                    registerHandle={registerHandle}
                  />
                </React.Fragment>
              ))}
            </View>

            {/* Right Endcap (Brass collar, alignment arrow, stepped brass rims) */}
            <View style={[styles.endCapRight, { width: endCapWidth }]}>
              <View style={[styles.collarBody, { width: collarW }]}>
                <LinearGradient
                  colors={["#B79549", "#7D5F23", "#4A3611"]}
                  style={styles.collarGradient}
                >
                  <View style={styles.filigreeGroove} />
                  <View style={styles.filigreeGroove} />
                </LinearGradient>

                <View style={styles.indicatorRight}>
                  <View style={styles.triangleLeft} />
                </View>
              </View>

              <View style={[styles.steppedRingOuter, { width: ringW }]}>
                <LinearGradient
                  colors={["#E3C77F", "#8E6E2D", "#4B3712"]}
                  style={styles.steppedRingInner}
                />
              </View>

              <LinearGradient
                colors={["#A8863A", "#654C1C", "#392A0E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.rightCapTrim, { width: tipW }]}
              />
            </View>
          </View>

          {/* Down Chevrons Row (DOWN BUTTONS) for interactive smooth rotation */}
          {!isPreview && (
            <View style={styles.controlsRow}>
              <View style={[styles.endCapSpacer, { width: endCapWidth }]} />
              <View
                style={styles.columnCellsContainer}
              >
                {letters.map((_, index) => (
                  <React.Fragment key={`down-${index}`}>
                    {index > 0 && (
                      <View
                        style={[
                          styles.columnSeparatorSpacer,
                          { width: separatorWidth },
                        ]}
                      />
                    )}
                    <View style={[styles.controlCell, { width: tumblerWidth }]}>
                      <TouchableOpacity
                        onPress={() => handleButtonPress(index, "down")}
                        activeOpacity={0.6}
                        style={styles.arrowButton}
                        hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                      >
                        <Ionicons
                          name="chevron-down"
                          size={tumblerWidth < 40 ? 15 : 20}
                          color={colors.brassDark}
                        />
                      </TouchableOpacity>
                    </View>
                  </React.Fragment>
                ))}
              </View>
              <View style={[styles.endCapSpacer, { width: endCapWidth }]} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Active Sequence Display Footer */}
      {!isPreview && (
        <View
          style={[
            styles.sequenceFooter,
            isLandscape && styles.sequenceFooterLandscape,
          ]}
        >
          <View
            style={[
              styles.dividerLine,
              isLandscape && styles.dividerLineLandscape,
            ]}
          />
          <Text
            style={[
              styles.sequenceLabel,
              isLandscape && styles.sequenceLabelLandscape,
            ]}
          >
            {t("currentSequence")}
          </Text>
          <View style={styles.sequenceContainer}>
            {/* Always rendered in a SINGLE continuous horizontal row [1] [2] ... [N] */}
            <View
              style={[
                styles.sequenceDisplayRow,
                letters.length > 5 && styles.sequenceDisplayRowCompact,
                letters.length > 10 && styles.sequenceDisplayRowUltraCompact,
                isRTL && styles.rowReverse,
              ]}
            >
              {letters.map((char, globalIdx) => {
                return (
                  <View
                    key={`seq-char-${globalIdx}`}
                    style={[
                      styles.seqCharBox,
                      letters.length > 5 && styles.seqCharBoxMedium,
                      letters.length > 10 && styles.seqCharBoxCompact,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sequenceChar,
                        letters.length > 5 && styles.sequenceCharMedium,
                        letters.length > 10 && styles.sequenceCharCompact,
                      ]}
                    >
                      {char}
                    </Text>
                    {letters.length > 5 && (
                      <Text
                        style={[
                          styles.seqIndexSub,
                          letters.length > 10 && styles.seqIndexSubCompact,
                        ]}
                      >
                        {globalIdx + 1}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginVertical: 14,
    width: "100%",
    maxWidth: "100%",
  },
  scrollViewContainer: {
    width: "100%",
    maxWidth: "100%",
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  columnHeaderRow: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  columnCellsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  endCapSpacer: {
    width: 48,
  },
  columnBadgeCell: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  columnSeparatorSpacer: {
    width: 4,
  },
  numberBadge: {
    width: 24,
    height: 22,
    borderRadius: 5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  numberBadgeGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F4E0A5",
    borderRadius: 5,
  },
  numberBadgeText: {
    color: "#FFFDF7",
    fontSize: 12,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "Courier-Bold" : "monospace",
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  controlCell: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowButton: {
    width: "100%",
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  // 3D Cryptex Assembly Container
  cryptexAssembly: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },

  // Left Endcap (Sleek 81px compact height)
  endCapLeft: {
    flexDirection: "row",
    alignItems: "center",
    height: CYLINDER_HEIGHT,
    overflow: "hidden",
  },
  coneTip: {
    width: 12,
    height: 28,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    borderWidth: 1,
    borderColor: "#CDB67F",
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  steppedRingOuter: {
    width: 8,
    height: 58,
    backgroundColor: "#3A280D",
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#CDB67F",
  },
  steppedRingInner: {
    flex: 1,
  },
  collarBody: {
    width: 18,
    height: CYLINDER_HEIGHT,
    backgroundColor: "#634B1D",
    borderWidth: 1,
    borderColor: "#D9C187",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  collarGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  filigreeGroove: {
    width: "70%",
    height: 2,
    backgroundColor: "#2B1D06",
    borderRadius: 1,
    opacity: 0.6,
  },
  indicatorLeft: {
    position: "absolute",
    right: 1,
    zIndex: 10,
  },
  triangleRight: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderBottomWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: "#F7DF94",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderTopColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
  },

  // Central Cylinder Dials
  cryptexBody: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#20170A",
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: "#886828",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  dialSeparator: {
    width: 3,
    height: CYLINDER_HEIGHT,
    position: "relative",
    overflow: "hidden",
  },
  tumblerWrapper: {
    position: "relative",
    cursor: Platform.OS === "web" ? "pointer" : "auto",
  },
  tumblerBarrel: {
    width: 48,
    height: CYLINDER_HEIGHT,
    backgroundColor: "#F7F5EE",
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  tumblerBarrelLocked: {
    backgroundColor: "#EDE7D9",
  },
  tumblerEdgeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#A7863C",
  },
  tumblerEdgeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#563F12",
  },

  // Continuous Ribbon for smooth scrolling
  letterRibbon: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  ribbonItemFar: {
    height: STEP_HEIGHT,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.25,
  },
  ribbonItemNeighbor: {
    height: STEP_HEIGHT,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.5,
  },
  ribbonItemActive: {
    height: STEP_HEIGHT,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  neighborLetter: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
    color: "#2C2314",
    fontFamily: fonts.frauncesBold,
  },
  neighborLetterSmall: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "600",
    color: "#2C2314",
    fontFamily: fonts.frauncesSemiBold,
  },
  neighborLetterDim: {
    fontSize: 14,
    color: "#7D6B4E",
    fontWeight: "700",
    marginVertical: 2,
  },
  grooveLine: {
    width: "80%",
    height: 1,
    backgroundColor: "#2E2415",
    opacity: 0.35,
  },
  letterFrameBorder: {
    width: "90%",
    height: 1.5,
    backgroundColor: "#181A1B",
    opacity: 0.85,
  },
  activeLetterText: {
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "900",
    color: "#181A1B",
    fontFamily: fonts.frauncesBlack,
    letterSpacing: 0.5,
    marginVertical: 0,
  },

  // Lock State Styles
  lockContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  brassLockSeal: {
    width: 28,
    height: 28,
    borderRadius: 14,
    padding: 2,
    marginVertical: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
  brassLockInner: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFF2CD",
  },

  // Right Endcap (81px height)
  endCapRight: {
    flexDirection: "row",
    alignItems: "center",
    height: CYLINDER_HEIGHT,
    overflow: "hidden",
  },
  indicatorRight: {
    position: "absolute",
    left: 1,
    zIndex: 10,
  },
  triangleLeft: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderRightWidth: 8,
    borderLeftWidth: 0,
    borderBottomWidth: 5,
    borderTopWidth: 5,
    borderRightColor: "#F7DF94",
    borderLeftColor: "transparent",
    borderBottomColor: "transparent",
    borderTopColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: -1, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
  },
  rightCapTrim: {
    width: 12,
    height: 66,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    borderWidth: 1,
    borderColor: "#CDB67F",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },

  // Active sequence display
  sequenceFooter: {
    width: "100%",
    alignItems: "center",
    marginTop: 14,
  },
  sequenceFooterLandscape: {
    marginTop: 6,
    marginBottom: 2,
  },
  dividerLine: {
    width: "80%",
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginBottom: 12,
  },
  dividerLineLandscape: {
    marginBottom: 6,
    width: "60%",
  },
  sequenceLabel: {
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.textMuted,
    marginBottom: 8,
  },
  sequenceLabelLandscape: {
    marginBottom: 4,
    fontSize: 9,
  },
  seqCharBox: {
    minWidth: 32,
    minHeight: 38,
    borderRadius: 6,
    backgroundColor: colors.parchmentDark,
    borderWidth: 1.5,
    borderColor: colors.brassBorder,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  seqCharBoxMedium: {
    minWidth: 26,
    minHeight: 34,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 5,
  },
  seqCharBoxCompact: {
    minWidth: 20,
    minHeight: 28,
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sequenceChar: {
    fontSize: 16,
    fontWeight: "800",
    color: "#374151",
    fontFamily: fonts.frauncesBold,
  },
  sequenceCharMedium: {
    fontSize: 13,
  },
  sequenceCharCompact: {
    fontSize: 11,
  },
  seqIndexSub: {
    fontSize: 8,
    color: "#8C7A5B",
    marginTop: 1,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  seqIndexSubCompact: {
    fontSize: 7,
    marginTop: 0,
  },
  horizontalScrollContent: {
    paddingLeft: 16,
    paddingRight: 24,
    paddingBottom: 14,
    paddingTop: 4,
  },
  scrollCenterContent: {
    justifyContent: "center",
    alignItems: "center",
    minWidth: "100%",
  },
  scrollLeftContent: {
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  cryptexTrack: {
    alignItems: "center",
  },
  cryptexTrackCenter: {
    alignItems: "center",
    alignSelf: "center",
  },
  cryptexTrackStart: {
    alignItems: "flex-start",
    alignSelf: "flex-start",
  },
  wrapperLandscape: {
    marginVertical: 4,
  },
  scrollHintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 2,
    marginBottom: 6,
    opacity: 0.9,
  },
  hintChevronButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  scrollHintText: {
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Courier-Bold" : "monospace",
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#8E6E2D",
  },
  sequenceContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sequenceDisplayRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    flexWrap: "nowrap",
  },
  sequenceDisplayRowCompact: {
    gap: 5,
  },
  sequenceDisplayRowUltraCompact: {
    gap: 3,
  },
  activeLetterTextCompact: {
    fontSize: 16,
    letterSpacing: 0,
  },
  activeLetterTextUltraCompact: {
    fontSize: 13,
    letterSpacing: 0,
  },
  neighborLetterCompact: {
    fontSize: 10.5,
  },
  neighborLetterUltraCompact: {
    fontSize: 9,
  },
  numberBadgeCompact: {
    width: 20,
    height: 19,
    borderRadius: 4,
  },
  numberBadgeTextCompact: {
    fontSize: 9,
  },
});
