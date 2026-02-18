# SteadyLetters iOS — Startup Guide

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| **Node.js** | ≥ 18 | `node -v` |
| **Xcode** | ≥ 16 | `xcode-select -p` |
| **CocoaPods** | ≥ 1.14 | `pod --version` |
| **Expo CLI** | (bundled) | `npx expo --version` |
| **iOS Simulator** | any iPhone | Open Xcode → Settings → Platforms |

## Quick Start (one command)

```bash
cd ios
npm install
npx expo run:ios
```

This will **prebuild** the native Xcode project, install CocoaPods, build, and launch in the iOS Simulator automatically. First run takes ~3-5 minutes.

---

## All Startup Methods

### Method 1: Development Build (Recommended)

Best for: **local development with native modules, debugging, first-time setup.**

```bash
cd ios

# 1. Install JS dependencies
npm install

# 2. Build & run in simulator (prebuilds native project automatically)
npx expo run:ios

# To target a specific simulator:
npx expo run:ios --device "iPhone 17 Pro"

# To run on a physical device (must be connected via USB):
npx expo run:ios --device
```

**What happens:**
- Runs `expo prebuild` to generate the `ios/` Xcode project
- Installs CocoaPods dependencies
- Builds the native app via `xcodebuild`
- Installs and launches on the simulator
- Starts Metro bundler for hot reload

**After first build**, subsequent runs are incremental and much faster (~30s).

---

### Method 2: Xcode (Preferred for Publishing / Advanced Debugging)

Best for: **App Store publishing, native debugging, profiling, certificate management.**

```bash
cd ios

# 1. Install JS dependencies
npm install

# 2. Generate the native Xcode project
npx expo prebuild --platform ios

# 3. Install CocoaPods
cd ios   # (the generated native ios/ subfolder)
pod install
cd ..

# 4. Open in Xcode
open ios/SteadyLetters.xcworkspace
```

**In Xcode:**
1. Select your target device (simulator or physical device) in the top toolbar
2. Press **⌘R** to build and run
3. Metro bundler will start automatically

**For App Store publishing from Xcode:**
1. Select **Product → Archive**
2. In Organizer, click **Distribute App**
3. Follow the signing & upload wizard

> **Note:** Always open the `.xcworkspace` file, NOT the `.xcodeproj`.

---

### Method 3: Expo Go (Quickest, Limited)

Best for: **quick UI previews on physical devices, no native module changes.**

> ⚠️ Expo Go may not be available for the latest iOS Simulator versions (e.g., iOS 26).
> Use Method 1 or 2 for simulators.

```bash
cd ios

# 1. Start Metro bundler
npx expo start

# 2. Scan the QR code with:
#    - iOS Camera app → tap the Expo banner
#    - Or open Expo Go app directly
```

**Limitations:**
- Cannot use custom native modules not in Expo SDK
- Some plugins (RevenueCat, Stripe) won't work
- Only for development, not publishing

---

### Method 4: EAS Build (Cloud Build)

Best for: **CI/CD, team builds, TestFlight distribution without local Xcode.**

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Build for iOS simulator
eas build --platform ios --profile development

# Build for physical device / TestFlight
eas build --platform ios --profile preview
```

---

## Environment Setup

The app reads environment variables from `ios/.env`. Required keys:

```env
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
EXPO_PUBLIC_THANKS_IO_API_KEY=<your-thanks-io-key>
EXPO_PUBLIC_OPENAI_API_KEY=<your-openai-key>
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-key>

# Optional (app works without these):
EXPO_PUBLIC_POSTHOG_API_KEY=
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
EXPO_PUBLIC_REVENUCAT_API_KEY=
EXPO_PUBLIC_APP_URL=https://www.steadyletters.com
```

> The `.env` file is gitignored. Copy from `.env.example` or ask a team member.

---

## Troubleshooting

### Metro port already in use
```bash
lsof -ti:8081 | xargs kill   # Kill existing Metro
npx expo start --clear        # Restart with clean cache
```

### CocoaPods issues
```bash
cd ios/ios   # the native ios subfolder
pod deintegrate
pod install
```

### Clean native build
```bash
npx expo prebuild --clean --platform ios
```

### Xcode build failures
1. Clean build folder: **⌘⇧K** in Xcode
2. Delete DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData`
3. Re-run `pod install`

### Simulator not opening
```bash
# Boot a simulator manually
xcrun simctl boot "iPhone 17 Pro"
open -a Simulator

# Then run
npx expo run:ios --device "iPhone 17 Pro"
```

---

## NPM Scripts Reference

| Script | Description |
|--------|-------------|
| `npm start` | Start Metro bundler only (for Expo Go) |
| `npm run ios` | Build & run on iOS simulator (native build) |
| `npm run web` | Start web version |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:live` | Run live API integration tests |
| `npm run verify` | Verify feature_list.json coverage |
