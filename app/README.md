# 🗺️ Treasure Box — Hunter Mobile Application

[![React Native](https://img.shields.io/badge/React%20Native-Expo%20SDK%2057-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Language](https://img.shields.io/badge/Language-English%20%7C%20Arabic%20(RTL)-gold.svg)](https://expo.dev/)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-green.svg)](https://expo.dev/)

The official real-world expedition and treasure hunting mobile application. Takes explorers through a luxury cinematic journey from discovering live expeditions, solving mechanical brass ciphers, decoding photographic hints, to confirming real-world discoveries.

---

## 🧭 The Hunter Journey (App Flow)

```
[ Catalog ] ➔ [ Field Brief ] ➔ [ PayPal Permit ] ➔ [ Stage 1 Expedition ] ➔ [ Cipher Solved ] ➔ [ Camera Find ] ➔ [ Found! ]
```

1. **Expedition Feed:** Browse live hunts with difficulty ratings (`EASY`, `MEDIUM`, `HARD`) and reward values.
2. **Field Brief:** Explore lore, high-resolution photo carousels, and the preview brass cipher lock.
3. **Secure Checkout:** Acquire official hunt permits seamlessly with PayPal.
4. **Stage One Navigation (3-Tab Explorer):**
   - **🔓 Cipher Tab:** Tactile rotating brass cylinder tumblers matching physical markings found in the ruins.
   - **🔍 Hints Tab:** Curated photographic clues and orientation advice.
   - **🧭 Location Tab:** Golden compass and direct one-tap GPS launch into Google Maps or Apple Maps.
5. **Cipher Unlocked:** Smooth radial pulse animation reveals the final cache location upon sequence validation.
6. **Confirm Find:** In-app viewfinder to photograph the physical treasure and input the explorer's name for historical registry credit.
7. **Permanent Lock Modal:** Warns the finder that confirming the discovery permanently locks the hunt, retiring it from the live catalog.

---

## 🌐 Dual Language & Right-To-Left (RTL) Support

- **Instant Switching:** Centralized in the animated sidebar drawer (`EN | AR`).
- **Full Layout Mirroring:** Switches dynamically between Latin typography (LTR) and traditional Arabic typography with native RTL mirroring.

---

## 🎨 Brand Design & Luxury Theme

- **Palette:** Deep Emerald Green (`#0D2823`), Antique Brass Gold (`#E1BF62`), and Parchment Light (`#FBF9F4`).
- **Rounded Brand Emblem:** Custom circular gold coin emblem with rotated dark emerald diamond and center pivot dot.
- **Haptics & Micro-Interactions:** Subtle haptic feedback during cylinder rotation and stage completion.

---

## 📦 Building the Android APK

This repository is pre-configured with `eas.json` for cloud builds:

### Method 1: EAS Cloud Build (Recommended — No Android Studio Required)
```bash
# 1. Login to your free Expo account
npx eas-cli login

# 2. Start the APK build
npx eas-cli build -p android --profile preview
```
*Once finished (5-8 minutes), the CLI outputs a direct `.apk` download link and QR code to install on your phone.*

### Method 2: Local Prebuild
```bash
# Generate native Android project
npx expo prebuild --platform android

# Build release APK via Gradle
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

---

## 💻 Running the Mobile App Locally

```bash
# Install dependencies
npm install

# Start Metro bundler on Web
npm run web

# Start Metro for mobile devices (Scan QR in Expo Go)
npx expo start
```
