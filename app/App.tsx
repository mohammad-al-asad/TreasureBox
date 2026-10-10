import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, LogBox, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_800ExtraBold,
  Fraunces_900Black,
} from "@expo-google-fonts/fraunces";
import { Ionicons } from "@expo/vector-icons";

import { LanguageProvider } from "./src/i18n/LanguageContext";
import { HunterProvider, useHunter } from "./src/context/HunterContext";
import { colors } from "./src/theme/colors";

import { CatalogScreen } from "./src/screens/CatalogScreen";
import { HuntDetailScreen } from "./src/screens/HuntDetailScreen";
import { CheckoutScreen } from "./src/screens/CheckoutScreen";
import { ExpeditionScreen } from "./src/screens/ExpeditionScreen";
import { CipherSolvedScreen } from "./src/screens/CipherSolvedScreen";
import { ConfirmFindScreen } from "./src/screens/ConfirmFindScreen";
import { CompletedScreen } from "./src/screens/CompletedScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { LegalContentScreen } from "./src/screens/LegalContentScreen";
import { SplashScreen } from "./src/screens/SplashScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { LocationMapScreen } from "./src/screens/LocationMapScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { SidebarDrawer } from "./src/components/SidebarDrawer";
import { Hunt, ScreenName, UserProfile } from "./src/types/hunt";
import {
  hunterApi,
  getTokenFromStorage,
  getUserFromStorage,
  setUserInStorage,
} from "./src/services/api";
import { AlertModal } from "./src/components/AlertModal";
import { playTreasureUnlockSound } from "./src/utils/audio";

// Top-level environment log handlers & platform specific warning suppressions
LogBox.ignoreLogs([
  '"shadow*" style props are deprecated',
  '"textShadow*" style props are deprecated',
  "props.pointerEvents is deprecated",
  "TouchableWithoutFeedback is deprecated",
]);

if (Platform.OS === "web" && typeof console !== "undefined") {
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes('"shadow*"') ||
        args[0].includes('"textShadow*"') ||
        args[0].includes("pointerEvents") ||
        args[0].includes("TouchableWithoutFeedback"))
    ) {
      return;
    }
    origWarn(...args);
  };
}

if (Platform.OS === "web" && typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reasonStr = String(
      event && event.reason
        ? event.reason.stack || event.reason.message || event.reason
        : "",
    );
    if (
      reasonStr.includes("M_ID") ||
      reasonStr.includes("chrome-extension://")
    ) {
      event.preventDefault();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    }
  });
}

function MainNavigator() {
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenName>("splash");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedHunt, setSelectedHunt] = useState<Hunt | null>(null);
  const [hunterName, setHunterName] = useState<string>("");
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number>(3);

  const hunter = useHunter();
  useEffect(() => {
    hunter.setCurrentUser(currentUser);
  }, [currentUser]);

  const authResolvedRef = useRef<ScreenName>("auth");
  const splashDoneRef = useRef<boolean>(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const [token, cachedUser] = await Promise.all([
          getTokenFromStorage(),
          getUserFromStorage(),
        ]);

        if (token) {
          // Token exists in local device storage -> User is authenticated!
          const activeUser: UserProfile = cachedUser || {
            name: "Explorer",
            email: "",
          };
          setCurrentUser(activeUser);
          setHunterName(activeUser.name);
          authResolvedRef.current = "catalog";
          if (splashDoneRef.current) {
            setCurrentScreen("catalog");
          }

          // Silent background sync with server to verify token & get latest profile
          hunterApi
            .getMe()
            .then((freshUser) => {
              if (freshUser) {
                const updatedUser: UserProfile = {
                  name: freshUser.name || activeUser.name,
                  email: freshUser.email || activeUser.email,
                  avatar: freshUser.avatar || activeUser.avatar,
                };
                setCurrentUser(updatedUser);
                setHunterName(updatedUser.name);
                setUserInStorage(updatedUser);
              }
            })
            .catch((err) => {
              console.warn("Background auth sync notice:", err);
              // ONLY redirect to auth if session is genuinely expired/invalidated by backend
              if (
                err?.message?.includes("Session expired") ||
                err?.message?.includes("401") ||
                err?.message?.includes("jwt expired")
              ) {
                setCurrentUser(null);
                authResolvedRef.current = "auth";
                if (splashDoneRef.current) {
                  setCurrentScreen("auth");
                }
              }
              // If it's a network/offline error, keep the user logged in!
            });
        } else {
          // No token stored -> guest mode enabled, directly explore catalog!
          authResolvedRef.current = "catalog";
          if (splashDoneRef.current) {
            setCurrentScreen("catalog");
          }
        }
      } catch (e) {
        console.warn("Auto-login check failed:", e);
        authResolvedRef.current = "catalog";
        if (splashDoneRef.current) {
          setCurrentScreen("catalog");
        }
      }
    };
    initAuth();
  }, []);

  const loadLiveHunts = async () => {
    setIsRefreshing(true);
    try {
      const live = await hunterApi.fetchLiveHunts();
      if (live && Array.isArray(live) && live.length > 0) {
        setHunts(live);
        setSelectedHunt((prev) => prev || live[0]);
      }
    } catch (err) {
      console.warn("Using offline expeditions:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadLiveHunts();
  }, []);

  useEffect(() => {
    if (currentScreen === "catalog") {
      loadLiveHunts();
    }
  }, [currentScreen]);

  const handleSelectHunt = (hunt: Hunt) => {
    setSelectedHunt(hunt);
    setCurrentScreen("hunt-detail");
  };

  const handleBuyNow = async () => {
    if (!selectedHunt) return;
    if (!currentUser) {
      // Prompt user to sign in so permit is bound to their account
      setCurrentScreen("auth");
      return;
    }
    if (selectedHunt.isFree) {
      try {
        await hunterApi.purchaseHuntPermit({
          huntId: selectedHunt.id,
          hunterName: currentUser?.name || hunterName || "Explorer",
          hunterEmail: currentUser?.email || "hunter@treasurebox.app",
          paymentMethod: "FREE_PERMIT",
        });
        setHunts((prev) => prev.filter((h) => h.id !== selectedHunt.id));
        setCurrentScreen("expedition");
      } catch (err: any) {
        setAlertMessage(
          err?.message || "Failed to claim free permit. Another hunter may have claimed it."
        );
      }
    } else {
      setCurrentScreen("checkout");
    }
  };

  const handleCheckoutSuccess = () => {
    setRemainingAttempts(3);
    if (selectedHunt) {
      setHunts((prev) => prev.filter((h) => h.id !== selectedHunt.id));
    }
    setCurrentScreen("expedition");
  };

  const handleCipherSolved = async (sequence: string) => {
    if (!selectedHunt) return;
    try {
      const userEmail = currentUser?.email || hunterName || "hunter@treasurebox.app";
      const result = await hunterApi.verifyCipherSolution(selectedHunt.id, sequence, userEmail);

      if (result.solved) {
        playTreasureUnlockSound();
        setCurrentScreen("cipher-solved");
      } else if (result.locked) {
        setRemainingAttempts(0);
        setAlertMessage(
          result.message ||
            "Expedition Sealed! You have exceeded all 3 attempts. You must repurchase the permit to retry."
        );
        loadLiveHunts();
        setTimeout(() => {
          setCurrentScreen("catalog");
        }, 1800);
      } else {
        const left =
          typeof result.remainingAttempts === "number"
            ? result.remainingAttempts
            : Math.max(0, remainingAttempts - 1);
        setRemainingAttempts(left);
        setAlertMessage(result.message || `Incorrect cipher sequence. ${left} attempt(s) remaining.`);
      }
    } catch (e) {
      console.warn("Offline cipher solve fallback:", e);
      if (sequence === selectedHunt.cipherSequence) {
        playTreasureUnlockSound();
        setCurrentScreen("cipher-solved");
      } else {
        const left = Math.max(0, remainingAttempts - 1);
        setRemainingAttempts(left);
        if (left === 0) {
          setAlertMessage("Expedition Sealed! 3 attempts reached. Please purchase the permit again.");
          setTimeout(() => setCurrentScreen("catalog"), 1500);
        } else {
          setAlertMessage(`Incorrect cipher sequence. ${left} attempt(s) remaining.`);
        }
      }
    }
  };

  const handleClaimConfirmed = async (name: string, photoUri?: string) => {
    setHunterName(name);

    if (selectedHunt) {
      try {
        await hunterApi.submitTreasureClaim({
          huntId: selectedHunt.id,
          hunterName: name,
          hunterEmail: currentUser?.email || "",
          proofPhotoUrl: photoUri,
        });
      } catch (e) {
        console.warn("Claim offline fallback:", e);
      }

      // Mark hunt as found in list
      setHunts((prev) =>
        prev.map((h) =>
          h.id === selectedHunt.id
            ? { ...h, status: "FOUND", claimedBy: name }
            : h
        )
      );
    }
    setCurrentScreen("completed");
  };


  const handleReturnToCatalog = () => {
    setCurrentScreen("catalog");
  };

  const handleOpenProfile = () => {
    if (currentUser) {
      setCurrentScreen("profile");
    } else {
      setCurrentScreen("auth");
    }
  };

  if (currentScreen === "splash") {
    return <SplashScreen onFinish={() => {
      splashDoneRef.current = true;
      setCurrentScreen(authResolvedRef.current);
    }} />;
  }

  return (
    <View style={styles.rootWrapper}>
      <SafeAreaView
        style={[
          styles.container,
          currentScreen === "auth" && { backgroundColor: "#F4F5F4" },
        ]}
        edges={["top", "bottom"]}
      >
        <StatusBar style="dark" />

        {currentScreen === "auth" && (
          <AuthScreen
            onAuthSuccess={(user) => {
              setCurrentUser(user);
              setHunterName(user.name);
              setUserInStorage(user);
              authResolvedRef.current = "catalog";
              setCurrentScreen("catalog");
            }}
            onSkipToGuest={() => {
              authResolvedRef.current = "catalog";
              setCurrentScreen("catalog");
            }}
          />
        )}

        {currentScreen === "catalog" && (
          <CatalogScreen
            hunts={hunts}
            onSelectHunt={handleSelectHunt}
            onOpenMenu={() => setIsDrawerOpen(true)}
            onRefresh={loadLiveHunts}
            isRefreshing={isRefreshing}
            onPressProfile={handleOpenProfile}
          />
        )}

        {currentScreen === "hunt-detail" && selectedHunt && (
          <HuntDetailScreen
            hunt={selectedHunt}
            onBack={() => setCurrentScreen("catalog")}
            onBuyNow={handleBuyNow}
            onPressProfile={handleOpenProfile}
          />
        )}

        {currentScreen === "checkout" && selectedHunt && (
          <CheckoutScreen
            hunt={selectedHunt}
            hunterName={currentUser?.name || hunterName || "Explorer"}
            hunterEmail={currentUser?.email || "hunter@treasurebox.app"}
            onBack={() => setCurrentScreen("hunt-detail")}
            onSuccess={handleCheckoutSuccess}
            onError={(msg) => setAlertMessage(msg)}
            onPressProfile={handleOpenProfile}
          />
        )}

        {currentScreen === "expedition" && selectedHunt && (
          <ExpeditionScreen
            hunt={selectedHunt}
            remainingAttempts={remainingAttempts}
            onBack={() => setCurrentScreen("catalog")}
            onCipherSolved={handleCipherSolved}
            onPressProfile={handleOpenProfile}
          />
        )}

        {currentScreen === "cipher-solved" && selectedHunt && (
          <CipherSolvedScreen
            hunt={selectedHunt}
            onBack={() => setCurrentScreen("expedition")}
            onViewNewLocation={() => setCurrentScreen("location-map")}
            onFoundTreasureAlready={() => setCurrentScreen("confirm-find")}
            onPressProfile={handleOpenProfile}
          />
        )}

        {currentScreen === "location-map" && selectedHunt && (
          <LocationMapScreen
            hunt={selectedHunt}
            onBack={() => setCurrentScreen("cipher-solved")}
            onConfirmFind={() => setCurrentScreen("confirm-find")}
            onPressProfile={handleOpenProfile}
          />
        )}

        {currentScreen === "confirm-find" && (
          <ConfirmFindScreen
            onBack={() => setCurrentScreen("cipher-solved")}
            onClaimConfirmed={handleClaimConfirmed}
            onPressProfile={handleOpenProfile}
          />
        )}

        {currentScreen === "completed" && selectedHunt && (
          <CompletedScreen
            hunt={selectedHunt}
            hunterName={hunterName}
            onReturnToCatalog={handleReturnToCatalog}
            onPressProfile={handleOpenProfile}
          />
        )}

        {currentScreen === "onboarding" && (
          <OnboardingScreen
            onComplete={() => setCurrentScreen("catalog")}
          />
        )}

        {currentScreen === "terms" && (
          <LegalContentScreen
            type="terms"
            onBack={() => setCurrentScreen("catalog")}
          />
        )}

        {currentScreen === "about-us" && (
          <LegalContentScreen
            type="about-us"
            onBack={() => setCurrentScreen("catalog")}
          />
        )}

        {currentScreen === "privacy" && (
          <LegalContentScreen
            type="privacy"
            onBack={() => setCurrentScreen("catalog")}
          />
        )}

        <AlertModal 
          visible={!!alertMessage} 
          message={alertMessage || ""} 
          onClose={() => setAlertMessage(null)} 
        />

        {currentScreen === "profile" && (
          <ProfileScreen
            onBack={() => setCurrentScreen("catalog")}
            onProfileUpdated={(user) => {
              setCurrentUser(user);
              setHunterName(user.name);
            }}
            onSelectHunt={(hunt) => {
              setSelectedHunt(hunt);
              setCurrentScreen("expedition");
            }}
          />
        )}

        {/* Slide-out Sidebar Drawer */}
        <SidebarDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onNavigate={(screen) => setCurrentScreen(screen)}
          currentUser={currentUser}
          onSignOut={() => {
            hunterApi.logout();
            setCurrentUser(null);
            authResolvedRef.current = "catalog";
            setCurrentScreen("catalog");
          }}
          onSignIn={() => {
            setCurrentScreen("auth");
          }}
        />
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    Fraunces: Fraunces_700Bold,
    "Fraunces-Regular": Fraunces_400Regular,
    "Fraunces-SemiBold": Fraunces_600SemiBold,
    "Fraunces-Bold": Fraunces_700Bold,
    "Fraunces-ExtraBold": Fraunces_800ExtraBold,
    "Fraunces-Black": Fraunces_900Black,
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_800ExtraBold,
    Fraunces_900Black,
  });

  // Inject Google Fonts stylesheet and hide scrollbars on Web
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const fontId = "fraunces-google-font";
      if (!document.getElementById(fontId)) {
        const link = document.createElement("link");
        link.id = fontId;
        link.rel = "stylesheet";
        link.href =
          "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&display=swap";
        document.head.appendChild(link);
      }

      const scrollbarId = "app-scrollbar-hider";
      if (!document.getElementById(scrollbarId)) {
        const style = document.createElement("style");
        style.id = scrollbarId;
        style.textContent = `
          *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
          * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
          body { background-color: #161B19; margin: 0; padding: 0; }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <HunterProvider>
          <MainNavigator />
        </HunterProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
    backgroundColor: Platform.OS === "web" ? "#161B19" : colors.parchmentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    backgroundColor: colors.parchmentLight,
    position: "relative",
    overflow: "hidden",
  },
  containerLandscape: {
    maxWidth: "100%",
    width: "100%",
  },
});
